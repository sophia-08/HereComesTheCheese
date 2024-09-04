// import { getActiveTabURL } from "./utils.js";

document.getElementById('checkHID').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: checkHIDAvailability,
  }, (results) => {
    if (chrome.runtime.lastError) {
      document.getElementById('result').textContent = `Error: ${chrome.runtime.lastError.message}`;
    } else if (results && results[0]) {
      document.getElementById('result').textContent = results[0].result;
    }
  });
});

function checkHIDAvailability() {
  console.log("checkHIDAvailability")
  if ('hid' in navigator) {
    return "WebHID API is available. You can use HID devices on this page.";
  } else {
    return "WebHID API is not available in this context.";
  }
}



document.getElementById('listDevices').addEventListener('click', listAuthorizedDevices);
document.getElementById('requestNewDevice').addEventListener('click', requestNewDevice);

async function listAuthorizedDevices() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: getAuthorizedHIDDevices,
  }, (results) => {
    if (chrome.runtime.lastError) {
      document.getElementById('deviceList').textContent = `Error: ${chrome.runtime.lastError.message}`;
    } else if (results && results[0]) {
      document.getElementById('deviceList').innerHTML = results[0].result;
    }
  });
}

async function requestNewDevice() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: requestHIDDevice,
  }, (results) => {
    if (chrome.runtime.lastError) {
      document.getElementById('deviceList').textContent = `Error: ${chrome.runtime.lastError.message}`;
    } else if (results && results[0]) {
      document.getElementById('deviceList').innerHTML = results[0].result;
    }
  });
}

function getAuthorizedHIDDevices() {
  return new Promise(async (resolve) => {
    try {
      const devices = await navigator.hid.getDevices();
      resolve(formatDeviceList(devices));
    } catch (error) {
      resolve(`Error accessing HID devices: ${error.message}`);
    }
  });

  function formatDeviceList(devices) {
    if (devices.length === 0) {
      return 'No HID devices available.';
    }

    let deviceListHTML = '<ul>';
    devices.forEach((device, index) => {
      deviceListHTML += `
        <li>
          Device ${index + 1}:<br>
          Product name: ${device.productName}<br>
          Vendor ID: ${device.vendorId}<br>
          Product ID: ${device.productId}
        </li>`;
    });
    deviceListHTML += '</ul>';

    return deviceListHTML;
  }
}

function requestHIDDevice() {
  return new Promise(async (resolve) => {
    try {
      const devices = await navigator.hid.requestDevice({ filters: [] });
      resolve(formatDeviceList(devices));
    } catch (error) {
      resolve(`Error requesting HID device: ${error.message}`);
    }
  });

  function formatDeviceList(devices) {
    if (devices.length === 0) {
      return 'No HID devices available.';
    }

    let deviceListHTML = '<ul>';
    devices.forEach((device, index) => {
      deviceListHTML += `
        <li>
          Device ${index + 1}:<br>
          Product name: ${device.productName}<br>
          Vendor ID: ${device.vendorId}<br>
          Product ID: ${device.productId}
        </li>`;
    });
    deviceListHTML += '</ul>';

    return deviceListHTML;
  }
}