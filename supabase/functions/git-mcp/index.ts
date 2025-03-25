import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js";

const supabase = createClient(
  "https://zxkvmgmcjuigfgevwdrc.supabase.co",
  Deno.env.get("SERVICE_ROLE_KEY")!
);
const bucket = "chatguru-files";

serve(async (req) => {
  const url = new URL(req.url);
  const basePath = "/functions/v1/git-mcp";

  // Handle SSE connections
  if (url.pathname === `${basePath}/sse`) {
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue("data: git-mcp connected\n\n");
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

      if (tool === "git_status") {
        const { repo_path } = args;
        const { data, error } = await supabase.storage.from(bucket).list(repo_path);
        if (error) {
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }
        const status = data.map((item) => `${item.name}: tracked`).join("\n");
        return new Response(
          JSON.stringify({
            content: [{ type: "text", text: status || "No changes" }],
          }),
          { headers: { "Content-Type": "application/json" } }
        );
      } 
      else if (tool === "git_diff_unstaged" || tool === "git_diff_staged") {
        const { repo_path } = args;
        // Simplified: list files as a diff-like output
        const { data, error } = await supabase.storage.from(bucket).list(repo_path);
        if (error) {
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }
        const diff = data.map((item) => `diff --git a/${item.name} b/${item.name}`).join("\n");
        return new Response(
          JSON.stringify({
            content: [{ type: "text", text: diff || "No differences" }],
          }),
          { headers: { "Content-Type": "application/json" } }
        );
      } 
      else if (tool === "git_commit") {
        const { repo_path, message } = args;
        // Simulate commit by adding a commit log entry
        const commitPath = `${repo_path}/.git/commits/${Date.now()}`;
        const { error } = await supabase.storage.from(bucket).upload(
          commitPath,
          JSON.stringify({ message, timestamp: new Date().toISOString() }),
          { contentType: "application/json" }
        );
        if (error) {
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }
        return new Response(
          JSON.stringify({
            content: [{ type: "text", text: `Committed with hash: ${commitPath.split("/").pop()}` }],
          }),
          { headers: { "Content-Type": "application/json" } }
        );
      } 
      else if (tool === "git_add") {
        const { repo_path, files } = args;
        // In this context, "add" is a no-op since files are already in Storage
        return new Response(
          JSON.stringify({
            content: [{ type: "text", text: `Staged files: ${files.join(", ")}` }],
          }),
          { headers: { "Content-Type": "application/json" } }
        );
      } 
      else if (tool === "git_reset") {
        const { repo_path } = args;
        // Simplified: no real staging to reset in this context
        return new Response(
          JSON.stringify({
            content: [{ type: "text", text: "Staging area reset" }],
          }),
          { headers: { "Content-Type": "application/json" } }
        );
      } 
      else if (tool === "git_log") {
        const { repo_path, max_count = 10 } = args;
        const { data, error } = await supabase.storage.from(bucket).list(`${repo_path}/.git/commits`);
        if (error) {
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }
        const commits = await Promise.all(
          data.slice(0, max_count).map(async (item) => {
            const { data: commitData, error: fetchError } = await supabase.storage
              .from(bucket)
              .download(`${repo_path}/.git/commits/${item.name}`);
            if (fetchError) return `Error fetching commit ${item.name}`;
            const commit = JSON.parse(await commitData.text());
            return `${item.name} - ${commit.message} (${commit.timestamp})`;
          })
        );
        return new Response(
          JSON.stringify({
            content: [{ type: "text", text: commits.join("\n") }],
          }),
          { headers: { "Content-Type": "application/json" } }
        );
      } 
      else if (tool === "git_create_branch") {
        const { repo_path, branch_name } = args;
        const branchPath = `${repo_path}/.git/refs/heads/${branch_name}`;
        const { error } = await supabase.storage.from(bucket).upload(branchPath, "", {
          contentType: "text/plain",
        });
        if (error) {
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }
        return new Response(
          JSON.stringify({
            content: [{ type: "text", text: `Branch ${branch_name} created` }],
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