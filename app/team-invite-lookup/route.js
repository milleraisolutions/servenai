
import { createClient } from "@supabase/supabase-js";
import { createHash } from "node:crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    const { token } = await req.json();

    if (
      typeof token !== "string" ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(token)
    ) {
      return Response.json(
        { success: false, error: "Invalid invitation." },
        { status: 400 }
      );
    }

    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      console.error("Team invite lookup is not configured.");

      return Response.json(
        { success: false, error: "Service unavailable." },
        { status: 500 }
      );
    }

    const supabaseAdmin = createClient(
      supabaseUrl,
      serviceRoleKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );

    const { data: invite, error } = await supabaseAdmin
      .from("team_invites")
      .select(
        "id,name,email,role,location_name,status"
      )
      .eq("invite_token", token)
      .eq("status", "pending")
      .maybeSingle();

    if (error) {
      console.error("Invitation lookup failed:", {
        code: error.code,
      });

      return Response.json(
        { success: false, error: "Unable to load invitation." },
        { status: 500 }
      );
    }

    if (!invite) {
      return Response.json(
        {
          success: false,
          error: "Invitation not found or no longer available.",
        },
        { status: 404 }
      );
    }

    return Response.json(
      {
        success: true,
        invite: {
          id: invite.id,
          name: invite.name,
          email: invite.email,
          role: invite.role,
          location_name: invite.location_name,
        },
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("Invitation lookup error:", error);

    return Response.json(
      { success: false, error: "Unable to load invitation." },
      { status: 500 }
    );
  }
}
