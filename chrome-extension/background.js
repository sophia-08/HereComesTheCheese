// Constants
const hostName = "com.ergo.echo";
let port = null;

// Event Listeners
chrome.tabs.onUpdated.addListener((tabId, tab) => {
  // Tab update logic can be added here if needed
});

chrome.action.onClicked.addListener((tab) => {
  chrome.windows.getCurrent({ populate: true }, (window) => {
    chrome.sidePanel.open({ windowId: window.id });
  });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case "loginCredentials":
      handleLoginCredentials(message);
      break;
    case "sendNativeMessage":
      sendNativeMessage(message);
      break;
    case "queryActiveTabDOM":
      queryActiveTabDOM();
      break;
    case "sendChatGPTRequest":
      sendChatGPTRequest(
        message.systemPrompt,
        message.userPrompt,
        message.apiKey
      );
      break;
  }
});

// Message Handlers
function handleLoginCredentials(message) {
  const { username, password } = message;
  console.log("Received credentials from side panel:");
  console.log("Username:", username);
  console.log("Password:", password);
  // You can perform additional actions with the credentials here
  // For example, send them to a server or authenticate the user
}

function sendNativeMessage(message) {
  console.log("Send native, ", message);
  const messageToSend = message.payload;
  if (port) {
    port.postMessage(messageToSend);
  } else {
    console.error("Native messaging port is not connected");
  }
}

function queryActiveTabDOM() {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    if (tabs[0].url.startsWith("chrome://")) {
      chrome.runtime.sendMessage({
        type: "activeDOMQueryResults",
        results:
          "Unable to access chrome:// URLs. Please try on a different page.",
      });
    } else {
      chrome.scripting.executeScript(
        {
          target: { tabId: tabs[0].id },
          function: queryDOM,
        },
        (results) => {
          if (chrome.runtime.lastError) {
            console.error(chrome.runtime.lastError);
            chrome.runtime.sendMessage({
              type: "activeDOMQueryResults",
              results:
                "An error occurred while querying the DOM: " +
                chrome.runtime.lastError.message,
            });
            return;
          }
          chrome.runtime.sendMessage({
            type: "activeDOMQueryResults",
            results: results[0].result,
          });
        }
      );
    }
  });
}

async function sendChatGPTRequest(systemPrompt, userPrompt, apiKey) {
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 150,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const chatGPTResponse = data.choices[0].message.content;

    chrome.runtime.sendMessage({
      type: "chatGPTResponse",
      response: chatGPTResponse,
    });
  } catch (error) {
    console.error("Error sending request to ChatGPT:", error);
    chrome.runtime.sendMessage({
      type: "chatGPTResponse",
      response:
        "Error: Unable to get response from ChatGPT. Please check your API key and try again.",
    });
  }
}

// Helper Functions
function queryDOM() {
  const inputs = Array.from(document.querySelectorAll("input")).filter(
    (input) => input.type !== "hidden"
  );
  const buttons = document.querySelectorAll("button");

  let resultHTML = "<h3>Input Elements (excluding hidden):</h3><ul>";
  inputs.forEach((input, index) => {
    resultHTML += `<li>Input ${index + 1}: type="${input.type}", id="${
      input.id
    }", name="${input.name}"</li>`;
  });
  resultHTML += "</ul><h3>Button Elements:</h3><ul>";
  buttons.forEach((button, index) => {
    resultHTML += `<li>Button ${index + 1}: id="${button.id}", text="${
      button.textContent
    }"</li>`;
  });
  resultHTML += "</ul>";

  return resultHTML;
}

async function listHIDDevices() {
  try {
    const devices = await navigator.hid.requestDevice({ filters: [] });

    if (devices.length === 0) {
      console.log("No HID devices selected.");
      return;
    }

    console.log("Selected HID devices:");
    devices.forEach((device, index) => {
      console.log(`Device ${index + 1}:`);
      console.log(`  Product name: ${device.productName}`);
      console.log(`  Vendor ID: ${device.vendorId}`);
      console.log(`  Product ID: ${device.productId}`);
    });
  } catch (error) {
    console.error("Error accessing HID devices:", error);
  }
}

// Native Messaging Setup
function connectNativeHost() {
  port = chrome.runtime.connectNative(hostName);

  port.onMessage.addListener((response) => {
    console.log("Received response from native host:", response);
  });

  port.onDisconnect.addListener(() => {
    console.log("Native host has exited. Attempting to reconnect...");
    port = null;
    setTimeout(connectNativeHost, 1000); // Attempt to reconnect after 1 second
  });
}

// Initialize native messaging connection
connectNativeHost();
