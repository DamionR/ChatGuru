// Replace with your OpenRouter API key
const OPENROUTER_API_KEY = "your_openrouter_api_key_here";

// Fetch models dynamically from OpenRouter API
async function fetchModels() {
  try {
    const response = await fetch("https://openrouter.ai/api/v1/models", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch models from OpenRouter");
    }

    const data = await response.json();
    const modelSelect = document.getElementById("model-select");

    // Filter models to include only those with "free" in the ID (as per your requirement)
    const freeModels = data.data.filter(model => model.id.includes(":free"));

    // Populate the model selector
    freeModels.forEach(model => {
      const option = document.createElement("option");
      option.value = model.id;
      option.textContent = model.name || model.id; // Use name if available, otherwise ID
      modelSelect.appendChild(option);
    });

    // Store model data for later use (e.g., context length, pricing)
    window.modelData = freeModels.reduce((acc, model) => {
      acc[model.id] = {
        contextLength: model.context_length || model.top_provider?.context_length || 8192, // Default to 8192 if not specified
        maxCompletionTokens: model.top_provider?.max_completion_tokens || 4096, // Default to 4096
        pricing: model.pricing || { prompt: "0", completion: "0" },
        supportedParameters: model.supported_parameters || [
          "temperature", "top_p", "top_k", "frequency_penalty", "presence_penalty",
          "repetition_penalty", "min_p", "top_a", "seed", "max_tokens", "logit_bias",
          "top_logprobs", "response_format", "tools", "tool_choice"
        ],
      };
      return acc;
    }, {});
  } catch (error) {
    console.error("Error fetching models:", error);
    const modelSelect = document.getElementById("model-select");
    modelSelect.innerHTML = '<option value="">Failed to load models</option>';
  }
}

// Add a message to the chat window
function addMessage(role, content) {
  const chatWindow = document.getElementById("chat-window");
  const messageDiv = document.createElement("div");
  messageDiv.className = `message ${role}`;
  messageDiv.innerHTML = `<span>${content}</span>`;
  chatWindow.appendChild(messageDiv);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

// Send a message to OpenRouter
async function sendMessage() {
  const input = document.getElementById("chat-input");
  const modelSelect = document.getElementById("model-select");
  const message = input.value.trim();
  const selectedModel = modelSelect.value;

  if (!message) return;
  if (!selectedModel) {
    addMessage("assistant", "Please select a model first.");
    return;
  }

  // Add user message to chat
  addMessage("user", message);
  input.value = "";

  // Show loading message
  addMessage("assistant", "Thinking...");

  try {
    const modelInfo = window.modelData[selectedModel];
    const maxTokens = Math.min(modelInfo.maxCompletionTokens, 4096); // Cap at 4096 for safety

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: [{ role: "user", content: message }],
        max_tokens: maxTokens,
        temperature: 1.0, // Default as per OpenRouter docs
        top_p: 1.0,
        top_k: 0,
        frequency_penalty: 0.0,
        presence_penalty: 0.0,
        repetition_penalty: 1.0,
        min_p: 0.0,
        top_a: 0.0,
        stream: false, // Streaming can be enabled if needed
      }),
    });

    if (!response.ok) {
        const status = response.status;
        let errorMessage = "Something went wrong.";
        if (status === 401) errorMessage = "Invalid API key.";
        if (status === 429) errorMessage = "Rate limit exceeded.";
        throw new Error(errorMessage);
      }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content.trim();

    // Remove loading message
    const chatWindow = document.getElementById("chat-window");
    chatWindow.removeChild(chatWindow.lastChild);

    // Add AI response
    addMessage("assistant", aiResponse);
  } catch (error) {
    console.error("Error:", error);
    // Remove loading message
    const chatWindow = document.getElementById("chat-window");
    chatWindow.removeChild(chatWindow.lastChild);
    addMessage("assistant", "Sorry, something went wrong.");
  }
}

// Allow sending messages with Enter key
document.getElementById("chat-input").addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

// Fetch models when the page loads
document.addEventListener("DOMContentLoaded", fetchModels);