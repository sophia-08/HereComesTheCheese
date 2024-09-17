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
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      function: queryDOM,
    }, (results) => {
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError);
        return;
      }
      chrome.runtime.sendMessage({
        type: 'queryResults',
        results: results[0].result
      });
    });
  });
}

// Helper Functions
function queryDOM() {
  const inputs = document.querySelectorAll('input');
  const buttons = document.querySelectorAll('button');
  
  let resultHTML = '<h3>Input Elements:</h3><ul>';
  inputs.forEach((input, index) => {
    resultHTML += `<li>Input ${index + 1}: type="${input.type}", id="${input.id}", name="${input.name}"</li>`;
  });
  resultHTML += '</ul><h3>Button Elements:</h3><ul>';
  buttons.forEach((button, index) => {
    resultHTML += `<li>Button ${index + 1}: id="${button.id}", text="${button.textContent}"</li>`;
  });
  resultHTML += '</ul>';
  
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