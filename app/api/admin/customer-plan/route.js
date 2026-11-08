
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const ADMIN_USER_ID = "908d0bc7-6792-425b-abdb-476cd4612a71";

const VALID_PLANS = new Set(["starter", "growth", "pro"]);

export async function POST(request) {
  try {
    const authorization = request.headers.get("authorization") || "";

    if (!authorization.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 }
      );
    }

    const accessToken = authorization.slice(7).trim();

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !anonKey || !serviceKey) {
      return NextResponse.json(
        { error: "Server configuration unavailable." },
        { status: 500 }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: authData, error: authError } =
      await supabaseAdmin.auth.getUser(accessToken);

    if (authError || !authData?.user?.id) {
      return NextResponse.json(
        { error: "Invalid administrator session." },
        { status: 401 }
      );
    }

    if (authData.user.id !== ADMIN_USER_ID) {
      return NextResponse.json(
        { error: "Administrator access denied." },
        { status: 403 }
      );
    }

    const supabaseUser = createClient(supabaseUrl, anonKey, {
      global: {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: isAdmin, error: adminError } =
      await supabaseUser.rpc("is_serven_platform_admin");

    if (adminError || isAdmin !== true) {
      return NextResponse.json(
        { error: "Administrator verification failed." },
        { status: 403 }
      );
    }

    const { userId, newPlan } = await request.json();

    const uuidPattern =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (typeof userId !== "string" || !uuidPattern.test(userId)) {
      return NextResponse.json(
        { error: "Invalid customer ID." },
        { status: 400 }
      );
    }

    if (!VALID_PLANS.has(newPlan)) {
      return NextResponse.json(
        { error: "Invalid SerVen plan." },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("users")
      .update({ plan: newPlan })
      .eq("id", userId)
      .select("id, plan")
      .single();

    if (error) {
      console.error("ADMIN PLAN UPDATE ERROR:", error);
      return NextResponse.json(
        { error: "Could not update customer plan." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      customer: data,
    });
  } catch (error) {
    console.error("CUSTOMER PLAN API ERROR:", error);
    return NextResponse.json(
      { error: "Customer plan update failed." },
      { status: 500 }
    );
  }
}
