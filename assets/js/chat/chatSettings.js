// /Users/damionrashford/ChatGuru/assets/js/chat/chatSettings.js

export function loadSettings() {
    document.getElementById("api-key").value = localStorage.getItem("chatguru_api_key") || "";
    document.getElementById("system-prompt").value = localStorage.getItem("chatguru_system_prompt") || "";
    document.getElementById("temperature").value = localStorage.getItem("chatguru_temperature") || "1.0";
    document.getElementById("top-p").value = localStorage.getItem("chatguru_top_p") || "1.0";
    document.getElementById("top-k").value = localStorage.getItem("chatguru_top_k") || "0";
    document.getElementById("frequency-penalty").value = localStorage.getItem("chatguru_frequency_penalty") || "0.0";
    document.getElementById("presence-penalty").value = localStorage.getItem("chatguru_presence_penalty") || "0.0";
    document.getElementById("repetition-penalty").value = localStorage.getItem("chatguru_repetition_penalty") || "1.0";
    document.getElementById("min-p").value = localStorage.getItem("chatguru_min_p") || "0.0";
    document.getElementById("top-a").value = localStorage.getItem("chatguru_top_a") || "0.0";
    document.getElementById("seed").value = localStorage.getItem("chatguru_seed") || "";
    document.getElementById("max-tokens").value = localStorage.getItem("chatguru_max_tokens") || "4096";
  }
  
  export function saveSettings() {
    localStorage.setItem("chatguru_api_key", document.getElementById("api-key").value);
    localStorage.setItem("chatguru_system_prompt", document.getElementById("system-prompt").value);
    localStorage.setItem("chatguru_temperature", document.getElementById("temperature").value);
    localStorage.setItem("chatguru_top_p", document.getElementById("top-p").value);
    localStorage.setItem("chatguru_top_k", document.getElementById("top-k").value);
    localStorage.setItem("chatguru_frequency_penalty", document.getElementById("frequency-penalty").value);
    localStorage.setItem("chatguru_presence_penalty", document.getElementById("presence-penalty").value);
    localStorage.setItem("chatguru_repetition_penalty", document.getElementById("repetition-penalty").value);
    localStorage.setItem("chatguru_min_p", document.getElementById("min-p").value);
    localStorage.setItem("chatguru_top_a", document.getElementById("top-a").value);
    localStorage.setItem("chatguru_seed", document.getElementById("seed").value);
    localStorage.setItem("chatguru_max_tokens", document.getElementById("max-tokens").value);
  }
  