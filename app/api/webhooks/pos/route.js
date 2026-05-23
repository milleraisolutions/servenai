import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Safe to use here inside your secure backend route
);

export async function POST(req) {
  try {
    const body = await req.json();
    
    // 1. Identify what type of POS event occurred.
    // (Note: This property path varies slightly depending on whether you are using 
    // Toast, Clover, or Square, but the event structure remains highly similar)
    const eventType = body.eventType || body.type; 

    // ==========================================
    // CASE A: NEW DISH ORDER SENT TO KITCHEN
    // ==========================================
    if (eventType === "order.created" || eventType === "ticket.sent") {
      const { item_id, item_name, pos_order_id, modifiers } = body.data;

      // Pull base menu item config rules from your existing table
      const { data: menuItem } = await supabaseAdmin
        .from("menu_items")
        .select("base_prep_time, primary_station")
        .eq("id", item_id)
        .single();

      const basePrep = menuItem?.base_prep_time || 5;
      const station = menuItem?.primary_station || "Line";

      // Scan modification array names to find time-compounding culinary components
      let modifierExtraTime = 0;
      if (modifiers && modifiers.length > 0) {
        modifiers.forEach((mod) => {
          const name = mod.name.toLowerCase();
          if (name.includes("salad")) modifierExtraTime = Math.max(modifierExtraTime, 3);
          if (name.includes("veggie") || name.includes("broccoli") || name.includes("asparagus")) {
            modifierExtraTime = Math.max(modifierExtraTime, 4);
          }
          if (name.includes("fruit") || name.includes("avocado") || name.includes("berry")) {
            modifierExtraTime = Math.max(modifierExtraTime, 2);
          }
        });
      }

      // Calculate Target Prep: Maximum concurrent station setup time + 1 min plating buffer
      const finalTargetPrep = Math.max(basePrep, modifierExtraTime) + 1;

      // Track it into your data stream
      const { error: insertError } = await supabaseAdmin
        .from("order_items")
        .insert({
          pos_order_id,
          item_name,
          menu_item_id: item_id,
          station,
          target_prep_time: finalTargetPrep,
        });

      if (insertError) {
        console.error("❌ Error logging new POS order tracking:", insertError.message);
      } else {
        console.log(`✅ Live ticket logged: ${item_name} -> Target: ${finalTargetPrep}m`);
      }
    }

    // ==========================================
    // CASE B: COOK PRESSED "DONE" / BUMPED TICKET
    // ==========================================
    if (eventType === "order.completed" || eventType === "ticket.bumped") {
      const { pos_order_id } = body.data;

      const { error: updateError } = await supabaseAdmin
        .from("order_items")
        .update({ completed_at: new Date().toISOString() })
        .eq("pos_order_id", pos_order_id);

      if (updateError) {
        console.error("❌ Error updating POS bump time:", updateError.message);
      } else {
        console.log(`⏱️ Ticket ${pos_order_id} successfully bumped in real-time.`);
      }
    }

    return NextResponse.json({ success: true });

  } catch (err) {
    console.error("❌ POS Webhook internal breakdown:", err.message);
    return new Response("Internal Processing Error", { status: 500 });
  }
}