// side_panel.js
document.getElementById('submitButton').addEventListener('click', () => {
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;

  // Perform actions with the username and password values
  console.log('Username:', username);
  console.log('Password:', password);

  chrome.runtime.sendMessage({
      type: 'loginCredentials',
      username: username,
      password: password
  });
});

let i = 0;
document.getElementById('sendNativeMessageButton').addEventListener('click', () => {
  chrome.runtime.sendMessage({
      type: 'sendNativeMessage',
      payload: 'hello ' + i
  });
  i = i + 1;
});

document.getElementById('queryDOMButton').addEventListener('click', () => {
  chrome.runtime.sendMessage({ type: 'queryActiveTabDOM' });
});

document.getElementById('saveApiKey').addEventListener('click', () => {
  const apiKey = document.getElementById('apiKey').value;
  chrome.storage.local.set({ 'chatgptApiKey': apiKey }, () => {
    console.log('API Key saved');
    document.getElementById('apiKey').value = '';
  });
});

document.getElementById('sendChatGPTButton').addEventListener('click', () => {
  const prompt = document.getElementById('chatgptPrompt').value;
  chrome.storage.local.get(['chatgptApiKey'], (result) => {
    if (result.chatgptApiKey) {
      chrome.runtime.sendMessage({
        type: 'sendChatGPTRequest',
        prompt: prompt,
        apiKey: result.chatgptApiKey
      });
    } else {
      document.getElementById('chatgptResult').textContent = 'Please set your API key first.';
    }
  });
});

// Listen for the query results from the background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'queryResults') {
    const resultDiv = document.getElementById('queryResult');
    if (message.results.startsWith("Unable to access") || message.results.startsWith("An error occurred")) {
      resultDiv.innerHTML = `<p style="color: red;">${message.results}</p>`;
    } else {
      resultDiv.innerHTML = message.results;
    }
  } else if (message.type === 'chatGPTResponse') {
    const resultDiv = document.getElementById('chatgptResult');
    resultDiv.textContent = message.response;
  }
});