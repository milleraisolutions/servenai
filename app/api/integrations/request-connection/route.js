
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    const authHeader =
      request.headers.get("authorization") || "";

    const accessToken = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7).trim()
      : "";

    if (!accessToken) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 }
      );
    }

    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(accessToken);

    if (authError || !user?.id) {
      return NextResponse.json(
        { error: "Invalid authentication." },
        { status: 401 }
      );
    }

    const body = await request.json();

    const provider = String(body?.provider || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "_");

    const category = String(body?.category || "").trim();

    const locationId = body?.locationId || null;

    if (
      !provider ||
      !category ||
      provider.length > 100 ||
      category.length > 100
    ) {
      return NextResponse.json(
        { error: "Invalid integration request." },
        { status: 400 }
      );
    }

    // The authenticated account owns this request.
    // Client-supplied owner IDs are intentionally ignored.
    const ownerId = user.id;

    let locationName = null;

    if (locationId) {
      const { data: location, error: locationError } =
        await supabaseAdmin
          .from("locations")
          .select("id, location_name")
          .eq("id", locationId)
          .eq("user_id", ownerId)
          .maybeSingle();

      if (locationError || !location) {
        return NextResponse.json(
          { error: "Invalid restaurant location." },
          { status: 403 }
        );
      }

      locationName = location.location_name || null;
    }

    let existingQuery = supabaseAdmin
      .from("restaurant_connections")
      .select("id, status")
      .eq("user_id", ownerId)
      .eq("provider", provider);

    existingQuery = locationId
      ? existingQuery.eq("location_id", locationId)
      : existingQuery.is("location_id", null);

    const {
      data: existingConnection,
      error: existingError,
    } = await existingQuery.maybeSingle();

    if (existingError) {
      throw existingError;
    }

   if (existingConnection) {
  const currentStatus = String(
    existingConnection.status || ""
  ).toLowerCase();

  if (currentStatus === "disconnected") {
    const { data: reconnected, error: reconnectError } =
      await supabaseAdmin
        .from("restaurant_connections")
        .update({
          status: "pending",
          connection_type: "manual",
          last_sync_status: "awaiting_authorization",
          last_sync_error: null,
          external_account_id: null,
          external_location_id: null,
          token_expires_at: null,
          metadata: {
            location_name: locationName,
            connection_source: "connected_data",
          },
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingConnection.id)
        .eq("user_id", ownerId)
        .eq("status", "disconnected")
        .select("id")
        .maybeSingle();

    if (reconnectError) {
      console.error(
        "RECONNECT REQUEST ERROR:",
        reconnectError
      );

      return NextResponse.json(
        { error: "Could not request reconnection." },
        { status: 500 }
      );
    }

    if (!reconnected) {
      return NextResponse.json(
        { error: "Connection status changed. Please refresh." },
        { status: 409 }
      );
    }

    return NextResponse.json({
      success: true,
      reconnected: true,
      status: "pending",
      authorizationVerified: false,
    });
  }

  return NextResponse.json({
    success: true,
    alreadyExists: true,
    status: existingConnection.status,
  });
}

    const { error: insertError } = await supabaseAdmin
      .from("restaurant_connections")
      .insert({
        user_id: ownerId,
        location_id: locationId,
        provider,
        category,
        status: "pending",
        connection_type: "manual",
        last_sync_status: "awaiting_authorization",
        metadata: {
          location_name: locationName,
          connection_source: "connected_data",
        },
      });

    if (insertError) {
      console.error(
        "CONNECTION REQUEST INSERT ERROR:",
        insertError
      );

      return NextResponse.json(
        { error: "Could not create connection request." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      status: "pending",
      authorizationVerified: false,
    });
  } catch (error) {
    console.error("CONNECTION REQUEST API ERROR:", error);

    return NextResponse.json(
      { error: "Connection request failed." },
      { status: 500 }
    );
  }
}
