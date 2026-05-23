import { NextResponse } from "next/server";
import { Resend } from "resend";

export const runtime = "nodejs";

const resendApiKey = process.env.RESEND_API_KEY;

if (!resendApiKey) {
  throw new Error("Missing RESEND_API_KEY.");
}

const resend = new Resend(resendApiKey);

export async function POST(req) {
  try {
    const body = await req.json();

    const { to, subject, message, clientName } = body || {};

    if (!to || !subject || !message) {
      return NextResponse.json(
        { error: "Missing to, subject, or message." },
        { status: 400 }
      );
    }

    const resendFromEmail =
      process.env.RESEND_FROM_EMAIL ||
      "SerVen <hello@servenai.com>";

    const safeTestEmail =
      process.env.ALERT_EMAIL ||
      "milleraisolutions21@gmail.com";

    if (process.env.NODE_ENV !== "production") {
      console.log("Skipped risk email in development mode:", {
        originalTo: to,
        safeTestEmail,
        subject,
      });

      return NextResponse.json({
        success: true,
        skipped: true,
        reason: "Development mode",
      });
    }

    const { error } = await resend.emails.send({
      from: resendFromEmail,
      to,
      subject,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.7; color: #0f172a;">
          <p>Hi ${clientName || "there"},</p>

          ${message
            .split("\n")
            .map(
              (line) =>
                `<p style="margin: 0 0 12px 0;">${
                  line || "&nbsp;"
                }</p>`
            )
            .join("")}

          <p style="margin-top: 20px;">— SerVen</p>
        </div>
      `,
    });

    if (error) {
      console.error("Risk email send failed:", error);

      return NextResponse.json(
        { error: "Failed to send email." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("send-risk-email route failed:", error);

    return NextResponse.json(
      { error: "Something went wrong." },
      { status: 500 }
    );
  }
}