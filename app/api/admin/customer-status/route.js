
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const SERVEN_OWNER_USER_ID =
  "908d0bc7-6792-425b-abdb-476cd4612a71";

const ALLOWED_STATUSES = new Set([
  "lead",
  "pilot",
  "active",
  "inactive",
  "cancelled",
]);

export async function POST(req) {
  try {
    const authorization =
      req.headers.get("authorization") || "";

    const accessToken = authorization.startsWith("Bearer ")
      ? authorization.slice(7).trim()
      : "";

    if (!accessToken) {
      return NextResponse.json(
        { success: false, error: "Authentication required." },
        { status: 401 }
      );
    }

    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(accessToken);

    if (authError || !user?.id) {
      return NextResponse.json(
        { success: false, error: "Invalid authentication session." },
        { status: 401 }
      );
    }

    if (user.id !== SERVEN_OWNER_USER_ID) {
      return NextResponse.json(
        { success: false, error: "Administrator access required." },
        { status: 403 }
      );
    }

    const supabaseUser = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        global: {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );

    const {
      data: isPlatformAdmin,
      error: adminError,
    } = await supabaseUser.rpc("is_serven_platform_admin");

    if (adminError || isPlatformAdmin !== true) {
      return NextResponse.json(
        { success: false, error: "Administrator authorization denied." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const userId = String(body?.userId || "").trim();
    const newStatus = String(body?.newStatus || "")
      .trim()
      .toLowerCase();

    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId) ||
      !ALLOWED_STATUSES.has(newStatus)
    ) {
      return NextResponse.json(
        { success: false, error: "Invalid customer or status." },
        { status: 400 }
      );
    }

    // Update lifecycle status only.
    // Pilot activation is intentionally NOT enabled here yet.
    const { data, error } = await supabaseAdmin
      .from("users")
      .update({ customer_status: newStatus })
      .eq("id", userId)
      .select("id, customer_status")
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      return NextResponse.json(
        { success: false, error: "Customer not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      customer: data,
    });
  } catch (error) {
    console.error("CUSTOMER STATUS API ERROR:", error);

    return NextResponse.json(
      { success: false, error: "Customer status update failed." },
      { status: 500 }
    );
  }
}
