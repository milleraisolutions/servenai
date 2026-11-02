
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";

const escapeHtml = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character];
  });

export async function POST(req) {
  try {
    const authorization = req.headers.get("authorization") || "";
    const match = authorization.match(/^Bearer\s+(.+)$/i);

    if (!match) {
      return Response.json(
        { success: false, error: "Authentication required." },
        { status: 401 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey =
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Supabase configuration is missing.");
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${match[1]}`,
        },
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(match[1]);

    if (authError || !user?.id) {
      return Response.json(
        { success: false, error: "Invalid session." },
        { status: 401 }
      );
    }

    const { inviteId } = await req.json();

    if (
      typeof inviteId !== "string" ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        inviteId
      )
    ) {
      return Response.json(
        { success: false, error: "Valid invitation ID required." },
        { status: 400 }
      );
    }

    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select(
  "id, role, account_type, business_id, owner_user_id, removed_at, status"
)
      .eq("id", user.id)
      .single();

   if (
  profileError ||
  !profile ||
  !["owner", "restaurant_owner", "executive"].includes(profile.role) ||
  profile.account_type !== "restaurant" ||
  profile.owner_user_id !== null ||
  profile.removed_at !== null ||
  profile.status !== "active" ||
  !profile.business_id
) {
      return Response.json(
        { success: false, error: "Not authorized to send invitations." },
        { status: 403 }
      );
    }
const {
  data: canManageInvitations,
  error: businessAccessError,
} = await supabase.rpc(
  "can_manage_restaurant_invitations"
);

if (businessAccessError || canManageInvitations !== true) {
  console.error(
    "TEAM INVITE BUSINESS AUTHORIZATION FAILED:",
    businessAccessError
  );

  return Response.json(
    {
      success: false,
      error: "An active registered restaurant business is required.",
    },
    { status: 403 }
  );
}
    const { data: invite, error: inviteError } = await supabase
      .from("team_invites")
      .select(
        "id, owner_user_id, name, email, role, location_name, status, invite_token"
      )
      .eq("id", inviteId)
      .eq("owner_user_id", user.id)
      .eq("status", "pending")
      .single();

    if (
      inviteError ||
      !invite ||
      !invite.invite_token ||
      !invite.email
    ) {
      return Response.json(
        { success: false, error: "Pending invitation not found." },
        { status: 404 }
      );
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    const invitationUrl = new URL(
      "/accept-invite",
      "https://servenai.com"
    );
    invitationUrl.searchParams.set("token", invite.invite_token);

    const { data, error } = await resend.emails.send({
      from: "Serven AI <support@servenai.com>",
      to: invite.email,
      subject: "You've Been Invited To Serven",
      html: `
        <div style="font-family:Arial;padding:24px;">
          <h1>You've Been Invited To Serven</h1>
          <p>Hello ${escapeHtml(invite.name || "Team Member")},</p>
          <p>
            You were invited as a
            <strong>${escapeHtml(invite.role)}</strong>
            for ${escapeHtml(
              invite.location_name || "your assigned restaurant location(s)"
            )}.
          </p>
          <p>
            Access your management dashboard and begin collaborating
            with your restaurant team.
          </p>
          <a
            href="${escapeHtml(invitationUrl.toString())}"
            style="display:inline-block;padding:14px 20px;background:#4f46e5;color:white;text-decoration:none;border-radius:12px;font-weight:bold;margin-top:20px;"
          >
            Open Serven
          </a>
        </div>
      `,
    });

    if (error) {
      console.error("TEAM INVITE EMAIL ERROR:", error);
      return Response.json(
        {
          success: false,
          error: "Invitation email could not be sent.",
        },
        { status: 502 }
      );
    }

    return Response.json({
      success: true,
      emailId: data?.id || null,
    });
  } catch (error) {
    console.error("TEAM INVITE API ERROR:", error);

    return Response.json(
      {
        success: false,
        error: "Unable to process invitation email.",
      },
      { status: 500 }
    );
  }
}
