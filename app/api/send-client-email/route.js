import { Resend } from "resend";
import Stripe from "stripe";

export const runtime = "nodejs";

const resend = new Resend(process.env.RESEND_API_KEY);

const AGREEMENT_URL =
  "https://docs.google.com/document/d/1Y5QzTibDUcQ1ju4mry2vyOsr0rX4Tv19cQf2A9ztctI/edit?usp=sharing";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

export async function POST(req) {
  try {
    const body = await req.json();

    const {
      to,
      restaurantName = "there",
      type = "intro",
      plan = "starter",
      monthlyPrice,
      userId,
      leadId,
      agreementUrl,
      contactName,
      phone,
      city,
    } = body;

    const isProduction =
      process.env.NODE_ENV === "production";

    const safeOwnerEmail =
      process.env.ALERT_EMAIL ||
      "milleraisolutions21@gmail.com";

    // ========================================================
    // DEMO NOTIFICATION EMAIL
    // ========================================================
    if (type === "demo_notification") {
      if (!isProduction) {
        console.log("Skipped demo notification email in development mode");

        return Response.json({
          success: true,
          skipped: true,
          reason: "Development mode",
        });
      }

      const ownerAlertData = await resend.emails.send({
        from: "SerVen Alerts <hello@servenai.com>",

        to: [safeOwnerEmail],

        subject: `🚨 New Website Demo Lead: ${
          restaurantName || "Restaurant"
        }`,

        replyTo: "hello@servenai.com",

        html: `
          <div style="font-family:Arial,sans-serif;line-height:1.6;color:#ffffff;max-width:600px;margin:0 auto;background-color:#0f172a;padding:30px;border-radius:18px;border:1px solid rgba(168,85,247,0.4);">
            
            <h2 style="color:#a855f7;margin-top:0;font-size:24px;font-weight:900;border-bottom:1px solid rgba(255,255,255,0.1);padding-bottom:12px;">
              New Inbound Demo Request
            </h2>

            <p style="font-size:16px;margin:16px 0;">
              An operator just booked a demo request from your website frontend.
            </p>

            <div style="background-color:rgba(255,255,255,0.04);padding:18px;border-radius:12px;margin:20px 0;border:1px solid rgba(255,255,255,0.08);">
              
              <p style="margin:6px 0;font-size:14px;">
                <strong style="color:#94a3b8;">Business Name:</strong>
                <span style="font-size:16px;font-weight:bold;color:#fff;">
                  ${restaurantName}
                </span>
              </p>

              <p style="margin:6px 0;font-size:14px;">
                <strong style="color:#94a3b8;">Contact Person:</strong>
                <span style="color:#fff;">
                  ${contactName || "Unknown"}
                </span>
              </p>

              <p style="margin:6px 0;font-size:14px;">
                <strong style="color:#94a3b8;">Email Address:</strong>
                <span style="color:#fff;">
                  ${to || "Unknown"}
                </span>
              </p>

              <p style="margin:6px 0;font-size:14px;">
                <strong style="color:#94a3b8;">Phone Number:</strong>
                <span style="color:#fff;">
                  ${phone || "Unknown"}
                </span>
              </p>

              <p style="margin:6px 0;font-size:14px;">
                <strong style="color:#94a3b8;">Location / City:</strong>
                <span style="color:#fff;">
                  ${city || "Unknown"}
                </span>
              </p>
            </div>

            <p style="font-size:12px;color:#94a3b8;text-align:center;">
              Lead synced into your SerVen admin pipeline.
            </p>
          </div>
        `,
      });

      if (ownerAlertData.error) {
        console.error(
          "OWNER NOTIFICATION ERROR:",
          ownerAlertData.error
        );

        return Response.json(
          { error: ownerAlertData.error },
          { status: 500 }
        );
      }

      return Response.json({
        success: true,
        data: ownerAlertData.data,
      });
    }

    // ========================================================
    // BASIC VALIDATION
    // ========================================================
    if (!to) {
      return Response.json(
        { error: "Missing recipient email" },
        { status: 400 }
      );
    }

    let checkoutUrl = null;

    // ========================================================
    // STRIPE CHECKOUT CREATION
    // ========================================================
    if (type === "activation" || type === "upgrade") {
      if (!monthlyPrice || Number(monthlyPrice) <= 0) {
        return Response.json(
          {
            error:
              "Missing valid monthlyPrice for checkout email",
          },
          { status: 400 }
        );
      }

      if (!userId) {
        return Response.json(
          {
            error:
              "Missing userId for checkout email",
          },
          { status: 400 }
        );
      }

      const amountInCents = Math.round(
        Number(monthlyPrice) * 100
      );

      const session =
        await stripe.checkout.sessions.create({
          mode: "subscription",

          payment_method_types: ["card"],

          customer_email: to,

          client_reference_id: userId,

          line_items: [
            {
              price_data: {
                currency: "usd",

                recurring: {
                  interval: "month",
                },

                product_data: {
                  name: `SerVen ${plan.toUpperCase()} Plan`,

                  description: `Custom monthly SerVen subscription for ${restaurantName}`,
                },

                unit_amount: amountInCents,
              },

              quantity: 1,
            },
          ],

          success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?upgraded=true`,

          cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/pricing`,

          metadata: {
            plan,
            userId,
            leadId: leadId || "",
            monthlyPrice: String(monthlyPrice),
            pricingType: "custom",
          },
        });

      checkoutUrl = session.url;
    }

    // ========================================================
    // EMAIL CONTENT
    // ========================================================
    let subject = "Welcome to SerVen";

    let html = `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827;">
        <h2>Welcome to SerVen</h2>

        <p>Hi ${restaurantName},</p>

        <p>
          Thanks for your interest in SerVen.
        </p>

        <p>
          We help restaurants improve profitability using AI-powered sales,
          labor, menu, inventory, and marketing intelligence.
        </p>

        <p>
          Our team is currently reviewing your restaurant profile and custom
          plan requirements.
        </p>

        <p>
          We’ll follow up shortly with onboarding details and next steps.
        </p>

        <p>— SerVen Team</p>
      </div>
    `;

    // ========================================================
    // AGREEMENT EMAIL
    // ========================================================
    if (type === "agreement") {
      subject = "Your Serven agreement is ready";

      html = `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827;max-width:640px;margin:0 auto;padding:24px;">
          
          <h2>Your Serven agreement is ready</h2>

          <p>Hi ${restaurantName},</p>

          <p>
            Your custom Serven service agreement is ready for review.
          </p>

          <div style="margin:28px 0;">
            <a
              href="${agreementUrl || AGREEMENT_URL}"
              style="display:inline-block;background:#f59e0b;color:white;text-decoration:none;padding:14px 22px;border-radius:12px;font-weight:800;font-size:15px;"
            >
              Review Agreement
            </a>
          </div>

          <p>— Serven AI</p>
        </div>
      `;
    }

    // ========================================================
    // ACTIVATION EMAIL
    // ========================================================
    if (type === "activation") {
      subject =
        "Complete your SerVen dashboard activation";

      html = `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827;max-width:640px;margin:0 auto;padding:24px;">
          
          <h2>Your SerVen dashboard is ready</h2>

          <p>Hi ${restaurantName},</p>

          <p>
            Your custom <strong>${plan}</strong> plan has been prepared.
          </p>

          <p>
            Monthly price:
            <strong>
              $${Number(monthlyPrice).toLocaleString()}/month
            </strong>
          </p>

          <div style="margin:28px 0;">
            <a
              href="${checkoutUrl}"
              style="display:inline-block;background:#6D3DF5;color:white;text-decoration:none;padding:14px 22px;border-radius:12px;font-weight:800;font-size:15px;"
            >
              Complete Payment
            </a>
          </div>

          <p>— SerVen Team</p>
        </div>
      `;
    }

    // ========================================================
    // UPGRADE EMAIL
    // ========================================================
    if (type === "upgrade") {
      subject =
        "Complete your SerVen plan upgrade";

      html = `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827;max-width:640px;margin:0 auto;padding:24px;">
          
          <h2>Your SerVen upgrade is ready</h2>

          <p>Hi ${restaurantName},</p>

          <p>
            Your custom upgrade to
            <strong>${plan}</strong>
            is ready.
          </p>

          <div style="margin:28px 0;">
            <a
              href="${checkoutUrl}"
              style="display:inline-block;background:#6D3DF5;color:white;text-decoration:none;padding:14px 22px;border-radius:12px;font-weight:800;font-size:15px;"
            >
              Complete Upgrade
            </a>
          </div>

          <p>— SerVen Team</p>
        </div>
      `;
    }

    // ========================================================
    // SKIP EMAILS IN DEVELOPMENT
    // ========================================================
    if (!isProduction) {
      console.log("Skipped client email in development mode");

      return Response.json({
        success: true,
        skipped: true,
        reason: "Development mode",
      });
    }

    // ========================================================
    // SEND EMAIL
    // ========================================================
    const { data, error } =
      await resend.emails.send({
        from:
          "SerVen <hello@servenai.com>",

        to: [to],

        subject,

        html,

        replyTo: "hello@servenai.com",
      });

    if (error) {
      console.error("RESEND ERROR:", error);

      return Response.json(
        { error },
        { status: 500 }
      );
    }

    return Response.json({
      success: true,
      data,
      checkoutUrl,
    });
  } catch (error) {
    console.error(
      "SEND CLIENT EMAIL ERROR:",
      error
    );

    return Response.json(
      {
        error:
          error?.message || "Email failed",
      },
      { status: 500 }
    );
  }
}