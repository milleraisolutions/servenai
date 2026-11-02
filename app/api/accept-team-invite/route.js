import { createClient } from "@supabase/supabase-js";

export async function POST(req) {
  try {
    const { inviteId } = await req.json();

    if (
      typeof inviteId !== "string" ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        inviteId
      )
    ) {
      return Response.json(
        {
          success: false,
          error: "A valid invitation ID is required.",
        },
        { status: 400 }
      );
    }

    const authorizationHeader =
      req.headers.get("authorization") || "";

    const accessToken = authorizationHeader.startsWith("Bearer ")
      ? authorizationHeader.slice(7).trim()
      : "";

    if (!accessToken) {
      return Response.json(
        {
          success: false,
          error: "You must be signed in to accept this invitation.",
        },
        { status: 401 }
      );
    }

    const supabase = createClient(
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

    // Confirm the token belongs to a real authenticated user.
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(accessToken);

    if (authError || !user?.id) {
      return Response.json(
        {
          success: false,
          error: "Your session is invalid or expired.",
        },
        { status: 401 }
      );
    }

    // PostgreSQL validates the invitation, verified email,
    // existing profile, company ownership, and location IDs.
    // All database changes happen in one transaction.
    const { error: acceptanceError } = await supabase.rpc(
      "accept_team_invite_secure",
      {
        p_invite_id: inviteId,
      }
    );

    if (acceptanceError) {
      console.error(
        "SECURE TEAM INVITE ACCEPTANCE ERROR:",
        acceptanceError
      );

      return Response.json(
        {
          success: false,
          error: acceptanceError.message,
        },
        { status: 400 }
      );
    }

    return Response.json({
      success: true,
    });
  } catch (error) {
    console.error("TEAM INVITE API ERROR:", error);

    return Response.json(
      {
        success: false,
        error: "Unable to process the invitation.",
      },
      { status: 500 }
    );
  }
}