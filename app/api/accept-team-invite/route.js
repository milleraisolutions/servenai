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
// ========================================
// SYNC MULTI-LOCATION ASSIGNMENTS
// ========================================

const inviteLocationIds = Array.isArray(invite.location_ids)
  ? invite.location_ids.filter(Boolean)
  : [];

// Always clear existing assignments first so
// re-invites / role changes cannot leave stale access behind.
const {
  error: assignmentDeleteError,
} = await supabaseAdmin
  .from("user_location_assignments")
  .delete()
  .eq("user_id", userId);

if (assignmentDeleteError) {
  return Response.json(
    {
      success: false,
      error: assignmentDeleteError.message,
    },
    { status: 500 }
  );
}

if (
  invite.role === "regional_director" &&
  inviteLocationIds.length > 0
) {
  // Validate that every selected location belongs
  // to the owner who issued the invite.
  const {
    data: validLocations,
    error: locationValidationError,
  } = await supabaseAdmin
    .from("locations")
    .select("id")
    .eq("user_id", invite.owner_user_id)
    .in("id", inviteLocationIds);

  if (locationValidationError) {
    return Response.json(
      {
        success: false,
        error: locationValidationError.message,
      },
      { status: 500 }
    );
  }

  const validLocationIds = new Set(
    (validLocations || []).map((location) =>
      String(location.id)
    )
  );

  const invalidLocationIds = inviteLocationIds.filter(
    (locationId) =>
      !validLocationIds.has(String(locationId))
  );

  if (invalidLocationIds.length > 0) {
    return Response.json(
      {
        success: false,
        error:
          "One or more assigned locations do not belong to this restaurant account.",
      },
      { status: 400 }
    );
  }

  const assignmentRows = inviteLocationIds.map(
    (locationId) => ({
      user_id: userId,
      owner_user_id: invite.owner_user_id,
      location_id: locationId,
      role: invite.role,
    })
  );

  const {
    error: assignmentInsertError,
  } = await supabaseAdmin
    .from("user_location_assignments")
    .insert(assignmentRows);

  if (assignmentInsertError) {
    return Response.json(
      {
        success: false,
        error: assignmentInsertError.message,
      },
      { status: 500 }
    );
  }
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