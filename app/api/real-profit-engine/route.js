import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function money(value) {
  return Math.round(Number(value || 0));
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "Missing userId" },
        { status: 400 }
      );
    }

    const { data: menuItems, error: menuError } = await supabaseAdmin
      .from("menu_items")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true);

    if (menuError) throw menuError;

    const { data: ingredients, error: ingredientError } = await supabaseAdmin
      .from("ingredients")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true);

    if (ingredientError) throw ingredientError;

    const { data: inactiveMenuItems } = await supabaseAdmin
      .from("menu_items")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", false)
      .order("last_seen_at", { ascending: false })
      .limit(10);

    const lowMarginItems = (menuItems || [])
      .map((item) => {
        const price = Number(item.price || 0);
        const cost = Number(item.cost || 0);
        const quantitySold = Number(item.quantity_sold || 0);

        const marginPercent =
          price > 0 ? ((price - cost) / price) * 100 : Number(item.margin || 0);

        const lostPerSale = marginPercent < 60 ? price * 0.6 - (price - cost) : 0;
   const estimatedImpact = Math.max(0, lostPerSale * quantitySold);

        return {
          ...item,
          marginPercent,
          estimatedImpact,
        };
      })
      .filter((item) => item.marginPercent < 60)
     .sort((a, b) => b.estimatedImpact - a.estimatedImpact);

    const highCostIngredients = (ingredients || [])
      .map((item) => {
        const totalCost =
          Number(item.total_cost || 0) ||
          Number(item.quantity || 0) * Number(item.cost_per_unit || 0);

        return {
          ...item,
          totalCost,
        };
      })
      .sort((a, b) => b.totalCost - a.totalCost)
      .slice(0, 5);

    const actions = [];

    lowMarginItems.slice(0, 3).forEach((item) => {
      const suggestedPrice =
        Number(item.cost || 0) > 0
          ? Number(item.cost || 0) / 0.35
          : Number(item.price || 0) * 1.1;

      actions.push({
        type: "menu_margin",
        severity: item.marginPercent < 45 ? "high" : "medium",
        title: `Improve margin on ${item.name}`,
        issue: `${item.name} is running at ${item.marginPercent.toFixed(
          1
        )}% margin.`,
        recommendation: `Consider increasing the price from $${Number(
          item.price || 0
        ).toFixed(2)} to about $${suggestedPrice.toFixed(
          2
        )}, reducing portion cost, or promoting higher-margin alternatives.`,
        estimatedImpact: money(item.estimatedImpact),
      });
    });

    highCostIngredients.slice(0, 3).forEach((item) => {
      actions.push({
        type: "ingredient_cost",
        severity: "medium",
        title: `Review ${item.name} cost`,
        issue: `${item.name} has a tracked total cost of $${Number(
          item.totalCost || 0
        ).toFixed(2)}.`,
        recommendation:
          "Check supplier pricing, compare vendor alternatives, or reduce waste tied to this ingredient.",
        estimatedImpact: money(Number(item.totalCost || 0) * 0.08),
      });
    });

    (inactiveMenuItems || []).slice(0, 2).forEach((item) => {
      actions.push({
        type: "removed_item",
        severity: "low",
        title: `${item.name} was removed from the latest menu upload`,
        issue: `${item.name} is no longer active in the latest menu data.`,
        recommendation:
          "Review whether this item was intentionally removed. If it was profitable, consider replacing it with a similar high-margin offer.",
        estimatedImpact: money(Number(item.revenue || 0) * 0.15),
      });
    });
const totalOpportunity = actions.reduce(
  (sum, action) => sum + Number(action.estimatedImpact || 0),
  0
);

    return NextResponse.json({
  summary:
  actions.length > 0
    ? `Serven found ${actions.length} real profit opportunities worth an estimated $${money(
        totalOpportunity
      ).toLocaleString()} from the current uploaded data.`
    : "Serven did not find major profit leaks in the current uploaded data.",
      totalOpportunity: money(totalOpportunity),
      actions: actions.slice(0, 6),
      counts: {
        activeMenuItems: menuItems?.length || 0,
        activeIngredients: ingredients?.length || 0,
        inactiveMenuItems: inactiveMenuItems?.length || 0,
      },
    });
  } catch (error) {
    console.error("Real Profit Engine error:", error);

    return NextResponse.json(
      {
        error: error.message || "Real Profit Engine failed.",
      },
      { status: 500 }
    );
  }
}