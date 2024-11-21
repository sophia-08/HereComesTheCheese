chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === "signal_from_popup") {
      console.log("Received message:", request.action);
      sendResponse({ response: "Hello from background!" });
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

