import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js";

// Initialize Supabase client with service role key
const supabase = createClient(
  "https://zxkvmgmcjuigfgevwdrc.supabase.co",
  Deno.env.get("SERVICE_ROLE_KEY")! // Service role key for full access
);

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const { code, userId } = await req.json();

    // Exchange the GitHub code for an access token
    const response = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({
        client_id: "Iv23liWPNmxhVbj0A2o5",
        client_secret: Deno.env.get("GITHUB_CLIENT_SECRET"), // Securely stored in env
        code,
      }),
    });

    const data = await response.json();
    const accessToken = data.access_token;

    if (accessToken) {
      // Store the access token in the user_tokens table
      const { error } = await supabase
        .from("user_tokens")
        .insert({ user_id: userId, github_token: accessToken });

      if (error) {
        console.error("Error storing access token:", error);
        return new Response(JSON.stringify({ error: "Failed to store access token" }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ message: "Access token stored successfully" }), {
        headers: { "Content-Type": "application/json" },
      });
    } else {
      return new Response(JSON.stringify({ error: "Failed to obtain access token" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
  } catch (error) {
    console.error("Error in Edge Function:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
