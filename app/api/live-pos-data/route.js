import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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

const getBearerToken = (request) => {
  const authorization =
    request.headers.get("authorization") || "";

  if (!authorization.startsWith("Bearer ")) {
    return "";
  }

  return authorization.slice(7).trim();
};

export async function GET(request) {
  try {
    const accessToken = getBearerToken(request);

    if (!accessToken) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing access token.",
        },
        { status: 401 }
      );
    }

    const {
      data: { user },
      error: userError,
    } = await supabaseAdmin.auth.getUser(accessToken);

    if (userError || !user?.id) {
      return NextResponse.json(
        {
          success: false,
          error:
            userError?.message ||
            "Authenticated user could not be verified.",
        },
        { status: 401 }
      );
    }

    const requestedOwnerId = String(
      new URL(request.url).searchParams.get("ownerId") ||
        user.id
    ).trim();

    /*
     * For now, only allow users to request their own POS data.
     * We will extend this later for verified team-member access.
     */
    if (requestedOwnerId !== user.id) {
      return NextResponse.json(
        {
          success: false,
          error:
            "You are not authorized to view this owner's live POS data.",
        },
        { status: 403 }
      );
    }

    const [ordersResult, itemsResult] = await Promise.all([
      supabaseAdmin
        .from("pos_orders")
        .select("*")
        .eq("user_id", requestedOwnerId)
        .order("opened_at", {
          ascending: false,
        })
        .limit(5000),

      supabaseAdmin
        .from("pos_order_items")
        .select("*")
        .eq("user_id", requestedOwnerId)
        .order("sent_to_kitchen_at", {
          ascending: false,
        })
        .limit(10000),
    ]);

    if (ordersResult.error) {
      throw ordersResult.error;
    }

    if (itemsResult.error) {
      throw itemsResult.error;
    }

    return NextResponse.json({
      success: true,
      ownerId: requestedOwnerId,
      orders: ordersResult.data || [],
      items: itemsResult.data || [],
      orderCount: ordersResult.data?.length || 0,
      itemCount: itemsResult.data?.length || 0,
    });
  } catch (error) {
    console.error("LIVE POS API FAILED:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error?.message ||
          "Live POS data could not be loaded.",
      },
      { status: 500 }
    );
  }
}