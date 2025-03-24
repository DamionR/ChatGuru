---
layout: default
title: ChatGuru
---

<div class="chat-container">
  <h1>ChatGuru with OpenRouter</h1>
  <div class="model-selector">
    <label for="model-select">Select Model:</label>
    <select id="model-select">
      {% for model in site.data.models %}
        <option value="{{ model.id }}">{{ model.name }}</option>
      {% endfor %}
    </select>
  </div>
  <div id="chat-window" class="chat-window">
    <p>Start chatting below!</p>
  </div>
  <div class="chat-input">
    <textarea id="chat-input" rows="3" placeholder="Type your message..."></textarea>
    <button onclick="sendMessage()">Send</button>
  </div>
</div>

<script src="/ChatGuru/assets/js/chat.js"></script>