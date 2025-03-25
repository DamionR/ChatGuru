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
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
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
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse request body
    let body;
    try {
      body = await req.json();
    } catch (e) {
      return new Response(JSON.stringify({ error: "Invalid JSON" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { server_name, sse_url, post_url, intents } = body;

    // Validate required fields
    if (!server_name || !sse_url || !post_url || !intents) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Call the database function to register the MCP server
    const { error } = await supabase.rpc("register_mcp_server", {
      server_name,
      sse_url,
      post_url,
      intents,
    });

    if (error) {
      return new Response(JSON.stringify({ error: `Failed to register MCP server: ${error.message}` }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, message: "MCP server registered successfully" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});