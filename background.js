chrome.tabs.onUpdated.addListener((tabId, tab) => {

});

chrome.action.onClicked.addListener((tab) => {
  // chrome.scripting.executeScript({
  //   target: { tabId: tab.id },
  //   function: listHIDDevices
  // });
  chrome.tabs.create({ url: 'popup.html' });
});

async function listHIDDevices() {
  try {
    // Request access to HID devices
    const devices = await navigator.hid.requestDevice({ filters: [] });
    
    if (devices.length === 0) {
      console.log('No HID devices selected.');
      return;
    }

    console.log('Selected HID devices:');
    devices.forEach((device, index) => {
      console.log(`Device ${index + 1}:`);
      console.log(`  Product name: ${device.productName}`);
      console.log(`  Vendor ID: ${device.vendorId}`);
      console.log(`  Product ID: ${device.productId}`);
    });
  } catch (error) {
    console.error('Error accessing HID devices:', error);
  }
}