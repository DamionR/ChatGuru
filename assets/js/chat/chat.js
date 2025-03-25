// /assets/js/chat/chat.js

import { CustomMCPClient } from "./mcpClient.js";
import { addMessage } from "./chatRenderer.js";
import { loadSettings, saveSettings } from "./chatSettings.js";
import { loadConversations, saveConversation, displayConversations } from "./conversationHistory.js";
import { supabase } from "../../js/supabase-client.js";

const mcpClient = new CustomMCPClient();

// Global conversation history (array of objects with { role, content })
window.conversationHistory = [];

// Fetch models dynamically from OpenRouter
async function fetchModels() {
  try {
    const response = await fetch("https://openrouter.ai/api/v1/models", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    if (!response.ok) throw new Error("Failed to fetch models from OpenRouter");
    const data = await response.json();
    const modelSelect = document.getElementById("model-select");
    const freeModels = data.data.filter((model) => model.id.includes(":free"));
    freeModels.forEach((model) => {
      const option = document.createElement("option");
      option.value = model.id;
      option.textContent = model.name || model.id;
      modelSelect.appendChild(option);
    });
    window.modelData = freeModels.reduce((acc, model) => {
      acc[model.id] = {
        contextLength: model.context_length || (model.top_provider?.context_length || 8192),
        maxCompletionTokens: model.top_provider?.max_completion_tokens || 4096,
        pricing: model.pricing || { prompt: "0", completion: "0" },
        supportedParameters: model.supported_parameters || [
          "temperature",
          "top_p",
          "top_k",
          "frequency_penalty",
          "presence_penalty",
          "repetition_penalty",
          "min_p",
          "top_a",
          "seed",
          "max_tokens",
        ],
      };
      return acc;
    }, {});
  } catch (error) {
    console.error("Error fetching models:", error);
    document.getElementById("model-select").innerHTML =
      '<option value="">Failed to load models</option>';
    addMessage("assistant", [
      { type: "text", text: "Failed to load AI models. Please refresh or try again later." },
    ]);
  }
}

// Initialize conversation history for logged-in users.
async function initConversationHistory() {
  const { data: { session } } = await supabase.auth.getSession();
  if (session && session.user) {
    const userId = session.user.id;
    const convData = await loadConversations(userId);
    window.conversationHistory = convData.conversation || [];
    displayConversations(convData);
  }
}

// Send a notification via MCP
async function sendNotification(message) {
  try {
    const result = await mcpClient.callTool({
      name: "send-notification",
      arguments: { message },
    });
    addMessage("assistant", [{ type: "text", text: result.content[0].text }]);
  } catch (error) {
    console.error("Error sending notification:", error);
    addMessage("assistant", [{ type: "text", text: "Failed to send notification." }]);
  }
}

// Send a message to OpenRouter and update conversation history
async function sendMessage() {
  const input = document.getElementById("chat-input");
  const modelSelect = document.getElementById("model-select");
  const message = input.value.trim();
  const selectedModel = modelSelect.value;
  if (!message) return;
  if (!selectedModel) {
    addMessage("assistant", [{ type: "text", text: "Please select a model first." }]);
    return;
  }
  const apiKey = localStorage.getItem("chatguru_api_key");
  if (!apiKey) {
    alert("Please set your API key in the settings.");
    document.getElementById("settings-modal").style.display = "flex";
    return;
  }
  if (!window.modelData || !window.modelData[selectedModel]) {
    addMessage("assistant", [{ type: "text", text: "AI model data is unavailable. Please refresh the page." }]);
    return;
  }
  
  addMessage("user", [{ type: "text", text: message }]);
  input.value = "";
  addMessage("assistant", [{ type: "text", text: "Thinking..." }]);
  
  try {
    const systemPrompt = localStorage.getItem("chatguru_system_prompt") || "";
    const temperature = parseFloat(localStorage.getItem("chatguru_temperature")) || 1.0;
    const topP = parseFloat(localStorage.getItem("chatguru_top_p")) || 1.0;
    const topK = parseInt(localStorage.getItem("chatguru_top_k")) || 0;
    const frequencyPenalty = parseFloat(localStorage.getItem("chatguru_frequency_penalty")) || 0.0;
    const presencePenalty = parseFloat(localStorage.getItem("chatguru_presence_penalty")) || 0.0;
    const repetitionPenalty = parseFloat(localStorage.getItem("chatguru_repetition_penalty")) || 1.0;
    const minP = parseFloat(localStorage.getItem("chatguru_min_p")) || 0.0;
    const topA = parseFloat(localStorage.getItem("chatguru_top_a")) || 0.0;
    const seed = localStorage.getItem("chatguru_seed") ? parseInt(localStorage.getItem("chatguru_seed")) : null;
    const maxTokens = parseInt(localStorage.getItem("chatguru_max_tokens")) || 4096;

    if (conversationHistory.length === 0 && systemPrompt) {
      conversationHistory.push({ role: "system", content: systemPrompt });
    }
    conversationHistory.push({ role: "user", content: message });

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: conversationHistory,
        max_tokens: Math.min(maxTokens, window.modelData[selectedModel].maxCompletionTokens),
        temperature: temperature,
        top_p: topP,
        top_k: topK,
        frequency_penalty: frequencyPenalty,
        presence_penalty: presencePenalty,
        repetition_penalty: repetitionPenalty,
        min_p: minP,
        top_a: topA,
        seed: seed,
        stream: false,
      }),
    });

    if (!response.ok) throw new Error("Failed to fetch response from OpenRouter");
    const data = await response.json();
    const aiResponse = data.choices[0].message.content.trim();

    const chatWindow = document.getElementById("chat-window");
    chatWindow.removeChild(chatWindow.lastChild);
    conversationHistory.push({ role: "assistant", content: aiResponse });
    addMessage("assistant", [{ type: "text", text: aiResponse }]);

    // Save conversation if user is logged in.
    const { data: { session } } = await supabase.auth.getSession();
    if (session && session.user) {
      await saveConversation(session.user.id, conversationHistory);
      const convData = await loadConversations(session.user.id);
      displayConversations(convData);
    }
    await sendNotification(`New message: ${message}`);
  } catch (error) {
    console.error("Error:", error);
    const chatWindow = document.getElementById("chat-window");
    chatWindow.removeChild(chatWindow.lastChild);
    if (error.message.includes("401")) {
      addMessage("assistant", [{ type: "text", text: "Invalid API key. Please check your settings." }]);
    } else {
      addMessage("assistant", [{ type: "text", text: "Sorry, something went wrong." }]);
    }
  }
}

// Event listeners
document.getElementById("chat-input").addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

document.getElementById("settings-button").addEventListener("click", () => {
  document.getElementById("settings-modal").style.display = "flex";
  loadSettings();
});

document.getElementById("settings-form").addEventListener("submit", (e) => {
  e.preventDefault();
  saveSettings();
  document.getElementById("settings-modal").style.display = "none";
  conversationHistory = [];
  document.getElementById("chat-window").innerHTML = '<p>Start chatting below!</p>';
});

// Fetch models and initialize conversation history on DOM load.
document.addEventListener("DOMContentLoaded", () => {
  fetchModels();
  initConversationHistory();
});
