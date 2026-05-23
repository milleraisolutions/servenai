import { NextResponse } from "next/server";
import { Resend } from "resend";

export const runtime = "nodejs";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req) {
  try {
    const body = await req.json();

    const {
      restaurantName,
      ingredientName,
      message,
      suggestion,
    } = body;

    if (!ingredientName || !message) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const alertEmail =
      process.env.ALERT_EMAIL || "milleraisolutions21@gmail.com";

    if (process.env.NODE_ENV !== "production") {
      console.log("Skipped Resend email in development:", {
        to: alertEmail,
        ingredientName,
        message,
      });

      return NextResponse.json({
        ok: true,
        skipped: true,
        reason: "Development mode - email not sent",
      });
    }

    await resend.emails.send({
      from: "Serven Alerts <alerts@servenai.com>",
      to: alertEmail,
      subject: `Inventory Alert: ${ingredientName}`,
      html: `
        <div style="font-family: Arial, sans-serif; color: #111827;">
          <h2>Inventory Alert</h2>
          <p><strong>Restaurant:</strong> ${restaurantName || "Restaurant"}</p>
          <p><strong>Ingredient:</strong> ${ingredientName}</p>
          <p>${message}</p>
          ${suggestion ? `<p><strong>${suggestion}</strong></p>` : ""}
        </div>
      `,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Inventory alert email failed:", error);

    return NextResponse.json(
      { error: "Email failed" },
      { status: 500 }
    );
  }
}