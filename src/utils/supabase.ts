import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://cowlzmdeufmdkksovsis.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNvd2x6bWRldWZtZGtrc292c2lzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxNzkwMjIsImV4cCI6MjA5Mjc1NTAyMn0.saByYOe0VpjwQ9sOXtFU0KcNrTalcLpRW9rFKu6SOLA";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    storageKey: "milo-auth",
  },
});
