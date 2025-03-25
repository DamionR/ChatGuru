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

// Fetch most recent access token
async function getAccessToken() {
  try {
    const { data, error } = await supabase
      .from("tokens")
      .select("access_token")
      .eq("provider", "gdrive")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error) throw new Error("No token found");
    return data.access_token;
  } catch (error) {
    console.error("Token retrieval failed:", error);
    throw error;
  }
}

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
    const basePath = "/functions/v1/gdrive-mcp";

    // SSE endpoint
    if (url.pathname === `${basePath}/sse`) {
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue("data: gdrive-mcp connected\n\n");
        },
      });
      return new Response(stream, {
        headers: {
          ...corsHeaders,
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive",
        },
      });
    } 
    // Message endpoint
    else if (url.pathname === `${basePath}/messages` && req.method === "POST") {
      const body = await req.json();
      const { tool, args } = body;
      
      if (tool === "search") {
        const { query } = args;
        try {
          const accessToken = await getAccessToken();
          const response = await fetch(
            `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query || "")}`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
          );
          const data = await response.json();
          
          return new Response(JSON.stringify({
            content: [{
              type: "text",
              text: JSON.stringify({
                files: data.files.map((file) => ({ name: file.name, mimeType: file.mimeType }))
              })
            }]
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        } catch (error) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }
      
      return new Response(JSON.stringify({ error: "Tool not found" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    // Not found
    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Request handling error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});