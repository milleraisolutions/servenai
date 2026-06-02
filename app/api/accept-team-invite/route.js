import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  try {
    const { inviteId, userId } = await req.json();

    const { data: invite, error: inviteError } = await supabaseAdmin
      .from("team_invites")
      .select("*")
      .eq("id", inviteId)
      .eq("status", "pending")
      .maybeSingle();

    if (inviteError || !invite) {
      return Response.json(
        { success: false, error: "Invite not found or expired." },
        { status: 404 }
      );
    }

    const { error: profileError } = await supabaseAdmin.from("users").upsert([
      {
        id: userId,
        email: invite.email,
        role: invite.role,
        owner_user_id: invite.owner_user_id,
        location_name: invite.location_name,
        plan: "team",
      },
    ]);

    if (profileError) {
      return Response.json(
        { success: false, error: profileError.message },
        { status: 500 }
      );
    }

    const { error: updateError } = await supabaseAdmin
      .from("team_invites")
      .update({
        status: "accepted",
        accepted_user_id: userId,
      })
      .eq("id", invite.id);

    if (updateError) {
      return Response.json(
        { success: false, error: updateError.message },
        { status: 500 }
      );
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}