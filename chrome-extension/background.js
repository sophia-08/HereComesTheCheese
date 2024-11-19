// Constants
const hostName = "com.ergo.echo";
let port = null;


// This implementation of "click":

// Stores the last known visible links in memory
// Uses Levenshtein distance for fuzzy string matching
// Ignores common words and very short words
// Requires more than 40% of keywords to match for navigation
// Provides detailed logging of the matching process
// Handles partial matches and similar words
// Navigates the current tab to the matched URL

// The matching algorithm:
// Breaks down input and link text into keywords
// Ignores common words and punctuation
// Calculates similarity scores between words
// Considers a word matched if similarity is > 70%
// Requires overall match score > 50% for navigation
// Handles variations in word order



// Store the last known visible links
let lastVisibleLinks = [];

// Common words to ignore in matching
const COMMON_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'up', 'about', 'into', 'over', 'after'
]);

// Function to calculate Levenshtein distance for fuzzy matching
function levenshteinDistance(str1, str2) {
  const m = str1.length;
  const n = str2.length;
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = Math.min(
          dp[i - 1][j - 1] + 1,
          dp[i - 1][j] + 1,
          dp[i][j - 1] + 1
        );
      }
    }
  }
  return dp[m][n];
}

// Function to get meaningful words from a string
function getKeywords(text) {
  return text.toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .split(/\s+/)
    .filter(word =>
      word.length > 2 && // Ignore very short words
      !COMMON_WORDS.has(word) // Ignore common words
    );
}

// Function to calculate match score between input and link text
function calculateMatchScore(inputKeywords, linkKeywords) {
  let matchedWords = 0;
  let matchDetails = [];

  for (const inputWord of inputKeywords) {
    let bestMatch = {
      word: null,
      distance: Infinity
    };

    for (const linkWord of linkKeywords) {
      const distance = levenshteinDistance(inputWord, linkWord);
      const maxLength = Math.max(inputWord.length, linkWord.length);
      const similarity = 1 - (distance / maxLength);

      if (similarity > 0.7 && distance < bestMatch.distance) { // 70% similarity threshold
        bestMatch = {
          word: linkWord,
          distance: distance,
          similarity: similarity
        };
      }
    }

    if (bestMatch.word) {
      matchedWords++;
      matchDetails.push(`'${inputWord}' matched with '${bestMatch.word}' (${(bestMatch.similarity * 100).toFixed(1)}% similar)`);
    } else {
      matchDetails.push(`'${inputWord}' had no good matches`);
    }
  }

  return {
    score: matchedWords / inputKeywords.length,
    details: matchDetails
  };
}

// Function to find best matching link
function findBestMatch(userInput) {
  console.log('Processing voice input:', userInput);

  const inputKeywords = getKeywords(userInput);
  console.log('Extracted keywords from input:', inputKeywords);

  if (inputKeywords.length === 0) {
    console.log('No valid keywords found in input');
    return null;
  }

  let bestMatch = {
    link: null,
    score: 0,
    details: []
  };

  for (const link of lastVisibleLinks) {
    const linkKeywords = getKeywords(link.text);
    console.log(`\nAnalyzing link: "${link.text}"\nKeywords:`, linkKeywords);

    const match = calculateMatchScore(inputKeywords, linkKeywords);
    console.log('Match score:', match.score);
    console.log('Match details:', match.details);

    if (match.score > bestMatch.score) {
      bestMatch = {
        link: link,
        score: match.score,
        details: match.details
      };
    }
  }

  console.log('\nBest match results:');
  if (bestMatch.link) {
    console.log('Text:', bestMatch.link.text);
    console.log('URL:', bestMatch.link.url);
    console.log('Score:', bestMatch.score);
    console.log('Match details:', bestMatch.details);
  } else {
    console.log('No matching link found');
  }

  // Return the match only if more than 40% of keywords matched
  return bestMatch.score > 0.4 ? bestMatch.link : null;
}


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

// Helper Functions for Credential Management
function saveCredentialsNative(username, password) {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    const currentUrl = tabs[0].url;
    const domain = extractDomain(currentUrl);

    const credentialsObject = {
      type: "saveCredentials",
      username: username,
      password: password,
      domain: domain,
    };
    sendNativeMessage({ payload: credentialsObject });
  });
}

function retrieveCredentialsNative() {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    const currentUrl = tabs[0].url;
    const domain = extractDomain(currentUrl);

    const retrieveRequest = {
      type: "retrieveCredentials",
      domain: domain,
    };
    sendNativeMessage({ payload: retrieveRequest });
  });
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

// Message Handlers
function handleLoginCredentials(message) {
  const { username, password } = message;
  console.log("Received credentials from side panel:");
  console.log("Username:", username);
  console.log("Password:", password);

  // Save credentials using the helper function
  saveCredentialsNative(username, password);
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

function fillAndSubmitForm(formData) {
  console.log("fillAndSubmitForm", formData);
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    chrome.scripting.executeScript(
      {
        target: { tabId: tabs[0].id },
        function: fillForm,
        args: [formData],
      },
      () => {
        if (chrome.runtime.lastError) {
          console.error(chrome.runtime.lastError);
          return;
        }
        console.log("Form filled and submitted");
      }
    );
  });
}

function fillForm(formData) {
  // const formData = JSON.parse(formData_str);
  // console.log("formData", formData)
  if (formData.username) {
    const usernameField = document.getElementById(formData.username);
    if (usernameField) {
      usernameField.value = "testsii.woods";
      console.log("Username field filled with 'test'");
    } else {
      console.log("Username field not found");
    }
  }

  if (formData.submit) {
    const submitButton = document.getElementById(formData.submit);
    if (submitButton) {
      submitButton.click();
      console.log("Submit button clicked");
    } else {
      console.log("Submit button not found");
    }
  }
}

async function sendChatGPTRequest(systemPrompt, userPrompt, apiKey) {
  try {
    console.log("sendChatGPTRequest", systemPrompt, userPrompt);
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

    //

    console.log("chatgpt resp: ", chatGPTResponse);

    let chatgptResult = chatGPTResponse;
    try {
      if (chatgptResult.startsWith("```json")) {
        chatgptResult = chatgptResult
          .substring(7, chatgptResult.length - 3)
          .trim();
      } else if (
        chatgptResult.startsWith("```") &&
        chatgptResult.endsWith("```")
      ) {
        chatgptResult = chatgptResult
          .substring(3, chatgptResult.length - 3)
          .trim();
      }
      console.log("sendChatGPTRequest fill form with", chatgptResult);
      const formData = JSON.parse(chatgptResult);
      console.log("formData", formData);
      if (formData.username && formData.submit) {
        fillAndSubmitForm(formData);
        console.log("Form fill and submit request sent");
      } else {
        console.log("Invalid form data or not a login page");
        // chatgptResultElement.textContent = "Invalid form data or not a login page";
      }
    } catch (error) {
      console.error("Error parsing ChatGPT result:", error);
      // chatgptResultElement.textContent = "Error parsing ChatGPT result: " + error.message;
    }
    //

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
    resultHTML += `<li>Input ${index + 1}: type="${input.type}", id="${input.id
      }", name="${input.name}"</li>`;
  });
  resultHTML += "</ul><h3>Button Elements:</h3><ul>";
  buttons.forEach((button, index) => {
    resultHTML += `<li>Button ${index + 1}: id="${button.id}", text="${button.textContent
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
function handleRetrievedCredentials(username, password) {
  // Check if username and password are valid (non-empty strings)
  console.log("handleRetrievedCredentials", username, password);
  if (
    typeof username === "string" &&
    username.trim() !== "" &&
    typeof password === "string" &&
    password.trim() !== ""
  ) {
    // Credentials are valid, proceed with filling the login form
    // chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    //   chrome.tabs.sendMessage(tabs[0].id, {
    //     type: "fillLoginForm",
    //     username: username,
    //     password: password
    //   });
    // });
  } else {
    // Log an error if credentials are invalid
    console.error(
      "Retrieved credentials are invalid. Username or password is empty or not a string."
    );

    // Optionally, you can send a message to the user interface to inform the user
    // chrome.runtime.sendMessage({
    //   type: "credentialError",
    //   message: "Unable to retrieve valid credentials. Please check your saved information."
    // });
  }
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
    // send cmd to sidepanel
    chrome.runtime.sendMessage({
      type: "hid_cmd",
      target: "side-panel",
      action: cmd,
    });
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
