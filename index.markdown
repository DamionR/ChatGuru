---
layout: default
title: ChatGuru
---

<div class="chat-container">
  <h1>ChatGuru with OpenRouter</h1>
  
  <!-- Conversation History Section -->
  <div id="conversation-history" class="conversation-history">
    <p>Loading conversation history...</p>
  </div>
  
  <div class="model-selector">
    <label for="model-select">Select Model:</label>
    <select id="model-select">
      <!-- Models will be populated dynamically -->
    </select>
    <button id="settings-button">⚙️ Settings</button>
  </div>
  <div id="chat-window" class="chat-window">
    <p>Start chatting below!</p>
  </div>
  <div class="chat-input">
    <textarea id="chat-input" rows="3" placeholder="Type your message..."></textarea>
    <button onclick="sendMessage()">Send</button>
  </div>
</div>

<div id="settings-modal" class="modal" style="display: none;">
  <div class="modal-content">
    <h2>Settings</h2>
    <form id="settings-form">
      <label for="api-key">API Key:</label>
      <input type="password" id="api-key" name="api-key" required>
      <p style="color: red;">Note: Your API key is stored locally in your browser. Do not share it with others.</p>
      <label for="system-prompt">System Prompt:</label>
      <textarea id="system-prompt" name="system-prompt" rows="3"></textarea>
      <label for="temperature">Temperature (0-2):</label>
      <input type="number" id="temperature" name="temperature" min="0" max="2" step="0.1" value="1.0">
      <label for="top-p">Top P (0-1):</label>
      <input type="number" id="top-p" name="top-p" min="0" max="1" step="0.1" value="1.0">
      <label for="top-k">Top K (0+):</label>
      <input type="number" id="top-k" name="top-k" min="0" step="1" value="0">
      <label for="frequency-penalty">Frequency Penalty (-2 to 2):</label>
      <input type="number" id="frequency-penalty" name="frequency-penalty" min="-2" max="2" step="0.1" value="0.0">
      <label for="presence-penalty">Presence Penalty (-2 to 2):</label>
      <input type="number" id="presence-penalty" name="presence-penalty" min="-2" max="2" step="0.1" value="0.0">
      <label for="repetition-penalty">Repetition Penalty (0+):</label>
      <input type="number" id="repetition-penalty" name="repetition-penalty" min="0" step="0.1" value="1.0">
      <label for="min-p">Min P (0-1):</label>
      <input type="number" id="min-p" name="min-p" min="0" max="1" step="0.1" value="0.0">
      <label for="top-a">Top A (0+):</label>
      <input type="number" id="top-a" name="top-a" min="0" step="0.1" value="0.0">
      <label for="seed">Seed (optional):</label>
      <input type="number" id="seed" name="seed">
      <label for="max-tokens">Max Tokens (1+):</label>
      <input type="number" id="max-tokens" name="max-tokens" min="1" step="1" value="4096">
      <button type="submit">Save</button>
    </form>
  </div>
</div>

<script src="/ChatGuru/assets/js/chat/chat.js"></script>
