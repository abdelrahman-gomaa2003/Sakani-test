import cron from "node-cron";
import { supabaseAdmin } from "../config.js";

export function startCronJobs() {
  console.log("Starting cron jobs...");

  cron.schedule("0 0 * * *", async () => {
    console.log("[CRON] Running daily cleanup...");
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data, error } = await supabaseAdmin
        .from("apartments")
        .update({ status: "hidden", is_available: false })
        .eq("status", "approved")
        .lt("updated_at", thirtyDaysAgo.toISOString())
        .select("id, title");

      if (!error && data?.length) {
        console.log(`[CRON] Hidden ${data.length} expired apartments`);
      }
    } catch (err) {
      console.error("[CRON] Daily cleanup error:", err);
    }
  });

  cron.schedule("0 2 * * 0", async () => {
    console.log("[CRON] Running weekly notification cleanup...");
    try {
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      const { error } = await supabaseAdmin
        .from("notifications")
        .delete()
        .eq("is_read", true)
        .lt("created_at", ninetyDaysAgo.toISOString());

      if (!error) {
        console.log("[CRON] Old notifications cleaned");
      }
    } catch (err) {
      console.error("[CRON] Weekly cleanup error:", err);
    }
  });

  cron.schedule("0 9 * * 1", async () => {
    console.log("[CRON] Running weekly reminder...");
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data: inactiveApartments } = await supabaseAdmin
        .from("apartments")
        .select("id, owner_id, title")
        .eq("status", "approved")
        .eq("is_available", true)
        .lt("views", 5)
        .lt("updated_at", sevenDaysAgo.toISOString());

      if (inactiveApartments?.length) {
        console.log(`[CRON] Found ${inactiveApartments.length} inactive apartments for reminder`);
      }
    } catch (err) {
      console.error("[CRON] Weekly reminder error:", err);
    }
  });

  console.log("Cron jobs scheduled:");
  console.log("  - Daily cleanup: midnight");
  console.log("  - Weekly notification cleanup: Sunday 2am");
  console.log("  - Weekly reminders: Monday 9am");
}
