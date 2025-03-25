import { supabase } from "../../js/supabase-client.js";

// Save the current conversation history for the logged‑in user.
// Conversation data is stored as JSON in the "conversations" table, keyed by user_id.
export async function saveConversation(userId, conversationHistory) {
  try {
    const { data, error } = await supabase
      .from("conversations")
      .upsert({
        user_id: userId,
        conversation: JSON.stringify(conversationHistory),
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });
    if (error) throw error;
    return data;
  } catch (err) {
    console.error("Error saving conversation history:", err);
    return null;
  }
}

// Load the conversation history for the logged‑in user.
export async function loadConversations(userId) {
  try {
    const { data, error } = await supabase
      .from("conversations")
      .select("conversation, updated_at")
      .eq("user_id", userId)
      .single();
    if (error && error.code !== "PGRST116") {
      throw error;
    }
    if (data && data.conversation) {
      return { conversation: JSON.parse(data.conversation), updated_at: data.updated_at };
    } else {
      return { conversation: [], updated_at: null };
    }
  } catch (err) {
    console.error("Error loading conversation history:", err);
    return { conversation: [], updated_at: null };
  }
}

// Display conversation history in the UI.
export function displayConversations(conversationData) {
  const container = document.getElementById("conversation-history");
  if (!container) return;
  container.innerHTML = "";
  const { conversation, updated_at } = conversationData;
  if (conversation.length === 0) {
    container.innerHTML = "<p>No previous conversations found.</p>";
    return;
  }
  // Create a conversation item representing the last conversation.
  const convItem = document.createElement("div");
  convItem.className = "conversation-item";
  convItem.textContent = `Last conversation: ${new Date(updated_at).toLocaleString()}`;
  convItem.addEventListener("click", () => {
    // Set the global conversation history and reload chat messages.
    window.conversationHistory = conversation;
    const chatWindow = document.getElementById("chat-window");
    chatWindow.innerHTML = "";
    conversation.forEach((msg) => {
      import("./chatRenderer.js").then((module) => {
        module.addMessage(msg.role, [{ type: "text", text: msg.content }]);
      });
    });
  });
  container.appendChild(convItem);
}