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

// Listen for the query results from the background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'queryResults') {
      document.getElementById('queryResult').innerHTML = message.results;
  }
});