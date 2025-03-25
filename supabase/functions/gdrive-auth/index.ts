import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.1";

// Initialize Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "https://zxkvmgmcjuigfgevwdrc.supabase.co";
const supabaseKey = Deno.env.get("SERVICE_ROLE_KEY");

if (!supabaseKey) {
  console.error("Missing SERVICE_ROLE_KEY environment variable");
}

const supabase = createClient(supabaseUrl, supabaseKey!);

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }

  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    
    if (!code) {
      return new Response(JSON.stringify({ error: "Missing authorization code" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const clientId = Deno.env.get("GDRIVE_CLIENT_ID");
    const clientSecret = Deno.env.get("GDRIVE_CLIENT_SECRET");
    const redirectUri = "https://zxkvmgmcjuigfgevwdrc.supabase.co/functions/v1/gdrive-auth";

    if (!clientId || !clientSecret) {
      console.error("Missing Google Drive API credentials");
      return new Response(JSON.stringify({ error: "Server configuration error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Exchange authorization code for tokens
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = await tokenResponse.json();
    
    if (tokenData.error) {
      console.error("Token exchange error:", tokenData);
      return new Response(JSON.stringify({ error: "Authorization failed" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { access_token, refresh_token } = tokenData;

    // Store tokens in database
    const { error } = await supabase
      .from("tokens")
      .insert({ access_token, refresh_token, provider: "gdrive" });

    if (error) {
      console.error("Database error:", error);
      return new Response(JSON.stringify({ error: "Failed to store tokens" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Return success HTML
    const successHtml = `<!DOCTYPE html><html><head><title>Auth Success</title></head><body><h1>Authentication Successful!</h1><p>You can close this window.</p><script>setTimeout(() => window.close(), 3000);</script></body></html>`;
    return new Response(successHtml, {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "text/html" },
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});