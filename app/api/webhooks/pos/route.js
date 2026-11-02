import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

export const runtime = "nodejs";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

const safeNumber = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

const safeDate = (value) => {
  if (!value) return null;

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? null
    : date.toISOString();
};

const safeBusinessDate = (value) => {
  if (!value) return null;

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? null
    : date.toISOString().split("T")[0];
};

const calculateMinutes = (startValue, endValue) => {
  const start = safeDate(startValue);
  const end = safeDate(endValue);

  if (!start || !end) return 0;

  const difference =
    new Date(end).getTime() -
    new Date(start).getTime();

  return difference > 0
    ? Number((difference / 60000).toFixed(2))
    : 0;
};

const buildLineItemId = ({
  externalOrderId,
  item,
  index,
}) => {
  const providedId = String(
    item.external_line_item_id ||
      item.line_item_id ||
      item.id ||
      ""
  ).trim();

  if (providedId) return providedId;

   return crypto
    .createHash("sha256")
    .update(
      [
        externalOrderId,
        item.external_item_id || item.item_id || "",
        item.item_name || item.name || "",
        index,
      ].join("|")
    )
    .digest("hex");
};


// =========================================================
// INTEGRATED MENU ITEM HISTORY SYNC
// =========================================================

async function syncIntegratedMenuItemHistory({
  supabaseAdmin,
  userId,
  connectionId,
  locationId,
  incomingItems = [],
}) {
  if (!userId || !incomingItems.length) return [];

  const now = new Date().toISOString();

  const { data: existingRows, error: existingError } =
    await supabaseAdmin
      .from("menu_items")
      .select("*")
      .eq("user_id", userId);

  if (existingError) {
    throw existingError;
  }

  const syncedRows = [];

  for (const incomingItem of incomingItems) {
    const name = String(
      incomingItem.item_name ||
        incomingItem.name ||
        ""
    ).trim();

    if (!name) continue;

    const existing = (existingRows || []).find(
      (item) =>
        String(item.name || "")
          .trim()
          .toLowerCase() ===
        name.toLowerCase()
    );

    const price = Number(
      incomingItem.unit_price || 0
    );

    const quantitySold = Number(
      incomingItem.quantity || 0
    );

    const revenue = Number(
      incomingItem.net_sales ||
        incomingItem.gross_sales ||
        price * quantitySold ||
        0
    );

    if (existing) {
      const existingPrice = Number(existing.price || 0);
const existingCost = Number(existing.cost || 0);
const existingMargin = Number(existing.margin || 0);
const existingQuantitySold = Number(
  existing.quantity_sold || 0
);
const existingRevenue = Number(existing.revenue || 0);

const nextPrice =
  price > 0 ? price : existingPrice;

const priceChanged =
  existingPrice > 0 &&
  nextPrice > 0 &&
  Math.abs(nextPrice - existingPrice) > 0.01;

const nextQuantitySold =
  existingQuantitySold + quantitySold;

const nextRevenue =
  existingRevenue + revenue;

const nextMargin =
  nextPrice > 0
    ? ((nextPrice - existingCost) / nextPrice) * 100
    : existingMargin;
      const { data: updatedRows, error } =
        await supabaseAdmin
          .from("menu_items")
          .update({
           // Only create a new verification baseline when
// the integrated menu price actually changes.
previous_price: priceChanged
  ? existingPrice
  : Number(existing.previous_price || 0),

previous_cost: priceChanged
  ? existingCost
  : Number(existing.previous_cost || 0),

previous_margin: priceChanged
  ? existingMargin
  : Number(existing.previous_margin || 0),

previous_quantity_sold: priceChanged
  ? existingQuantitySold
  : Number(existing.previous_quantity_sold || 0),

// Current live values
price: nextPrice,
cost: existingCost,
quantity_sold: nextQuantitySold,
revenue: nextRevenue,
margin: nextMargin,

integration_connection_id:
  connectionId || null,

location_id:
  locationId || null,

is_active: true,
last_seen_at: now,
          })
          .eq("id", existing.id)
          .select();

      if (error) throw error;

      if (updatedRows?.[0]) {
        syncedRows.push(updatedRows[0]);
      }
    } else {
      const { data: insertedRows, error } =
        await supabaseAdmin
          .from("menu_items")
          .insert([
            {
              user_id: userId,
              name,
              category: "Uncategorized",

              price,
              cost: 0,

              quantity_sold: quantitySold,
              revenue,

              margin: 0,

              previous_price: 0,
              previous_cost: 0,
              previous_margin: 0,
              previous_quantity_sold: 0,
integration_connection_id: connectionId || null,
              location_id: locationId || null,

              is_active: true,
              created_at: now,
              last_seen_at: now,
            },
          ])
          .select();

      if (error) throw error;

      if (insertedRows?.[0]) {
        syncedRows.push(insertedRows[0]);
      }
    }
  }

  return syncedRows;
}


export async function POST(request) {
  let webhookEventRowId = null;

  // Unique identifier for this webhook processing attempt.
  // Used by database claim, completion, and failure functions.
  const processingClaimToken = crypto.randomUUID();

  try {
    // ========================================
// GENERIC POS TEST WEBHOOK ENVIRONMENT GATE
// ========================================

// This endpoint currently supports only Serven's
// generic test integration, not production POS providers.
if (process.env.NODE_ENV === "production") {
  return NextResponse.json(
    {
      success: false,
      error:
        "Generic POS test webhooks are disabled in production.",
    },
    { status: 403 }
  );
}
    const suppliedSecret =
      request.headers.get("x-serven-webhook-secret");

    const expectedSecret =
      process.env.POS_WEBHOOK_TEST_SECRET;

    if (
      !expectedSecret ||
      suppliedSecret !== expectedSecret
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid webhook secret.",
        },
        { status: 401 }
      );
    }

    const connectionId = String(
      request.headers.get(
        "x-serven-connection-id"
      ) || ""
    ).trim();

    if (!connectionId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Missing x-serven-connection-id header.",
        },
        { status: 400 }
      );
    }

    const body = await request.json();

    const eventId = String(
      body.event_id ||
        body.eventId ||
        ""
    ).trim();

    const eventType = String(
      body.event_type ||
        body.eventType ||
        body.type ||
        ""
    )
      .trim()
      .toLowerCase();

    if (!eventId) {
      return NextResponse.json(
        {
          success: false,
          error: "event_id is required.",
        },
        { status: 400 }
      );
    }

    if (!eventType) {
      return NextResponse.json(
        {
          success: false,
          error: "event_type is required.",
        },
        { status: 400 }
      );
    }

    const {
      data: connection,
      error: connectionError,
    } = await supabaseAdmin
      .from("integration_connections")
      .select("*")
      .eq("id", connectionId)
      .eq("provider", "generic")
      .eq("connection_status", "active")
      .single();

    if (connectionError || !connection) {
      return NextResponse.json(
        {
          success: false,
          error:
            connectionError?.message ||
            "Active generic integration connection not found.",
        },
        { status: 404 }
      );
    }

    const {
      data: existingEvent,
      error: existingEventError,
    } = await supabaseAdmin
      .from("pos_webhook_events")
      .select("id, processing_status")
      .eq("provider", "generic")
      .eq("external_event_id", eventId)
      .maybeSingle();

    if (existingEventError) {
      throw existingEventError;
    }

 if (existingEvent) {
  const existingStatus = String(
    existingEvent.processing_status || ""
  ).toLowerCase();

  if (existingStatus === "processed") {
    return NextResponse.json({
      success: true,
      duplicate: true,
      message: "Webhook event was already processed.",
      eventId,
      processingStatus: existingStatus,
    });
  }

  // Reuse the existing event for a retry.
  // The database claim function determines whether
  // this processing attempt is allowed.
  webhookEventRowId = existingEvent.id;
}

 if (!existingEvent) {
  const {
    data: webhookEvent,
    error: webhookInsertError,
  } = await supabaseAdmin
    .from("pos_webhook_events")
    .upsert(
      {
        provider: "generic",
        external_event_id: eventId,
        event_type: eventType,
        user_id: connection.user_id,
        integration_connection_id: connection.id,
        processing_status: "received",
        payload: body,
      },
      {
        onConflict: "provider,external_event_id",
        ignoreDuplicates: true,
      }
    )
    .select("id")
    .maybeSingle();

  if (webhookInsertError) {
    throw webhookInsertError;
  }

  if (webhookEvent?.id) {
    webhookEventRowId = webhookEvent.id;
  } else {
    // Another request inserted the same event first.
    const {
      data: concurrentEvent,
      error: concurrentEventError,
    } = await supabaseAdmin
      .from("pos_webhook_events")
      .select("id")
      .eq("provider", "generic")
      .eq("external_event_id", eventId)
      .single();

    if (concurrentEventError || !concurrentEvent) {
      throw concurrentEventError ||
        new Error("Unable to retrieve existing POS webhook event.");
    }

    webhookEventRowId = concurrentEvent.id;
  }
}

// Atomically claim this event before processing its order.
const { data: eventClaimed, error: claimError } =
  await supabaseAdmin.rpc("claim_pos_webhook_event", {
    p_event_id: webhookEventRowId,
    p_claim_token: processingClaimToken,
  });

if (claimError) {
  throw claimError;
}
if (eventClaimed !== true) {
  return NextResponse.json(
    {
      success: false,
      duplicate: true,
      message:
        "POS webhook event is already being processed or is not eligible for a new claim.",
      eventId,
      processingStatus: "claim_rejected",
    },
    {
      status: 409,
    }
  );
}

const order = body.order || body.data || {};

    const externalOrderId = String(
      order.external_order_id ||
        order.order_id ||
        order.pos_order_id ||
        order.id ||
        ""
    ).trim();

    if (!externalOrderId) {
      throw new Error(
        "The webhook order is missing external_order_id."
      );
    }

    const openedAt = safeDate(
      order.opened_at ||
        order.created_at ||
        order.order_opened_at
    );

    const sentToKitchenAt = safeDate(
      order.sent_to_kitchen_at ||
        order.kitchen_sent_at
    );

    const completedAt = safeDate(
      order.completed_at ||
        order.fulfilled_at
    );

    const closedAt = safeDate(
      order.closed_at ||
        order.paid_at
    );

    const subtotal = safeNumber(order.subtotal);
    const discounts = safeNumber(order.discounts);
    const taxes = safeNumber(order.taxes);
    const tips = safeNumber(order.tips);
    const refunds = safeNumber(order.refunds);
    const total = safeNumber(
      order.total,
      subtotal -
        discounts +
        taxes +
        tips -
        refunds
    );
    const netSales = safeNumber(
      order.net_sales,
      subtotal - discounts - refunds
    );

    const orderStatus = String(
      order.order_status ||
        order.status ||
        (eventType.includes("closed")
          ? "closed"
          : eventType.includes("completed") ||
            eventType.includes("bumped")
          ? "completed"
          : "open")
    ).toLowerCase();

    const {
      data: posOrder,
      error: orderUpsertError,
    } = await supabaseAdmin
      .from("pos_orders")
      .upsert(
        {
          user_id: connection.user_id,
          location_id:
            connection.location_id || null,
          integration_connection_id:
            connection.id,

          provider: "generic",
          external_order_id: externalOrderId,
          external_location_id:
            connection.external_location_id ||
            order.external_location_id ||
            null,

          order_status: orderStatus,
          dining_option:
            order.dining_option || null,
          revenue_center:
            order.revenue_center || null,

          table_id:
            order.table_id || null,
          table_name:
            order.table_name || null,
          guest_count: Math.max(
            0,
            Math.round(
              safeNumber(order.guest_count)
            )
          ),

          opened_at: openedAt,
          sent_to_kitchen_at: sentToKitchenAt,
          completed_at: completedAt,
          closed_at: closedAt,

          business_date: safeBusinessDate(
            order.business_date ||
              openedAt ||
              closedAt
          ),

          subtotal,
          discounts,
          taxes,
          tips,
          refunds,
          total,
          net_sales: netSales,

          raw_payload: order,
          updated_at:
            new Date().toISOString(),
        },
        {
          onConflict:
            "provider,external_order_id,user_id",
        }
      )
      .select("*")
      .single();

    if (orderUpsertError) {
      throw orderUpsertError;
    }

    const items = Array.isArray(order.items)
      ? order.items
      : [];

    let savedItemCount = 0;

    if (items.length > 0) {
      const normalizedItems = items.map(
        (item, index) => {
          const quantity = Math.max(
            0,
            safeNumber(item.quantity, 1)
          );

          const unitPrice = safeNumber(
            item.unit_price ||
              item.price
          );

          const grossSales = safeNumber(
            item.gross_sales,
            quantity * unitPrice
          );

          const itemDiscounts = safeNumber(
            item.discounts
          );

          const itemNetSales = safeNumber(
            item.net_sales,
            grossSales - itemDiscounts
          );

          const itemSentAt = safeDate(
            item.sent_to_kitchen_at ||
              sentToKitchenAt
          );

          const itemCompletedAt = safeDate(
            item.completed_at ||
              completedAt
          );

          return {
            user_id: connection.user_id,
            location_id:
              connection.location_id || null,

            pos_order_id: posOrder.id,

            provider: "generic",
            external_order_id:
              externalOrderId,

            external_item_id: String(
              item.external_item_id ||
                item.item_id ||
                ""
            ).trim() || null,

            external_line_item_id:
              buildLineItemId({
                externalOrderId,
                item,
                index,
              }),

            menu_item_id: null,

            item_name: String(
              item.item_name ||
                item.name ||
                "Unknown Item"
            ).trim(),

            quantity,
            unit_price: unitPrice,
            gross_sales: grossSales,
            discounts: itemDiscounts,
            net_sales: itemNetSales,

            station:
              item.station || null,

            modifiers: Array.isArray(
              item.modifiers
            )
              ? item.modifiers
              : [],

            sent_to_kitchen_at:
              itemSentAt,

            completed_at:
              itemCompletedAt,

            target_prep_minutes:
              Math.max(
                0,
                safeNumber(
                  item.target_prep_minutes
                )
              ),

            actual_prep_minutes:
              calculateMinutes(
                itemSentAt,
                itemCompletedAt
              ),

            raw_payload: item,
            updated_at:
              new Date().toISOString(),
          };
        }
      );

      const {
        data: savedItems,
        error: itemUpsertError,
      } = await supabaseAdmin
        .from("pos_order_items")
       .upsert(normalizedItems, {
  onConflict:
    "user_id,provider,pos_order_id,external_line_item_id",
})
        .select("id");

      if (itemUpsertError) {
        throw itemUpsertError;
      }

     savedItemCount =
  savedItems?.length || 0;

// Menu-item financial totals must be derived from
// reconciled POS transactions, not incremented
// on every webhook event.
//
// Preserve the operational POS line items.
// Do not mutate cumulative menu sales here.
    }

 const {
  data: eventCompleted,
  error: processedEventError,
} = await supabaseAdmin.rpc(
  "complete_pos_webhook_event",
  {
    p_event_id: webhookEventRowId,
    p_claim_token: processingClaimToken,
  }
);

if (processedEventError) {
  throw processedEventError;
}

if (eventCompleted !== true) {
  throw new Error(
    "POS webhook completion rejected: processing claim is no longer valid."
  );
}

    await supabaseAdmin
      .from("integration_connections")
      .update({
        last_synced_at:
          new Date().toISOString(),
        updated_at:
          new Date().toISOString(),
      })
      .eq("id", connection.id);

    return NextResponse.json({
      success: true,
      duplicate: false,
      provider: "generic",
      eventId,
      eventType,
      connectionId: connection.id,
      posOrderId: posOrder.id,
      externalOrderId,
      savedItemCount,
      orderStatus: posOrder.order_status,
    });
  } catch (error) {
    console.error(
      "GENERIC POS WEBHOOK FAILED:",
      error
    );

  if (webhookEventRowId) {
  const {
    data: eventFailed,
    error: failureUpdateError,
  } = await supabaseAdmin.rpc(
    "fail_pos_webhook_event",
    {
      p_event_id: webhookEventRowId,
      p_claim_token: processingClaimToken,
      p_error:
        error?.message ||
        "Unknown processing error",
    }
  );

  if (failureUpdateError) {
    console.error(
      "POS WEBHOOK FAILURE STATUS UPDATE ERROR:",
      failureUpdateError
    );
  } else if (eventFailed !== true) {
    console.warn(
      "POS WEBHOOK FAILURE STATUS NOT UPDATED: claim no longer valid.",
      webhookEventRowId
    );
  }
}

    return NextResponse.json(
      {
        success: false,
        error:
          error?.message ||
          "Internal POS webhook error.",
      },
      { status: 500 }
    );
  }
}