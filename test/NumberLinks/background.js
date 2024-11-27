
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("background message", message);
  switch (message.type) {
    case "LOG":
      const logStyle =
        "background: #a0a0a0; color: #000; padding: 2px 5px; border-radius: 3px;";
      console.log(`%c[content.js] ${message.data.message}`, logStyle);
      // console.log(message.data.message);
      break;
  }
});


// chrome.tabs.sendMessage(tabId, {
//     action: 'NAVIGATE_TO_LINK',
//     linkIndex: 5
// }, response => {
//     console.log('Navigation result:', response);
// });


// Background script (background.js)
// chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
//   console.log('onUpdated', tabId);
//   // Wait for the page to finish loading
//   if (changeInfo.status === 'complete') {
//       console.log('onUpdated completed');
//       // Set a timer to send message after 30 seconds
//       setTimeout(() => {
//           // Prepare the navigation message
//           const message = {
//               action: 'NAVIGATE_TO_LINK',
//               linkIndex: 10,
//               timestamp: Date.now(),
//               metadata: {
//                   source: 'background_timer',
//                   delaySeconds: 30
//               }
//           };

//           // Send message to content script
//           chrome.tabs.sendMessage(tabId, message, (response) => {
//               // Check if message was successfully processed
//               if (chrome.runtime.lastError) {
//                   console.error('Error sending message:', chrome.runtime.lastError);
//                   return;
//               }

//               // Log the response from content script
//               if (response) {
//                   if (response.success) {
//                       console.log('Navigation successful:', response.data);
//                   } else {
//                       console.warn('Navigation failed:', response.error);
//                   }
//               } else {
//                   console.warn('No response from content script');
//               }
//           });
//       }, 30000); // 30 seconds
//   }
// });

