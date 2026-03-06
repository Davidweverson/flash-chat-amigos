import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  // Check if admin already exists
  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", "Dwxzs_")
    .maybeSingle();

  if (existing) {
    return new Response(JSON.stringify({ message: "Admin already exists" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Create admin user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: "dwxzs_@flashchat.local",
    password: "david29112011",
    email_confirm: true,
    user_metadata: { username: "Dwxzs_" },
  });

  if (authError) {
    return new Response(JSON.stringify({ error: authError.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Assign admin role
  const { error: roleError } = await supabase.from("user_roles").insert({
    user_id: authData.user.id,
    role: "admin",
  });

  if (roleError) {
    return new Response(JSON.stringify({ error: roleError.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ message: "Admin created successfully", userId: authData.user.id }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
