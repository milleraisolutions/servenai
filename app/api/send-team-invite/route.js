import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req) {
  try {
    const body = await req.json();

    const {
  inviteEmail,
  inviteName,
  inviteRole,
  inviteLocation,
  inviteToken,
} = body;

    await resend.emails.send({
      from: "Serven AI <support@servenai.com>",
      to: inviteEmail,

      subject: "You've Been Invited To Serven",

      html: `
        <div style="font-family:Arial;padding:24px;">
          <h1>You've Been Invited To Serven</h1>

          <p>Hello ${inviteName || "Team Member"},</p>

          <p>
            You were invited as a
            <strong>${inviteRole}</strong>
            for ${inviteLocation || "a restaurant location"}.
          </p>

          <p>
            Access your management dashboard and begin collaborating
            with your restaurant team.
          </p>

          <a
            href="https://servenai.com/accept-invite?token=${inviteToken}"
            style="
              display:inline-block;
              padding:14px 20px;
              background:#4f46e5;
              color:white;
              text-decoration:none;
              border-radius:12px;
              font-weight:bold;
              margin-top:20px;
            "
          >
            Open Serven
          </a>
        </div>
      `,
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error(error);

    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}