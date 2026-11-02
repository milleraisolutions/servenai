
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
        { error: "Invalid or expired authentication." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const connectionId = String(
      body?.connectionId || ""
    ).trim();

    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        connectionId
      )
    ) {
      return NextResponse.json(
        { error: "Invalid connection ID." },
        { status: 400 }
      );
    }

    // Only the authenticated restaurant owner can
    // disconnect this connection.
    const ownerId = user.id;

    const { data: connection, error: connectionError } =
      await supabaseAdmin
        .from("restaurant_connections")
        .select("id, user_id, provider, status")
        .eq("id", connectionId)
        .eq("user_id", ownerId)
        .maybeSingle();

    if (connectionError) {
      throw connectionError;
    }

    if (!connection) {
      return NextResponse.json(
        { error: "Connection not found or access denied." },
        { status: 404 }
      );
    }

    const { data: disconnected, error: disconnectError } =
      await supabaseAdmin.rpc(
        "disconnect_restaurant_integration",
        {
          p_connection_id: connectionId,
          p_owner_id: ownerId,
        }
      );

    if (disconnectError) {
      throw disconnectError;
    }

    if (!disconnected) {
      return NextResponse.json(
        { error: "Connection could not be disconnected." },
        { status: 409 }
      );
    }

    return NextResponse.json({
      success: true,
      connectionId,
      status: "disconnected",
    });
  } catch (error) {
    console.error(
      "DISCONNECT CONNECTION API ERROR:",
      error
    );

    return NextResponse.json(
      { error: "Failed to disconnect integration." },
      { status: 500 }
    );
  }
}
