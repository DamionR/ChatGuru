// Replace with your OpenRouter API key
const OPENROUTER_API_KEY = "your_openrouter_api_key_here";

function addMessage(role, content) {
  const chatWindow = document.getElementById("chat-window");
  const messageDiv = document.createElement("div");
  messageDiv.className = `message ${role}`;
  messageDiv.innerHTML = `<span>${content}</span>`;
  chatWindow.appendChild(messageDiv);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

async function sendMessage() {
  const input = document.getElementById("chat-input");
  const modelSelect = document.getElementById("model-select");
  const message = input.value.trim();
  const selectedModel = modelSelect.value;

  if (!message) return;

  // Add user message to chat
  addMessage("user", message);
  input.value = "";

  // Show loading message
  addMessage("assistant", "Thinking...");

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: [{ role: "user", content: message }],
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch response from OpenRouter");
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