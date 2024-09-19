// side_panel.js
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
document
  .getElementById("sendNativeMessageButton")
  .addEventListener("click", () => {
    chrome.runtime.sendMessage({
      type: "sendNativeMessage",
      payload: "hello " + i,
    });
    i = i + 1;
  });

document.getElementById("saveApiKey").addEventListener("click", () => {
  const apiKey = document.getElementById("apiKey").value;
  chrome.storage.local.set({ chatgptApiKey: apiKey }, () => {
    console.log("API Key saved");
    document.getElementById("apiKey").value = "";
  });
});

document.getElementById("analyzeDOMButton").addEventListener("click", () => {
  chrome.storage.local.get(["chatgptApiKey"], (result) => {
    if (result.chatgptApiKey) {
      chrome.runtime.sendMessage({
        type: "analyzeDOM",
        apiKey: result.chatgptApiKey,
      });
    } else {
      document.getElementById("chatgptResult").textContent =
        "Please set your API key first.";
    }
  });
});

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "domStructure") {
    const domStructureDiv = document.getElementById("domStructure");
    domStructureDiv.textContent = message.domStructure;
  } else if (message.type === "chatGPTResponse") {
    const resultDiv = document.getElementById("chatgptResult");
    resultDiv.textContent = message.response;
  }
});

document.getElementById("sendChatGPTButton").addEventListener("click", () => {
  // const prompt = document.getElementById('chatgptPrompt').value;
  const systemPrompt =
    "This is a input and button element from a webpage, is it a login page? If yes, return the element id for the username, password and submit/next button. output is in json format, and include and only include three keys: username, password, submit; \
   If it is not a login page, return a empty json object.";
  const userPrompt =
    '\
Input Elements (excluding hidden):\
Input 1: type="text", id="login-username", name="username"\
Input 2: type="password", id="", name="passwd"\
Input 3: type="submit", id="login-signin", name="signin"\
Input 4: type="checkbox", id="persistent", name="persistent"\
Input 5: type="checkbox", id="mbr-legacy-device-bar-cross", name=""\
Button Elements:\
Button 1: id="tpa-google-button", text=" Sign in with Google "';

  chrome.storage.local.get(["chatgptApiKey"], (result) => {
    if (result.chatgptApiKey) {
      chrome.runtime.sendMessage({
        type: "sendChatGPTRequest",
        systemPrompt: systemPrompt,
        userPrompt: userPrompt,
        apiKey: result.chatgptApiKey,
      });
    } else {
      document.getElementById("chatgptResult").textContent =
        "Please set your API key first.";
    }
  });
});
