// side_panel.js
document.getElementById("submitButton").addEventListener("click", () => {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  // Perform actions with the username and password values
  console.log("Username:", username);
  console.log("Password:", password);

  chrome.runtime.sendMessage({
    type: "loginCredentials",
    username: username,
    password: password,
  });
});

let i = 0;
document
  .getElementById("sendNativeMessageButton")
  .addEventListener("click", () => {
    chrome.runtime.sendMessage({
      type: "sendNativeMessage",
      payload: "hello " + i,
    });
    i = i + 1;
  });

document.getElementById("saveApiKey").addEventListener("click", () => {
  const apiKey = document.getElementById("apiKey").value;
  if (apiKey.length == 0) return;
  chrome.storage.local.set({ chatgptApiKey: apiKey }, () => {
    console.log("API Key saved");
    document.getElementById("apiKey").value = "";
  });
});

document.getElementById("analyzeDOMButton").addEventListener("click", () => {
  chrome.storage.local.get(["chatgptApiKey"], (result) => {
    if (result.chatgptApiKey) {
      chrome.runtime.sendMessage({
        type: "analyzeDOM",
        apiKey: result.chatgptApiKey,
      });
    } else {
      document.getElementById("chatgptResult").textContent =
        "Please set your API key first.";
    }
  });
});

// New function to handle form filling and submission
document.getElementById("fillAndSubmitButton").addEventListener("click", () => {
  const chatgptResultElement = document.getElementById("chatgptResult");
  console.log("fillAndSubmitButton", chatgptResultElement);
  let chatgptResult = chatgptResultElement.textContent.trim();
  console.log("fillAndSubmitButton", chatgptResult);
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
    console.log("fillAndSubmitButton1", chatgptResult);
    const formData = JSON.parse(chatgptResult);
    console.log("formData", formData);
    if (formData.username && formData.submit) {
      chrome.runtime.sendMessage({
        type: "fillAndSubmitForm",
        formData: formData,
      });
      console.log("Form fill and submit request sent");
    } else {
      console.log("Invalid form data or not a login page");
      // chatgptResultElement.textContent = "Invalid form data or not a login page";
    }
  } catch (error) {
    console.error("Error parsing ChatGPT result:", error);
    // chatgptResultElement.textContent = "Error parsing ChatGPT result: " + error.message;
  }
});

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "domStructure") {
    const domStructureDiv = document.getElementById("domStructure");
    domStructureDiv.innerHTML = message.domStructure;
  } else if (message.type === "chatGPTResponse") {
    const resultDiv = document.getElementById("chatgptResult");
    resultDiv.textContent = message.response;
  } else if (message.type == 'hid_cmd') {
    const cmd = message.action;
    if (cmd == 'summarize' ) {
      handleSummarizeClick();
    }
  }
});

// document.getElementById("sendChatGPTButton").addEventListener("click", () => {
//   const systemPrompt =
//     "This is a input and button element from a webpage, is it a login page? If yes, return the element id for the username, password and submit/next button. output is in json format, and include and only include three keys: username, password, submit; \
//    If it is not a login page, return a empty json object.";
//   const userPrompt =
//     '\
// Input Elements (excluding hidden):\
// Input 1: type="text", id="login-username", name="username"\
// Input 2: type="password", id="", name="passwd"\
// Input 3: type="submit", id="login-signin", name="signin"\
// Input 4: type="checkbox", id="persistent", name="persistent"\
// Input 5: type="checkbox", id="mbr-legacy-device-bar-cross", name=""\
// Button Elements:\
// Button 1: id="tpa-google-button", text=" Sign in with Google "';

//   chrome.storage.local.get(["chatgptApiKey"], (result) => {
//     if (result.chatgptApiKey) {
//       chrome.runtime.sendMessage({
//         type: "sendChatGPTRequest",
//         systemPrompt: systemPrompt,
//         userPrompt: userPrompt,
//         apiKey: result.chatgptApiKey,
//       });
//     } else {
//       document.getElementById("chatgptResult").textContent =
//         "Please set your API key first.";
//     }
//   });
// });

async function handleSummarizeClick() {
  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    if (!tab) {
      throw new Error("No active tab found");
    }

    // Inject the content script into the active tab
    // await chrome.scripting.executeScript({
    //   target: { tabId: tab.id },
    //   files: ['contentScript.js']  
    // });    

    const response = await chrome.tabs.sendMessage(tab.id, {
      action: "getDOMContent",
    });

    console.log("getDOMContent response=", response);
    if (response && response.content) {
      // document.getElementById("summary").textContent = response.content.textContent;

      systemPrompt = "Please summarize, and identify up to 5 sections that are assert fact and most related. Please reply with a json object containing a \"summary\" and \"facts\" key.  The value of \"summary\" is a short summary of the text. The value of \"facts\" is an array value of exact string matches to the original text. The facts must be exact matches of the sentence fragments from the original text. This \"facts\" will later be used by a chrome extension to mark spans of the original text, so the fact strings must be exact matches of the original text. The response shall only has the JSON object, nothing else."
      chrome.storage.local.get(["chatgptApiKey"], (result) => {
        if (result.chatgptApiKey) {
          chrome.runtime.sendMessage({
            type: "summarize",
            apiKey: result.chatgptApiKey,
            userPrompt: response.content.textContent,
            systemPrompt: systemPrompt
          }).then(result1 => {
            console.log("chatgptResult: ", result1.data);
            // document.getElementById("chatgptResult").textContent = result1.data;
            try {
              renderGptResult(JSON.parse(result1.data)) ;
            }catch (error) {
              console.error("Error: chatgptResult:", error);
            }
            
          }).catch(error => {
            // Handle any errors here
            console.error('Error:', error);
          });
        } else {
          document.getElementById("chatgptResult").textContent =
            "Please set your API key first.";
        }
      });

    } else {
      throw new Error("Failed to get DOM content");
    }
  } catch (error) {
    console.error("Error:", error);
    document.getElementById("summary").textContent = "Error: " + error.message;
  }
};

document.getElementById("summarize").addEventListener("click", handleSummarizeClick);

const data1 = {
  summary: "Kamala Harris expressed confidence that the US is ready for a female president, emphasizing that Americans prioritize candidates' capabilities over gender. During an NBC News interview, she highlighted the importance of unity and addressing the concerns of the American people, while also discussing the potential challenges posed by Donald Trump's actions regarding the election results. Harris asserted her focus on campaigning and her commitment to bringing her own policies to address issues like the economy and abortion rights.",
  facts: [
      "Kamala Harris said that she has no doubt that the US was ready for a female president, insisting that Americans care more about what candidates can do to help them, rather than presidential contenders' gender.",
      "Harris was asked why she hasn't leaned into the historic nature of her candidacy – that she is a woman of color running for the presidency.",
      "The point that most people really care about is: can you do the job, and do you have a plan to actually focus on them?",
      "This is a person, Donald Trump, who tried to undo the free and fair election, who still denies the will of the people who incited a violent mob to attack the United States Capitol, and 140 law enforcement officers were attacked, some who were killed.",
      "I don't think we should be making concessions when we're talking about a fundamental freedom to make decisions about your own body."
  ]
};

function renderGptResult(data) {

  const content = document.getElementById('chatgptResult');
  
  // Clear previous content
  content.innerHTML = '';

  // Create summary card
  const summaryCard = document.createElement('div');
  summaryCard.className = 'card';
  summaryCard.innerHTML = `
      <h2 class="card-title">Summary</h2>
      <p class="summary">${data.summary}</p>
  `;
  
  // Create key points card
  const factsCard = document.createElement('div');
  factsCard.className = 'card';
  factsCard.innerHTML = `
      <h2 class="card-title">Key Points</h2>
      ${data.facts.map(fact => `
          <div class="fact-item">
              <span class="quote-icon">❝</span>
              <p>${fact}</p>
          </div>
      `).join('')}
  `;
  
  // Append both cards
  content.appendChild(summaryCard);
  content.appendChild(factsCard);
}

// Initialize the page
// renderGptResult(data1);