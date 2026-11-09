// app/api/ai-insights/route.js

import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";
export const runtime = "nodejs";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
  try {
    const authorization = req.headers.get("authorization") || "";

    const accessToken = authorization.startsWith("Bearer ")
      ? authorization.slice(7).trim()
      : "";

    if (!accessToken) {
      return Response.json(
        { success: false, error: "Authentication required." },
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

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(accessToken);

   if (authError || !user?.id) {
  return Response.json(
    { success: false, error: "Invalid or expired session." },
    { status: 401 }
  );
}

const { data: profile, error: profileError } = await supabase
  .from("users")
  .select(
    "id, role, account_type, owner_user_id, customer_status, subscription_status, pilot_status, pilot_expires_at, pilot_recommendations_used, pilot_recommendation_limit"
  )
  .eq("id", user.id)
  .single();

if (profileError || !profile) {
  return Response.json(
    {
      success: false,
      error: "Restaurant account profile not found.",
    },
    { status: 403 }
  );
}

const accountType = String(profile.account_type || "")
  .trim()
  .toLowerCase();

const role = String(profile.role || "")
  .trim()
  .toLowerCase();

if (
  accountType !== "restaurant" ||
  profile.owner_user_id ||
  !["owner", "executive"].includes(role)
) {
  return Response.json(
    {
      success: false,
      error: "Restaurant AI Insights access is not authorized.",
    },
    { status: 403 }
  );
}

const body = await req.json();

    

    const {
      revenueData = [],
      foodCost = 0,
      margin = 0,
      distribution = [],
      leaks = [],
      alerts = [],
      peakHours = [],
      aov = 0,
    } = body || {};

    if (!process.env.OPENAI_API_KEY) {
      return Response.json(
        {
          error: "OPENAI_API_KEY is missing",
          summary: "AI insights are unavailable because the API key is missing.",
          alerts: [],
          recommendations: [],
        },
        { status: 500 }
      );
    }

    const prompt = `
You are Serven AI, a restaurant profit analyst.

Analyze this restaurant data and return ONLY valid JSON.

Data:
Revenue data: ${JSON.stringify(revenueData)}
Food cost percentage: ${foodCost}
Average margin: ${margin}
Sales distribution signals: ${JSON.stringify(distribution)}
Profit leakage data: ${JSON.stringify(leaks)}
Starter alerts: ${JSON.stringify(alerts)}
Peak hours: ${JSON.stringify(peakHours)}
Average order value: ${aov}

Return JSON in this exact shape:
{
  "summary": "short executive summary",
  "score": 0,
  "alerts": [
    {
      "id": "string",
      "title": "string",
      "severity": "low | medium | high",
      "message": "string"
    }
  ],
  "recommendations": [
    {
      "id": "string",
      "title": "string",
      "description": "string",
      "estimatedMonthlyImpact": 0,
      "type": "profit_leak | margin | food_cost | revenue | marketing"
    }
  ],
  "topOpportunity": {
    "title": "string",
    "impact": 0,
    "reason": "string"
  }
}
`;

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.3,
      messages: [
        {
          role: "system",
          content:
            "You are a restaurant analytics AI. Always return clean JSON only. No markdown.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const raw = completion.choices?.[0]?.message?.content || "{}";

    let parsed;

    try {
      parsed = JSON.parse(raw);
    } catch (parseError) {
      console.error("AI JSON parse failed:", parseError, raw);

      parsed = {
        summary:
          "Serven AI reviewed the data, but the response needed fallback parsing.",
        score: 70,
        alerts: [],
        recommendations: [],
        topOpportunity: {
          title: "Review restaurant performance",
          impact: 0,
          reason: "AI response could not be parsed cleanly.",
        },
      };
    }

    return Response.json({
      success: true,
      summary: parsed.summary || "AI analysis complete.",
      score: Number(parsed.score || 70),
      alerts: Array.isArray(parsed.alerts) ? parsed.alerts : [],
      recommendations: Array.isArray(parsed.recommendations)
        ? parsed.recommendations
        : [],
      topOpportunity: parsed.topOpportunity || null,
    });
  } catch (error) {
    console.error("AI insights route error:", error);

    return Response.json(
      {
        success: false,
        error: error.message || "AI insights failed",
        summary: "AI insights failed to generate.",
        score: 0,
        alerts: [],
        recommendations: [],
        topOpportunity: null,
      },
      { status: 500 }
    );
  }
}