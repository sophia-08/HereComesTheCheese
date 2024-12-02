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
    summarizeHandler();
  } else if (cmd == "click") {
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

            try {
              // send llmResult to sidepanel
              chrome.runtime.sendMessage({
                type: "llm_result",
                target: "side-panel",
                data: llmResult,
              }).then((response) => {
                console.log("Response received:", response);
              })
              .catch((error) => {
                console.error("Error:", error.message);
                // Notify user they need to open the panel
                  chrome.action.setBadgeText({ text: "Click" }); 
                  chrome.action.setBadgeBackgroundColor({ color: "#4CAF50" });
                  chrome.storage.local.set({
                    'pendingGptResult': llmResult
                  });
                // Handle the error (e.g., fallback logic or user notification)
              });
            } catch (error) {
              console.error("send llmResult to sidepanel: ", error); 
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
    console.error("summarizeHandler:", error);
  }
}
