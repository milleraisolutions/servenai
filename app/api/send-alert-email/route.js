import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req) {
  try {
    const body = await req.json();

    const {
      clientName,
      alerts = [],
      dashboardUrl,
    } = body || {};

    if (!clientName || !alerts.length) {
      return NextResponse.json(
        { error: "Missing clientName or alerts" },
        { status: 400 }
      );
    }

    // FORCE all alerts to owner email only
    const toEmail =
      process.env.ALERT_EMAIL ||
      "milleraisolutions21@gmail.com";

    const normalizedAlerts = alerts.map((alert) => ({
      title: alert.title || alert.rule_name || "Alert Triggered",

      message:
        alert.message ||
        `${alert.metric_key || "Metric"} is ${
          alert.metric_value || "outside target"
        }`,

      severity: alert.severity || alert.type || "warning",

      metric: alert.metric_key || "AI Signal",

      value:
        alert.metric_value !== undefined &&
        alert.metric_value !== null
          ? Number(alert.metric_value).toFixed(2)
          : "N/A",

      threshold:
        alert.operator && alert.threshold
          ? `${alert.operator} ${Number(
              alert.threshold || 0
            ).toFixed(2)}`
          : "AI detected",
    }));

    const alertRows = normalizedAlerts
      .map(
        (alert) => `
          <tr>
            <td style="padding:8px;border:1px solid #e5e7eb;">${alert.title}</td>
            <td style="padding:8px;border:1px solid #e5e7eb;">${alert.message}</td>
            <td style="padding:8px;border:1px solid #e5e7eb;">${alert.metric}</td>
            <td style="padding:8px;border:1px solid #e5e7eb;">${alert.value}</td>
            <td style="padding:8px;border:1px solid #e5e7eb;">${alert.threshold}</td>
            <td style="padding:8px;border:1px solid #e5e7eb;">${alert.severity}</td>
          </tr>
        `
      )
      .join("");

    const html = `
      <div style="font-family:Arial,sans-serif;padding:24px;color:#111827;">
        <h2 style="margin-bottom:12px;">Serven Alert Triggered</h2>

        <p style="font-size:15px;line-height:1.6;">
          <strong>${clientName}</strong> triggered one or more operational alerts.
        </p>

        <table style="border-collapse:collapse;width:100%;margin-top:16px;margin-bottom:20px;">
          <thead>
            <tr>
              <th style="padding:8px;border:1px solid #e5e7eb;text-align:left;">Alert</th>
              <th style="padding:8px;border:1px solid #e5e7eb;text-align:left;">Message</th>
              <th style="padding:8px;border:1px solid #e5e7eb;text-align:left;">Metric</th>
              <th style="padding:8px;border:1px solid #e5e7eb;text-align:left;">Value</th>
              <th style="padding:8px;border:1px solid #e5e7eb;text-align:left;">Threshold</th>
              <th style="padding:8px;border:1px solid #e5e7eb;text-align:left;">Severity</th>
            </tr>
          </thead>

          <tbody>
            ${alertRows}
          </tbody>
        </table>

        ${
          dashboardUrl
            ? `
              <a
                href="${dashboardUrl}"
                style="
                  display:inline-block;
                  padding:12px 18px;
                  background:#4f46e5;
                  color:white;
                  text-decoration:none;
                  border-radius:10px;
                  font-weight:700;
                "
              >
                Open Dashboard
              </a>
            `
            : ""
        }
      </div>
    `;

    // SKIP EMAILS IN DEVELOPMENT
    if (process.env.NODE_ENV !== "production") {
      console.log("Skipped alert email in development mode");

      return NextResponse.json({
        success: true,
        skipped: true,
        reason: "Development mode",
      });
    }

    const result = await resend.emails.send({
      from:
        process.env.ALERT_FROM_EMAIL ||
        "Serven Alerts <alerts@servenai.com>",

      to: toEmail,

      subject: `Serven Alert: ${clientName} needs attention`,

      html,
    });

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error) {
    console.error("send-alert-email error:", error);

    return NextResponse.json(
      {
        error:
          error?.message ||
          "Failed to send alert email",
      },
      { status: 500 }
    );
  }
}