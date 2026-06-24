import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing Authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    // Best-effort cleanup of user-owned rows in tables not protected by cascade
    const userTables = [
      "profiles", "patient_profiles", "user_roles", "gambling_streak",
      "daily_tasks", "daily_reports", "journey_progress", "jornada_respostas",
      "community_posts", "post_comments", "post_likes", "community_messages",
      "community_stories", "story_comments", "story_supports", "direct_messages",
      "user_follows", "user_connections", "user_public_profiles", "notifications",
      "reported_content", "blocked_users", "anchor_contacts", "anchor_settings",
      "anchor_alerts", "agent_memory", "agent_messages", "appointments",
      "blocked_sites", "body_evolution", "calendar_events", "daily_reflections",
      "debt_simulations", "digital_guardian", "exercise_logs", "finance_events",
      "financial_goals", "financial_profile", "financial_transactions",
      "journey_letters", "nutrition_logs", "onboarding_clinico",
      "patient_record_entries", "payments", "prontuarios", "reading_progress",
      "recovery_commitments", "recovery_scores", "risk_signals",
      "routine_activities", "routine_days", "routine_preferences",
      "session_credits", "sessions", "subscriptions", "temptation_events",
      "trail_progress", "user_badges", "user_fitness_profile", "user_routine",
      "weekly_workout_plan", "community_rules_acceptance",
    ];

    for (const t of userTables) {
      await admin.from(t).delete().eq("user_id", userId);
    }
    // Special blocker_id column
    await admin.from("blocked_users").delete().eq("blocker_id", userId);
    await admin.from("blocked_users").delete().eq("blocked_id", userId);

    // Finally delete the auth user
    const { error: delErr } = await admin.auth.admin.deleteUser(userId);
    if (delErr) throw delErr;

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("delete-account error:", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
