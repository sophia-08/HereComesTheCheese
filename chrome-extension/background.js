importScripts("cmd_click.js")
importScripts("cmd_credential.js")

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

// Helper function to extract domain from URL
function extractDomain(url) {
  let domain;
  try {
    domain = new URL(url).hostname;
  } catch (error) {
    console.error("Invalid URL:", url);
    domain = "";
  }
  return domain;
}



chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("background message", message);
  switch (message.type) {
    case "loginCredentials":
      handleLoginCredentials(message);
      break;
    case "sendNativeMessage":
      sendNativeMessage(message);
      break;
    case "retrieveCredentials":
      retrieveCredentialsNative();
      break;
    // case "analyzeDOM":
    //   analyzeDOMWithChatGPT(message.apiKey);
    //   break;
    case "fillAndSubmitForm":
      fillAndSubmitForm(message.formData);
      break;
    case "wordUnderCursor":
      console.log("wordUnderCursor:", message.word);
      break;
    case "summarize":
      // Return true to indicate we'll send a response asynchronously
      (async () => {
        try {
          const result = await askLLM(
            message.systemPrompt,
            message.userPrompt,
            message.apiKey
          );
          console.log("chrome.runtime.onMessage sendResponse", result);
          sendResponse({ success: true, data: result });
        } catch (error) {
          console.error("Error in summarize:", error);
          sendResponse({ success: false, error: error.message });
        }
      })();
      return true;
      break;
    case "LOG":
      const logStyle =
        "background: #a0a0a0; color: #000; padding: 2px 5px; border-radius: 3px;";
      console.log(`%c[content.js] ${message.data.message}`, logStyle);
      // console.log(message.data.message);
      break;
    case "linksUpdate": {
      lastVisibleLinks = message.links;
      console.log('Updated visible links:', lastVisibleLinks);
      break;
    }
  }
});


function sendNativeMessage(message) {
  console.log("Send native, ", message);
  const messageToSend = message.payload;
  if (port) {
    port.postMessage(messageToSend);
  } else {
    console.error("Native messaging port is not connected");
  }
}

// function analyzeDOMWithChatGPT(apiKey) {
//   chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
//     if (tabs[0].url.startsWith("chrome://")) {
//       chrome.runtime.sendMessage({
//         type: "chatGPTResponse",
//         response:
//           "Unable to access chrome:// URLs. Please try on a different page.",
//       });
//     } else {
//       chrome.scripting.executeScript(
//         {
//           target: { tabId: tabs[0].id },
//           function: queryDOM,
//         },
//         (results) => {
//           if (chrome.runtime.lastError) {
//             console.error(chrome.runtime.lastError);
//             chrome.runtime.sendMessage({
//               type: "chatGPTResponse",
//               response:
//                 "An error occurred while querying the DOM: " +
//                 chrome.runtime.lastError.message,
//             });
//             return;
//           }
//           console.log("DOM:", results);
//           const domStructure = results[0].result;
//           chrome.runtime.sendMessage({
//             type: "domStructure",
//             domStructure: domStructure,
//           });
//           const systemPrompt =
//             "This is a input and button element from a webpage, is it a login page? \
//             If yes, return the element id for the username, password and submit/next button. \
//             output must be json object, has and only has three keys: username, password, submit; \
//             If it is not a login page, return a empty json object.";
//           sendChatGPTRequest(systemPrompt, domStructure, apiKey);
//         }
//       );
//     }
//   });
// }

// async function sendChatGPTRequest(systemPrompt, userPrompt, apiKey) {
//   try {
//     console.log("sendChatGPTRequest", systemPrompt, userPrompt);
//     const response = await fetch("https://api.openai.com/v1/chat/completions", {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//         Authorization: `Bearer ${apiKey}`,
//       },
//       body: JSON.stringify({
//         model: "gpt-3.5-turbo",
//         messages: [
//           { role: "system", content: systemPrompt },
//           { role: "user", content: userPrompt },
//         ],
//         temperature: 0.7,
//         max_tokens: 150,
//       }),
//     });

//     if (!response.ok) {
//       throw new Error(`HTTP error! status: ${response.status}`);
//     }

//     const data = await response.json();
//     const chatGPTResponse = data.choices[0].message.content;

//     //

//     console.log("chatgpt resp: ", chatGPTResponse);

//     let chatgptResult = chatGPTResponse;
//     try {
//       if (chatgptResult.startsWith("```json")) {
//         chatgptResult = chatgptResult
//           .substring(7, chatgptResult.length - 3)
//           .trim();
//       } else if (
//         chatgptResult.startsWith("```") &&
//         chatgptResult.endsWith("```")
//       ) {
//         chatgptResult = chatgptResult
//           .substring(3, chatgptResult.length - 3)
//           .trim();
//       }
//       console.log("sendChatGPTRequest fill form with", chatgptResult);
//       const formData = JSON.parse(chatgptResult);
//       console.log("formData", formData);
//       if (formData.username && formData.submit) {
//         fillAndSubmitForm(formData);
//         console.log("Form fill and submit request sent");
//       } else {
//         console.log("Invalid form data or not a login page");
//         // chatgptResultElement.textContent = "Invalid form data or not a login page";
//       }
//     } catch (error) {
//       console.error("Error parsing ChatGPT result:", error);
//       // chatgptResultElement.textContent = "Error parsing ChatGPT result: " + error.message;
//     }
//     //

//     chrome.runtime.sendMessage({
//       type: "chatGPTResponse",
//       response: chatGPTResponse,
//     });
//   } catch (error) {
//     console.error("Error sending request to ChatGPT:", error);
//     chrome.runtime.sendMessage({
//       type: "chatGPTResponse",
//       response:
//         "Error: Unable to get response from ChatGPT. Please check your API key and try again.",
//     });
//   }
// }


// Helper Functions

// function queryDOM() {
//   const inputs = Array.from(document.querySelectorAll("input")).filter(
//     (input) => input.type !== "hidden"
//   );
//   const buttons = document.querySelectorAll("button");

//   let resultHTML = "<h3>Input Elements (excluding hidden):</h3><ul>";
//   inputs.forEach((input, index) => {
//     resultHTML += `<li>Input ${index + 1}: type="${input.type}", id="${input.id
//       }", name="${input.name}"</li>`;
//   });
//   resultHTML += "</ul><h3>Button Elements:</h3><ul>";
//   buttons.forEach((button, index) => {
//     resultHTML += `<li>Button ${index + 1}: id="${button.id}", text="${button.textContent
//       }"</li>`;
//   });
//   resultHTML += "</ul>";

//   return resultHTML;
// }

// async function listHIDDevices() {
//   try {
//     const devices = await navigator.hid.requestDevice({ filters: [] });

//     if (devices.length === 0) {
//       console.log("No HID devices selected.");
//       return;
//     }

//     console.log("Selected HID devices:");
//     devices.forEach((device, index) => {
//       console.log(`Device ${index + 1}:`);
//       console.log(`  Product name: ${device.productName}`);
//       console.log(`  Vendor ID: ${device.vendorId}`);
//       console.log(`  Product ID: ${device.productId}`);
//     });
//   } catch (error) {
//     console.error("Error accessing HID devices:", error);
//   }
// }

// Native Messaging Setup

function connectNativeHost() {
  port = chrome.runtime.connectNative(hostName);

  port.onMessage.addListener((response) => {
    console.log("Received response from native host:", response);

    if (response.type === "credentialsRetrieved") {
      // Handle the retrieved credentials
      handleRetrievedCredentials(response.username, response.password);
    } else if (response.type === "hid_cmd") {
      // Handle the retrieved credentials
      handleHidCmd(response.cmd_id, response.parameter);
    }
  });

  port.onDisconnect.addListener(() => {
    console.log("Native host has exited. Attempting to reconnect...");
    port = null;
    setTimeout(connectNativeHost, 1000); // Attempt to reconnect after 1 second
  });
}


function handleHidCmd(cmd, parameter) {
  // Check if username and password are valid (non-empty strings)
  console.log("handleHidCmd", cmd);
  if (cmd == "definition") {
    // send cmd to active tab
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {
        type: "hid_cmd",
        target: "content-script",
        action: cmd,
      });
    });
  } else if (cmd == "summarize") {

      // chrome.windows.getCurrent({ populate: true }, (window) => {
      //   chrome.sidePanel.open({ windowId: window.id });
      // });
    // // send cmd to sidepanel
    // chrome.runtime.sendMessage({
    //   type: "hid_cmd",
    //   target: "side-panel",
    //   action: cmd,
    // });
    summarizeHandler();
  } else if (cmd == "click") {
    // send cmd to sidepanel
    // chrome.runtime.sendMessage({
    //   type: "hid_cmd",
    //   target: 'side-panel',
    //   action: cmd,
    //   parameter: parameter
    // });

    // chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    //   chrome.tabs.sendMessage(tabs[0].id, {
    //     type: "hid_cmd",
    //     target: "content-script",
    //     action: cmd,
    //     parameter: parameter,
    //   });
    // });

    console.log('Received voice input:', parameter);

    const matchedLink = findBestMatch(parameter);

    if (matchedLink) {
      console.log('Navigating to:', matchedLink.url);
      // Navigate the current tab to the matched URL
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        if (tabs[0]) {
          chrome.tabs.update(tabs[0].id, { url: matchedLink.url });
        }
      });
    } else {
      console.log('No sufficient match found for navigation');
    }

  }
}

// Initialize native messaging connection
connectNativeHost();

// const urlLLM = "http://localhost:8080/v1/chat/completions";
const urlLLM = "https://api.openai.com/v1/chat/completions";
async function askLLM(systemPrompt, userPrompt, apiKey) {
  try {
    console.log("askLLM:", systemPrompt, userPrompt, apiKey);

    const response = await fetch(urlLLM, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini", //"gpt-3.5-turbo",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.0,
        max_tokens: 2000,
        n: 1,
        stop: null,
      }),
    });

    console.log("chatgpt raw resp: ", response);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const chatGPTResponse = data.choices[0].message.content;
    console.log("chatgpt resp: ", chatGPTResponse);
    return chatGPTResponse;
  } catch (error) {
    console.error("Error sending request to ChatGPT:", error);
    chrome.runtime.sendMessage({
      type: "chatGPTResponse",
      response:
        "Error: Unable to get response from ChatGPT. Please check your API key and try again.",
    });
  }
}

async function summarizeHandler() {
  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    if (!tab) {
      throw new Error("No active tab found");
    }

    const response = await chrome.tabs.sendMessage(tab.id, {
      action: "getDOMContent",
    });

    console.log("getDOMContent response=", response);
    
    if (response && response.content) {
      const systemPrompt = "Please summarize, and identify up to 5 sections that are assert fact and most related. Please reply with a json object containing a \"summary\" and \"facts\" key.  The value of \"summary\" is a short summary of the text. The value of \"facts\" is an array value of exact string matches to the original text. The facts must be exact matches of the sentence fragments from the original text. This \"facts\" will later be used by a chrome extension to mark spans of the original text, so the fact strings must be exact matches of the original text. The response shall only has the JSON object, nothing else."
      
      chrome.storage.local.get(["chatgptApiKey"], async (result) => {
        console.log("Get chatgpt key", result);
        if (result.chatgptApiKey) {
          try {
            // Directly call askLLM instead of sending a message
            const llmResult = await askLLM(
              systemPrompt,
              response.content.textContent,
              result.chatgptApiKey
            );
            
            console.log("chatgptResult: ", llmResult);
            
            try {
              const parsedResult = JSON.parse(llmResult);
              //highlight facts
              chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                if (tabs[0]) {
                  chrome.tabs.sendMessage(tabs[0].id, {
                    target: 'content-script',
                    action: "highlight_facts",
                    facts: parsedResult.facts
                  });
                }
              });
            } catch (error) {
              console.error("Error parsing chatgptResult:", error);
            }
          } catch (error) {
            console.error('Error calling LLM:', error);
          }
        } else {
          console.error("No API key found");
        }
      });
    } else {
      throw new Error("Failed to get DOM content");
    }
  } catch (error) {
    console.error("Error:", error);
  }
}
