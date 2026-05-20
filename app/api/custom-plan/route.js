import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  try {
    const form = await req.json();

    console.log("📩 NEW CUSTOM PLAN REQUEST:", form);
    console.log("RESEND KEY LOADED:", !!process.env.RESEND_API_KEY);

    const leadPayload = {
      user_id: form.userId || null,
      name: String(form.name || "").trim(),
      restaurant: String(form.restaurant || "").trim(),
      email: String(form.email || "").trim().toLowerCase(),
      phone: form.phone ? String(form.phone).trim() : null,
      monthly_revenue: Number(form.monthlyRevenue || 0),
      staff_count: Number(form.staffCount || 0),
      menu_items: Number(form.menuItems || 0),
      locations: Number(form.locations || 1),
      status: "new",
      created_at: new Date().toISOString(),
    };

    if (!leadPayload.name || !leadPayload.restaurant || !leadPayload.email) {
      return Response.json(
        { error: "Name, restaurant, and email are required." },
        { status: 400 }
      );
    }

    const { error: insertError } = await supabaseAdmin
      .from("custom_plan_requests")
      .insert([leadPayload]);

    if (insertError) {
      console.error("❌ SUPABASE INSERT ERROR:", insertError);
      return Response.json({ error: insertError.message }, { status: 500 });
    }

    if (process.env.RESEND_API_KEY) {
      const fromEmail =
        process.env.RESEND_FROM_EMAIL || "Serven <hello@servenai.com>";

      const toEmail =
  process.env.ALERT_TO_EMAIL || "antoinemiller@servenai.com";

      const emailRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [toEmail],
          subject: `New Serven Lead: ${leadPayload.restaurant}`,
          html: `
            <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.6;">
              <h2>New Serven Custom Plan Request</h2>
              <p><strong>Name:</strong> ${leadPayload.name}</p>
              <p><strong>Restaurant:</strong> ${leadPayload.restaurant}</p>
              <p><strong>Email:</strong> ${leadPayload.email}</p>
              <p><strong>Phone:</strong> ${leadPayload.phone || "N/A"}</p>
              <hr />
              <p><strong>Monthly Revenue:</strong> $${leadPayload.monthly_revenue.toLocaleString()}</p>
              <p><strong>Staff Count:</strong> ${leadPayload.staff_count}</p>
              <p><strong>Menu Items:</strong> ${leadPayload.menu_items}</p>
              <p><strong>Locations:</strong> ${leadPayload.locations}</p>
              <p><strong>User ID:</strong> ${leadPayload.user_id || "Not logged in"}</p>
              <p><strong>Status:</strong> new</p>
            </div>
          `,
        }),
      });

      const emailText = await emailRes.text();

      console.log("📨 RESEND STATUS:", emailRes.status);
      console.log("📨 RESEND RESPONSE:", emailText);

      if (!emailRes.ok) {
        console.error("❌ RESEND EMAIL ERROR:", emailText);
      } else {
        console.log("✅ LEAD EMAIL SENT");
      }
    } else {
      console.warn("⚠️ RESEND_API_KEY missing — email alert skipped");
    }

    return Response.json({ success: true });
  } catch (err) {
    console.error("❌ SERVER ERROR:", err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}