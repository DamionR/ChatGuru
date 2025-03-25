import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.35-alpha/deno-dom-wasm.ts";

serve(async (req) => {
  const url = new URL(req.url);
  const basePath = "/functions/v1/fetch-mcp";

  // Handle SSE connections
  if (url.pathname === `${basePath}/sse`) {
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue("data: fetch-mcp connected\n\n");
      },
    });
    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } 
  // Handle POST requests to /messages
  else if (url.pathname === `${basePath}/messages` && req.method === "POST") {
    try {
      const body = await req.json();
      const { tool, args } = body;

      if (tool === "fetch") {
        const { url: fetchUrl, max_length = 5000, start_index = 0, raw = false } = args;

        if (!fetchUrl) {
          return new Response(
            JSON.stringify({ error: "URL is required" }),
            { status: 400, headers: { "Content-Type": "application/json" } }
          );
        }

        const response = await fetch(fetchUrl);
        if (!response.ok) {
          return new Response(
            JSON.stringify({ error: `Failed to fetch URL: ${response.statusText}` }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }

        const content = await response.text();
        let processedContent = content;

        if (!raw) {
          const parser = new DOMParser();
          const doc = parser.parseFromString(content, "text/html");
          if (doc) {
            processedContent = doc.body.textContent || "";
          } else {
            processedContent = "Failed to parse HTML";
          }
        }

        const chunk = processedContent.slice(start_index, start_index + max_length);

        return new Response(
          JSON.stringify({
            content: [{ type: "text", text: chunk }],
          }),
          { headers: { "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ error: "Tool not found" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    } catch (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  }

  return new Response("Not Found", { status: 404 });
});