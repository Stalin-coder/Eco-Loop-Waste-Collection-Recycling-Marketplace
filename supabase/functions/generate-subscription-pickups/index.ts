import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Get all active subscriptions
    const { data: subscriptions, error: subError } = await supabase
      .from("pickup_subscriptions")
      .select("*")
      .eq("is_active", true);

    if (subError) throw subError;

    const now = new Date();
    const today = now.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();
    const results: any[] = [];

    for (const sub of subscriptions || []) {
      // Check if today matches the pickup day
      if (sub.pickup_day !== today) continue;

      // Check frequency: skip if already generated recently
      if (sub.last_generated_at) {
        const lastGen = new Date(sub.last_generated_at);
        const daysSince = (now.getTime() - lastGen.getTime()) / (1000 * 60 * 60 * 24);

        if (sub.frequency === "weekly" && daysSince < 6) continue;
        if (sub.frequency === "biweekly" && daysSince < 13) continue;
        if (sub.frequency === "monthly" && daysSince < 27) continue;
      }

      // Create a pickup request for the first waste type (or primary)
      const primaryWasteType = sub.waste_types?.[0] || "plastic";

      // Build preferred_time from day + time
      const preferredTime = new Date();
      if (sub.preferred_time) {
        const [hours, minutes] = sub.preferred_time.split(":");
        preferredTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      }

      const { data: pickup, error: pickupError } = await supabase
        .from("pickup_requests")
        .insert({
          household_id: sub.household_id,
          waste_type: primaryWasteType,
          estimated_weight: sub.estimated_weight,
          pickup_address: sub.pickup_address,
          city: sub.city,
          area: sub.area,
          preferred_time: preferredTime.toISOString(),
          pickup_type: "subscription",
          status: "requested",
        })
        .select()
        .single();

      if (pickupError) {
        console.error(`Failed to create pickup for sub ${sub.id}:`, pickupError);
        continue;
      }

      // Update last_generated_at
      await supabase
        .from("pickup_subscriptions")
        .update({ last_generated_at: now.toISOString() })
        .eq("id", sub.id);

      // Notify the household
      await supabase.from("notifications").insert({
        user_id: sub.household_id,
        title: "Subscription Pickup Scheduled",
        message: `Your ${sub.frequency} pickup for ${primaryWasteType} has been scheduled. A collector will be assigned soon.`,
        type: "subscription_pickup",
        reference_id: pickup.id,
      });

      results.push({ subscription_id: sub.id, pickup_id: pickup.id });
    }

    return new Response(
      JSON.stringify({ success: true, generated: results.length, pickups: results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
