// side_panel.js

const logStyle =
"background: #000030; color: #000; padding: 2px 5px; border-radius: 3px;";

document.addEventListener('DOMContentLoaded', async () => {
  // Check for pending messages when panel opens
  const data = await chrome.storage.local.get('pendingGptResult');
  console.log("pendingGptResult: ", data)
  if (data.pendingGptResult) {
    // Handle the pending message
    renderGptResult(JSON.parse(data.pendingGptResult));
    // Clear the pending message
    await chrome.storage.local.remove('pendingGptResult');
    // Clear the badge
    chrome.action.setBadgeText({ text: "" });
  }
});

document.getElementById("submitButton").addEventListener("click", () => {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  // Perform actions with the username and password values
  console.log("Username:", username);
  console.log("Password:", password);

  chrome.runtime.sendMessage({
    type: "loginCredentials",
    username: username,
    password: password,
  });
});

let i = 0;

document.getElementById("saveApiKey").addEventListener("click", () => {
  const apiKey = document.getElementById("apiKey").value;
  if (apiKey.length == 0) return;
  chrome.storage.local.set({ chatgptApiKey: apiKey }, () => {
    console.log("API Key saved");
    document.getElementById("apiKey").value = "";
  });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "domStructure") {
    const domStructureDiv = document.getElementById("domStructure");
    domStructureDiv.innerHTML = message.domStructure;
  } else if (message.type === "chatGPTResponse") {
    const resultDiv = document.getElementById("chatgptResult");
    resultDiv.textContent = message.response;
  } else if (message.type === "llm_result") {
    renderGptResult(JSON.parse(message.data));
  } 
});

function renderGptResult(data) {

  const content = document.getElementById('chatgptResult');

  // Clear previous content
  content.innerHTML = '';

  // Create summary card
  const summaryCard = document.createElement('div');
  summaryCard.className = 'card';
  summaryCard.innerHTML = `
      <h2 class="card-title">Summary</h2>
      <p class="summary">${data.summary}</p>
  `;

  // Create key points card
  const factsCard = document.createElement('div');
  factsCard.className = 'card';
  factsCard.innerHTML = `
      <h2 class="card-title">Key Points</h2>
      ${data.facts.map(fact => `
          <div class="fact-item">
              <span class="quote-icon">❝</span>
              <p>${fact}</p>
          </div>
      `).join('')}
  `;

  // Append both cards
  content.appendChild(summaryCard);
  content.appendChild(factsCard);
}
