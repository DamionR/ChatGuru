import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const GITHUB_API_URL = "https://api.github.com";
const GITHUB_TOKEN = Deno.env.get("GITHUB_TOKEN");

serve(async (req) => {
  const url = new URL(req.url);
  const basePath = "/functions/v1/github-mcp";

  // Handle SSE connections
  if (url.pathname === `${basePath}/sse`) {
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue("data: github-mcp connected\n\n");
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

      if (!GITHUB_TOKEN) {
        return new Response(
          JSON.stringify({ error: "GitHub token not configured" }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }

      if (tool === "create_or_update_file") {
        const { owner, repo, path, content, message, branch, sha } = args;
        const encodedContent = btoa(unescape(encodeURIComponent(content)));
        const response = await fetch(`${GITHUB_API_URL}/repos/${owner}/${repo}/contents/${path}`, {
          method: "PUT",
          headers: {
            "Authorization": `token ${GITHUB_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message,
            content: encodedContent,
            branch,
            sha,
          }),
        });
        if (!response.ok) {
          const errorData = await response.json();
          return new Response(
            JSON.stringify({ error: errorData.message }),
            { status: response.status, headers: { "Content-Type": "application/json" } }
          );
        }
        const data = await response.json();
        return new Response(
          JSON.stringify({
            content: [{ type: "text", text: JSON.stringify(data) }],
          }),
          { headers: { "Content-Type": "application/json" } }
        );
      } 
      else if (tool === "push_files") {
        const { owner, repo, branch, files, message } = args;
        // Simplified implementation: push one file at a time for now
        let lastCommitSha;
        for (const file of files) {
          const { path, content } = file;
          const encodedContent = btoa(unescape(encodeURIComponent(content)));
          const response = await fetch(`${GITHUB_API_URL}/repos/${owner}/${repo}/contents/${path}`, {
            method: "PUT",
            headers: {
              "Authorization": `token ${GITHUB_TOKEN}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              message,
              content: encodedContent,
              branch,
              sha: lastCommitSha,
            }),
          });
          if (!response.ok) {
            const errorData = await response.json();
            return new Response(
              JSON.stringify({ error: errorData.message }),
              { status: response.status, headers: { "Content-Type": "application/json" } }
            );
          }
          lastCommitSha = (await response.json()).commit.sha;
        }
        return new Response(
          JSON.stringify({
            content: [{ type: "text", text: "Files pushed successfully" }],
          }),
          { headers: { "Content-Type": "application/json" } }
        );
      } 
      else if (tool === "search_repositories") {
        const { query, page = 1, perPage = 30 } = args;
        const response = await fetch(
          `${GITHUB_API_URL}/search/repositories?q=${encodeURIComponent(query)}&page=${page}&per_page=${perPage}`,
          {
            headers: { "Authorization": `token ${GITHUB_TOKEN}` },
          }
        );
        if (!response.ok) {
          const errorData = await response.json();
          return new Response(
            JSON.stringify({ error: errorData.message }),
            { status: response.status, headers: { "Content-Type": "application/json" } }
          );
        }
        const data = await response.json();
        return new Response(
          JSON.stringify({
            content: [{ type: "text", text: JSON.stringify(data.items) }],
          }),
          { headers: { "Content-Type": "application/json" } }
        );
      } 
      else if (tool === "create_repository") {
        const { name, description, private: isPrivate, autoInit } = args;
        const response = await fetch(`${GITHUB_API_URL}/user/repos`, {
          method: "POST",
          headers: {
            "Authorization": `token ${GITHUB_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name,
            description,
            private: isPrivate,
            auto_init: autoInit,
          }),
        });
        if (!response.ok) {
          const errorData = await response.json();
          return new Response(
            JSON.stringify({ error: errorData.message }),
            { status: response.status, headers: { "Content-Type": "application/json" } }
          );
        }
        const data = await response.json();
        return new Response(
          JSON.stringify({
            content: [{ type: "text", text: JSON.stringify(data) }],
          }),
          { headers: { "Content-Type": "application/json" } }
        );
      } 
      else if (tool === "get_file_contents") {
        const { owner, repo, path, branch } = args;
        const response = await fetch(
          `${GITHUB_API_URL}/repos/${owner}/${repo}/contents/${path}${branch ? `?ref=${branch}` : ""}`,
          {
            headers: { "Authorization": `token ${GITHUB_TOKEN}` },
          }
        );
        if (!response.ok) {
          const errorData = await response.json();
          return new Response(
            JSON.stringify({ error: errorData.message }),
            { status: response.status, headers: { "Content-Type": "application/json" } }
          );
        }
        const data = await response.json();
        return new Response(
          JSON.stringify({
            content: [{ type: "text", text: atob(data.content) }],
          }),
          { headers: { "Content-Type": "application/json" } }
        );
      } 
      else if (tool === "create_issue") {
        const { owner, repo, title, body, assignees, labels, milestone } = args;
        const response = await fetch(`${GITHUB_API_URL}/repos/${owner}/${repo}/issues`, {
          method: "POST",
          headers: {
            "Authorization": `token ${GITHUB_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title,
            body,
            assignees,
            labels,
            milestone,
          }),
        });
        if (!response.ok) {
          const errorData = await response.json();
          return new Response(
            JSON.stringify({ error: errorData.message }),
            { status: response.status, headers: { "Content-Type": "application/json" } }
          );
        }
        const data = await response.json();
        return new Response(
          JSON.stringify({
            content: [{ type: "text", text: JSON.stringify(data) }],
          }),
          { headers: { "Content-Type": "application/json" } }
        );
      } 
      else if (tool === "create_pull_request") {
        const { owner, repo, title, body, head, base, draft, maintainer_can_modify } = args;
        const response = await fetch(`${GITHUB_API_URL}/repos/${owner}/${repo}/pulls`, {
          method: "POST",
          headers: {
            "Authorization": `token ${GITHUB_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title,
            body,
            head,
            base,
            draft,
            maintainer_can_modify,
          }),
        });
        if (!response.ok) {
          const errorData = await response.json();
          return new Response(
            JSON.stringify({ error: errorData.message }),
            { status: response.status, headers: { "Content-Type": "application/json" } }
          );
        }
        const data = await response.json();
        return new Response(
          JSON.stringify({
            content: [{ type: "text", text: JSON.stringify(data) }],
          }),
          { headers: { "Content-Type": "application/json" } }
        );
      } 
      else if (tool === "fork_repository") {
        const { owner, repo, organization } = args;
        const response = await fetch(`${GITHUB_API_URL}/repos/${owner}/${repo}/forks`, {
          method: "POST",
          headers: {
            "Authorization": `token ${GITHUB_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: organization ? JSON.stringify({ organization }) : undefined,
        });
        if (!response.ok) {
          const errorData = await response.json();
          return new Response(
            JSON.stringify({ error: errorData.message }),
            { status: response.status, headers: { "Content-Type": "application/json" } }
          );
        }
        const data = await response.json();
        return new Response(
          JSON.stringify({
            content: [{ type: "text", text: JSON.stringify(data) }],
          }),
          { headers: { "Content-Type": "application/json" } }
        );
      } 
      else if (tool === "create_branch") {
        const { owner, repo, branch, from_branch } = args;
        const refResponse = await fetch(`${GITHUB_API_URL}/repos/${owner}/${repo}/git/refs/heads${from_branch ? `/${from_branch}` : ""}`, {
          headers: { "Authorization": `token ${GITHUB_TOKEN}` },
        });
        if (!refResponse.ok) {
          const errorData = await refResponse.json();
          return new Response(
            JSON.stringify({ error: errorData.message }),
            { status: refResponse.status, headers: { "Content-Type": "application/json" } }
          );
        }
        const refData = await refResponse.json();
        const sha = refData.object.sha;
        const branchResponse = await fetch(`${GITHUB_API_URL}/repos/${owner}/${repo}/git/refs`, {
          method: "POST",
          headers: {
            "Authorization": `token ${GITHUB_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ref: `refs/heads/${branch}`,
            sha,
          }),
        });
        if (!branchResponse.ok) {
          const errorData = await branchResponse.json();
          return new Response(
            JSON.stringify({ error: errorData.message }),
            { status: branchResponse.status, headers: { "Content-Type": "application/json" } }
          );
        }
        const data = await branchResponse.json();
        return new Response(
          JSON.stringify({
            content: [{ type: "text", text: JSON.stringify(data) }],
          }),
          { headers: { "Content-Type": "application/json" } }
        );
      } 
      else if (tool === "list_issues") {
        const { owner, repo, state, labels, sort, direction, since, page, per_page } = args;
        const params = new URLSearchParams({
          ...(state && { state }),
          ...(labels && { labels: labels.join(",") }),
          ...(sort && { sort }),
          ...(direction && { direction }),
          ...(since && { since }),
          ...(page && { page: page.toString() }),
          ...(per_page && { per_page: per_page.toString() }),
        });
        const response = await fetch(`${GITHUB_API_URL}/repos/${owner}/${repo}/issues?${params}`, {
          headers: { "Authorization": `token ${GITHUB_TOKEN}` },
        });
        if (!response.ok) {
          const errorData = await response.json();
          return new Response(
            JSON.stringify({ error: errorData.message }),
            { status: response.status, headers: { "Content-Type": "application/json" } }
          );
        }
        const data = await response.json();
        return new Response(
          JSON.stringify({
            content: [{ type: "text", text: JSON.stringify(data) }],
          }),
          { headers: { "Content-Type": "application/json" } }
        );
      } 
      else if (tool === "update_issue") {
        const { owner, repo, issue_number, title, body, state, labels, assignees, milestone } = args;
        const response = await fetch(`${GITHUB_API_URL}/repos/${owner}/${repo}/issues/${issue_number}`, {
          method: "PATCH",
          headers: {
            "Authorization": `token ${GITHUB_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title,
            body,
            state,
            labels,
            assignees,
            milestone,
          }),
        });
        if (!response.ok) {
          const errorData = await response.json();
          return new Response(
            JSON.stringify({ error: errorData.message }),
            { status: response.status, headers: { "Content-Type": "application/json" } }
          );
        }
        const data = await response.json();
        return new Response(
          JSON.stringify({
            content: [{ type: "text", text: JSON.stringify(data) }],
          }),
          { headers: { "Content-Type": "application/json" } }
        );
      } 
      else if (tool === "add_issue_comment") {
        const { owner, repo, issue_number, body } = args;
        const response = await fetch(`${GITHUB_API_URL}/repos/${owner}/${repo}/issues/${issue_number}/comments`, {
          method: "POST",
          headers: {
            "Authorization": `token ${GITHUB_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ body }),
        });
        if (!response.ok) {
          const errorData = await response.json();
          return new Response(
            JSON.stringify({ error: errorData.message }),
            { status: response.status, headers: { "Content-Type": "application/json" } }
          );
        }
        const data = await response.json();
        return new Response(
          JSON.stringify({
            content: [{ type: "text", text: JSON.stringify(data) }],
          }),
          { headers: { "Content-Type": "application/json" } }
        );
      } 
      else if (tool === "search_code") {
        const { q, sort, order, per_page, page } = args;
        const params = new URLSearchParams({
          q,
          ...(sort && { sort }),
          ...(order && { order }),
          ...(per_page && { per_page: per_page.toString() }),
          ...(page && { page: page.toString() }),
        });
        const response = await fetch(`${GITHUB_API_URL}/search/code?${params}`, {
          headers: { "Authorization": `token ${GITHUB_TOKEN}` },
        });
        if (!response.ok) {
          const errorData = await response.json();
          return new Response(
            JSON.stringify({ error: errorData.message }),
            { status: response.status, headers: { "Content-Type": "application/json" } }
          );
        }
        const data = await response.json();
        return new Response(
          JSON.stringify({
            content: [{ type: "text", text: JSON.stringify(data.items) }],
          }),
          { headers: { "Content-Type": "application/json" } }
        );
      } 
      else if (tool === "search_issues") {
        const { q, sort, order, per_page, page } = args;
        const params = new URLSearchParams({
          q,
          ...(sort && { sort }),
          ...(order && { order }),
          ...(per_page && { per_page: per_page.toString() }),
          ...(page && { page: page.toString() }),
        });
        const response = await fetch(`${GITHUB_API_URL}/search/issues?${params}`, {
          headers: { "Authorization": `token ${GITHUB_TOKEN}` },
        });
        if (!response.ok) {
          const errorData = await response.json();
          return new Response(
            JSON.stringify({ error: errorData.message }),
            { status: response.status, headers: { "Content-Type": "application/json" } }
          );
        }
        const data = await response.json();
        return new Response(
          JSON.stringify({
            content: [{ type: "text", text: JSON.stringify(data.items) }],
          }),
          { headers: { "Content-Type": "application/json" } }
        );
      } 
      else if (tool === "search_users") {
        const { q, sort, order, per_page, page } = args;
        const params = new URLSearchParams({
          q,
          ...(sort && { sort }),
          ...(order && { order }),
          ...(per_page && { per_page: per_page.toString() }),
          ...(page && { page: page.toString() }),
        });
        const response = await fetch(`${GITHUB_API_URL}/search/users?${params}`, {
          headers: { "Authorization": `token ${GITHUB_TOKEN}` },
        });
        if (!response.ok) {
          const errorData = await response.json();
          return new Response(
            JSON.stringify({ error: errorData.message }),
            { status: response.status, headers: { "Content-Type": "application/json" } }
          );
        }
        const data = await response.json();
        return new Response(
          JSON.stringify({
            content: [{ type: "text", text: JSON.stringify(data.items) }],
          }),
          { headers: { "Content-Type": "application/json" } }
        );
      } 
      else if (tool === "list_commits") {
        const { owner, repo, page, per_page, sha } = args;
        const params = new URLSearchParams({
          ...(page && { page: page.toString() }),
          ...(per_page && { per_page: per_page.toString() }),
          ...(sha && { sha }),
        });
        const response = await fetch(`${GITHUB_API_URL}/repos/${owner}/${repo}/commits?${params}`, {
          headers: { "Authorization": `token ${GITHUB_TOKEN}` },
        });
        if (!response.ok) {
          const errorData = await response.json();
          return new Response(
            JSON.stringify({ error: errorData.message }),
            { status: response.status, headers: { "Content-Type": "application/json" } }
          );
        }
        const data = await response.json();
        return new Response(
          JSON.stringify({
            content: [{ type: "text", text: JSON.stringify(data) }],
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