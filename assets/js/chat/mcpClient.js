// /assets/js/chat/mcpClient.js

// Use an environment-based endpoint: local if running on localhost, otherwise production
const MCP_ENDPOINT =
  window.location.hostname === "localhost"
    ? "http://localhost:3001"
    : "https://zxkvmgmcjuigfgevwdrc.supabase.co/functions/v1";

export class CustomMCPClient {
  constructor({ sseUrl = `${MCP_ENDPOINT}/sse`, postUrl = `${MCP_ENDPOINT}/messages` } = {}) {
    this.sseUrl = sseUrl;
    this.postUrl = postUrl;
    this.eventSource = new EventSource(sseUrl);
    this.eventSource.onmessage = (event) => {
      console.log("MCP SSE Message:", JSON.parse(event.data));
    };
  }

  async sendMessage(message) {
    const response = await fetch(this.postUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(message),
    });
    return response.json();
  }

  async readResource(uri) {
    const message = { type: "readResource", params: { uri } };
    return this.sendMessage(message);
  }

  async callTool({ name, arguments: toolArguments }) {
    const message = { type: "callTool", params: { name, arguments: toolArguments } };
    return this.sendMessage(message);
  }

  close() {
    this.eventSource.close();
  }
}
