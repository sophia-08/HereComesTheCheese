chrome.tabs.onUpdated.addListener((tabId, tab) => {});

// chrome.action.onClicked.addListener((tab) => {
//   // chrome.scripting.executeScript({
//   //   target: { tabId: tab.id },
//   //   function: listHIDDevices
//   // });
//   chrome.tabs.create({ url: 'popup.html' });
// });

chrome.action.onClicked.addListener((tab) => {
  chrome.windows.getCurrent({ populate: true }, (window) => {
    chrome.sidePanel.open({ windowId: window.id });
  });
});

// background.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "loginCredentials") {
    const { username, password } = message;
    console.log("Received credentials from side panel:");
    console.log("Username:", username);
    console.log("Password:", password);

    // You can perform additional actions with the credentials here
    // For example, send them to a server or authenticate the user
  }
});

// background.js or content_script.js
// const hostName = 'com.google.chrome.example.echo';
const hostName = "com.ergo.echo";
// background.js or content_script.js

let port = null;

// function connectNativeHost(hostName) {
  port = chrome.runtime.connectNative(hostName);

  port.onMessage.addListener((response) => {
    console.log("Received response from native host:", response);
  });

  port.onDisconnect.addListener(() => {
    console.log("Native host has exited. Attempting to reconnect...");
    port = null;
    // connectNativeHost(hostName);
  });
// }

// connectNativeHost(hostName);


chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "sendNativeMessage") {
    console.log("Send native, ", message);
    const messageToSend = message.payload;
    port.postMessage(messageToSend);
  }
});

async function listHIDDevices() {
  try {
    // Request access to HID devices
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
