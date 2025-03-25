import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js";

const supabase = createClient(
  "https://zxkvmgmcjuigfgevwdrc.supabase.co",
  Deno.env.get("SERVICE_ROLE_KEY")!
);

serve(async (req) => {
  const url = new URL(req.url);
  const basePath = "/functions/v1/filesystem-mcp";
  const bucket = "chatguru-files";

  // Handle SSE connections
  if (url.pathname === `${basePath}/sse`) {
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue("data: filesystem-mcp connected\n\n");
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

      if (tool === "read_file") {
        const { path } = args;
        const { data, error } = await supabase.storage.from(bucket).download(path);
        if (error) {
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }
        const content = await data.text();
        return new Response(
          JSON.stringify({
            content: [{ type: "text", text: content }],
          }),
          { headers: { "Content-Type": "application/json" } }
        );
      } 
      else if (tool === "read_multiple_files") {
        const { paths } = args;
        const results = [];
        for (const path of paths) {
          const { data, error } = await supabase.storage.from(bucket).download(path);
          if (error) {
            results.push(`Error reading ${path}: ${error.message}`);
          } else {
            results.push(await data.text());
          }
        }
        return new Response(
          JSON.stringify({
            content: [{ type: "text", text: results.join("\n") }],
          }),
          { headers: { "Content-Type": "application/json" } }
        );
      } 
      else if (tool === "write_file") {
        const { path, content } = args;
        const { error } = await supabase.storage.from(bucket).upload(path, content, {
          contentType: "text/plain",
          upsert: true,
        });
        if (error) {
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }
        return new Response(
          JSON.stringify({
            content: [{ type: "text", text: "File written successfully" }],
          }),
          { headers: { "Content-Type": "application/json" } }
        );
      } 
      else if (tool === "create_directory") {
        const { path } = args;
        // In Supabase Storage, directories are implicit; create a dummy file to ensure the path exists
        const { error } = await supabase.storage.from(bucket).upload(`${path}/.keep`, "", {
          contentType: "text/plain",
          upsert: true,
        });
        if (error) {
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }
        return new Response(
          JSON.stringify({
            content: [{ type: "text", text: "Directory created successfully" }],
          }),
          { headers: { "Content-Type": "application/json" } }
        );
      } 
      else if (tool === "list_directory") {
        const { path } = args;
        const { data, error } = await supabase.storage.from(bucket).list(path);
        if (error) {
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }
        const files = data
          .map((item) => {
            if (item.name === ".") return null;
            if (item.id) {
              return `[FILE] ${item.name}`;
            } else {
              return `[DIR] ${item.name}`;
            }
          })
          .filter(Boolean);
        const list = files.join("\n");
        return new Response(
          JSON.stringify({
            content: [{ type: "text", text: list }],
          }),
          { headers: { "Content-Type": "application/json" } }
        );
      } 
      else if (tool === "move_file") {
        const { source, destination } = args;
        const { error } = await supabase.storage.from(bucket).move(source, destination);
        if (error) {
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }
        return new Response(
          JSON.stringify({
            content: [{ type: "text", text: "File moved successfully" }],
          }),
          { headers: { "Content-Type": "application/json" } }
        );
      } 
      else if (tool === "search_files") {
        const { path, pattern } = args;
        const { data, error } = await supabase.storage.from(bucket).list(path, { search: pattern });
        if (error) {
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }
        const matches = data.map((item) => `${path}/${item.name}`).join("\n");
        return new Response(
          JSON.stringify({
            content: [{ type: "text", text: matches }],
          }),
          { headers: { "Content-Type": "application/json" } }
        );
      } 
      else if (tool === "get_file_info") {
        const { path } = args;
        const { data, error } = await supabase.storage.from(bucket).list(path, { limit: 1, offset: 0 });
        if (error || !data || data.length === 0) {
          return new Response(
            JSON.stringify({ error: "File not found" }),
            { status: 404, headers: { "Content-Type": "application/json" } }
          );
        }
        const file = data[0];
        const info = {
          size: file.metadata?.size,
          created_at: file.created_at,
          updated_at: file.updated_at,
          type: file.id ? "file" : "directory",
        };
        return new Response(
          JSON.stringify({
            content: [{ type: "text", text: JSON.stringify(info) }],
          }),
          { headers: { "Content-Type": "application/json" } }
        );
      } 
      else if (tool === "list_allowed_directories") {
        return new Response(
          JSON.stringify({
            content: [{ type: "text", text: bucket }],
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