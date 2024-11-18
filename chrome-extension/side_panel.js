// side_panel.js

const logStyle =
"background: #0000a0; color: #000; padding: 2px 5px; border-radius: 3px;";


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
// document
//   .getElementById("sendNativeMessageButton")
//   .addEventListener("click", () => {
//     // chrome.runtime.sendMessage({
//     //   type: "sendNativeMessage",
//     //   payload: "hello " + i,
//     // });
//     // i = i + 1;

//     // chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
//     //   if (tabs[0]) {
//     //     chrome.tabs.sendMessage(tabs[0].id, {
//     //       target: 'content-script',
//     //       action: "grab_title",
//     //       // facts:JSON.parse(result1.data).facts
//     //     });
//     //   }
//     // });

//     console.log('Button clicked');

//     chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
//       const currentTab = tabs[0];
//       console.log('Current tab:', currentTab);

//       // chrome.scripting.executeScript({
//       //   target: { tabId: currentTab.id },
//       //   function: grabHeadlines
//       // }, (results) => {
//       //   console.log('Script execution completed', results);
//       //   // if (results && results[0]) {
//       //   //     displayResults(results);
//       //   // }
//       // });

//       chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
//         chrome.scripting.executeScript({
//             target: {tabId: tabs[0].id},
//             function: grabHeadlines
//         }, (results) => {
//             if (results && results[0] && results[0].result) {
//                 const headlines = results[0].result;
//                 openArticle(headlines, "biden");
//             }
//         });
//     });
//     });


//     // console.log(filterHeadlines(headlines, "biden apology to school native"));

//   });

document.getElementById("saveApiKey").addEventListener("click", () => {
  const apiKey = document.getElementById("apiKey").value;
  if (apiKey.length == 0) return;
  chrome.storage.local.set({ chatgptApiKey: apiKey }, () => {
    console.log("API Key saved");
    document.getElementById("apiKey").value = "";
  });
});

// document.getElementById("analyzeDOMButton").addEventListener("click", () => {
//   chrome.storage.local.get(["chatgptApiKey"], (result) => {
//     if (result.chatgptApiKey) {
//       chrome.runtime.sendMessage({
//         type: "analyzeDOM",
//         apiKey: result.chatgptApiKey,
//       });
//     } else {
//       document.getElementById("chatgptResult").textContent =
//         "Please set your API key first.";
//     }
//   });
// });


// New function to handle form filling and submission
// document.getElementById("fillAndSubmitButton").addEventListener("click", () => {
//   const chatgptResultElement = document.getElementById("chatgptResult");
//   console.log("fillAndSubmitButton", chatgptResultElement);
//   let chatgptResult = chatgptResultElement.textContent.trim();
//   console.log("fillAndSubmitButton", chatgptResult);
//   try {
//     if (chatgptResult.startsWith("```json")) {
//       chatgptResult = chatgptResult
//         .substring(7, chatgptResult.length - 3)
//         .trim();
//     } else if (
//       chatgptResult.startsWith("```") &&
//       chatgptResult.endsWith("```")
//     ) {
//       chatgptResult = chatgptResult
//         .substring(3, chatgptResult.length - 3)
//         .trim();
//     }
//     console.log("fillAndSubmitButton1", chatgptResult);
//     const formData = JSON.parse(chatgptResult);
//     console.log("formData", formData);
//     if (formData.username && formData.submit) {
//       chrome.runtime.sendMessage({
//         type: "fillAndSubmitForm",
//         formData: formData,
//       });
//       console.log("Form fill and submit request sent");
//     } else {
//       console.log("Invalid form data or not a login page");
//       // chatgptResultElement.textContent = "Invalid form data or not a login page";
//     }
//   } catch (error) {
//     console.error("Error parsing ChatGPT result:", error);
//     // chatgptResultElement.textContent = "Error parsing ChatGPT result: " + error.message;
//   }
// });

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
    if (cmd == 'summarize') {
      handleSummarizeClick();
    } else if (cmd == 'click') {
    let clickTerms = message.parameter;  
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      const currentTab = tabs[0];
      console.log('Current tab:', currentTab);

      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.scripting.executeScript({
            target: {tabId: tabs[0].id},
            function: grabHeadlines
        }, (results) => {
            if (results && results[0] && results[0].result) {
                const headlines = results[0].result;
                console.log("clickTerms: ", clickTerms);
                openArticle(headlines, clickTerms);
            }
        });
    });
    });


    // console.log(filterHeadlines(headlines, "biden apology to school native"));

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

    // console.log("getDOMContent response=", response);
    console.log(`%c[side.js] getDOMContent response=${response}`, logStyle);
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
              renderGptResult(JSON.parse(result1.data));

              //highlight facts
              chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                if (tabs[0]) {
                  chrome.tabs.sendMessage(tabs[0].id, {
                    target: 'content-script',
                    action: "highlight_facts",
                    facts: JSON.parse(result1.data).facts
                  });
                }
              });


            } catch (error) {
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

// document.getElementById("summarize").addEventListener("click", handleSummarizeClick);

// const data1 = {
//   summary: "Kamala Harris expressed confidence that the US is ready for a female president, emphasizing that Americans prioritize candidates' capabilities over gender. During an NBC News interview, she highlighted the importance of unity and addressing the concerns of the American people, while also discussing the potential challenges posed by Donald Trump's actions regarding the election results. Harris asserted her focus on campaigning and her commitment to bringing her own policies to address issues like the economy and abortion rights.",
//   facts: [
//     "Kamala Harris said that she has no doubt that the US was ready for a female president, insisting that Americans care more about what candidates can do to help them, rather than presidential contenders' gender.",
//     "Harris was asked why she hasn't leaned into the historic nature of her candidacy – that she is a woman of color running for the presidency.",
//     "The point that most people really care about is: can you do the job, and do you have a plan to actually focus on them?",
//     "This is a person, Donald Trump, who tried to undo the free and fair election, who still denies the will of the people who incited a violent mob to attack the United States Capitol, and 140 law enforcement officers were attacked, some who were killed.",
//     "I don't think we should be making concessions when we're talking about a fundamental freedom to make decisions about your own body."
//   ]
// };

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


// const headlines = 
// [
//     {
//         "title": "'Washington Post' won't endorse in White House race for first time since 1980s",
//         "url": "https://news.google.com/read/CBMinwFBVV95cUxOR18xOVM0aURySk04Z2gtSWhVN1F3MmxzdExIWVZTRDhwVWJUc3ZHNDdqRlNEUEZtNGhkTTQ5WklsUjFab1NFYzI0LUZMMm9Cc3MwM05Na0pQX3FCaWhldmJjVGdxVnRXSHBFQkh3Mlo0Njh1MXJlcnEyZnROR3dldTNjTm9DQ3FwVUVKOVc5VzlvclpNMi1Gc09lVWE3dWs?hl=en-US&gl=US&ceid=US%3Aen"
//     },
//     {
//         "title": "The Washington Post says it will not endorse a candidate for president",
//         "url": "https://news.google.com/read/CBMilwFBVV95cUxOamxhaEFORVBTa3BtOTdHZ1FKbUwxWFlEZ3pyRllWQzBDdU1mYl9rTmhlR0tXYnVCT29pMEtCTUFCdmdyQW5jOVBPVU1SZlNkd0xIMC1sUWtDVkgtSmZ3d0xuRFBaSlVCNDNjVFlaemZuSTBnOHZOa1dTZnE1Vk1nLXVTai1ZZ1VvSjJDR1BDV2J6QkF0MkxN?hl=en-US&gl=US&ceid=US%3Aen"
//     },
//     {
//         "title": "Jeff Bezos killed Washington Post endorsement of Kamala Harris, paper reports",
//         "url": "https://news.google.com/read/CBMiogFBVV95cUxOc2JtZWo4Vk01Y2F5VTFxMTU5ZWE5aURZOWg4U0N5VU9pa29sU1VfdVZPU0ZyMzhhRFhWTmtkQVdTOEhpS3BYQ2NCMklKS3p2UmJybUNjM2MxNlJTRDQycWN3Slptb0w4OGk4Yy1lLS05bDVqSDFIMklJcXNkSm5Tbm5wUER4QXFxZTBpQ0RhZ2RDU3ZLckFCOVVuMFVWZ2pSYnfSAacBQVVfeXFMTXExdGtiRTN3ajhkUmthQUdiMU10TEpkdkxUWnAxcDk4NGRzTkF6b2RnbDJ0TE5NRUJlWXhWRzlNN1EwQnMtdnpUSWRBYzJza05iSzJ6blZLT21oZW96VUstTUZuR2V3aTJNMi0wd2lwbGd2Zl9qMWEyNWJqZ0pMZ2JKWUc5RnNCVnl2SzJIblpBYkVxMjZUM05GOUpVM0dxWnNXN3dJNzQ?hl=en-US&gl=US&ceid=US%3Aen"
//     },
//     {
//         "title": "Washington Post will not endorse a candidate in 2024 presidential election, breaking decades of tradition",
//         "url": "https://news.google.com/read/CBMioAFBVV95cUxPMFZSWC1VY2JIb0MwQndCaVBQTGlpcDJmV3owTC01YUZ5ZlZxcFNibUNLcDZsMHhEMjN4MHdIaWp0bWVTMk91enk1b2hBZEZKOVBZaGs5MzJPRHR1M2hETno2NmR4VmhUenF5ZVBGMDZ4ZU52RTY3WWR6ZFR3LWRPRmNlbDJydGJqTXlteHJrcXNzUVhmSmxuMEpVSGJaU29i0gGXAUFVX3lxTE0wU3gybEZUVFk0bGVsNkQ4T3lBRGMtNnBDaEVVZjVuN3k5bDZHcUJTWm5abGdKN2wxWnBoQThCOTBPaE0zMGNZTF91emE3VVJFYlE2NU4zZHgxVXd0VTJsR1N0UUkwSzVwNWpjM2I2V21kSHpGeDROLXVuUVJwQWUyLTRoQm5mWVJWRFFLT2d0dTlpel9yUHM?hl=en-US&gl=US&ceid=US%3Aen"
//     },
//     {
//         "title": "Exclusive | Holocaust survivor rips Kamala Harris for boosting Trump-Hitler comparisons, says ex-prez is ‘a mensch’",
//         "url": "https://news.google.com/read/CBMi3AFBVV95cUxNSnNDOUdjcW5VQ2c1T1RFQmJYZmxobU5rNVExMVM3enRvREtsNmY5a0hxZGFfZVhLeXZSdmUzU0NSeldUWE0yc3E3YTNoUEg1R1IxUE5DcU1tOC1vMTdsNnh5NVpqQUV6Q2pqTnYza1F5Q1c4VDM3VjEzZWQzWHFZMzd3M1JuWEJsNzhIV2JNeUw2dEVleVVlRVRXS0N6UnpfVjdFdEZhZVBSeG1pbjU1U3VTV3FPY3lCb2xLMXA4eHhxdmN4NHFDX01wSFg5YVZwaC01bHdFcG0wcW42?hl=en-US&gl=US&ceid=US%3Aen"
//     },
//     {
//         "title": "13 former Trump administration officials sign open letter backing up John Kelly's criticism of Trump",
//         "url": "https://news.google.com/read/CBMixwFBVV95cUxOSWl0WmREQjNCYWszSFpfUXlRdXpmM1hlV0VZbTNhN3VQQ0tuMjItaGltN0JHWDhfN2pJNmFYdUNOemw1V1lrU3pzOG9rb1czTEE5OHM5dTFERjctZ28yRXBfZ3Rka0h0aEd4OUZTWkl2ZkdZZndVQXBOMVJYWDVjS1l1bTc0U3BmWkh6YUl0dDZyMFlSa01jTThUazlIaXdJYzVTMDJjY0VseGhGeVpGSkZmSWsydzVLZ3JZeXk1SWVsekxyMHNZ0gFWQVVfeXFMTlROMk56czZqbEV5Ym5MSE9RRVMySlJoa2g0TzVYZnd4cVMtaFVzWFh0Ui1jd2JPQVJhTjNIdFB4S01uUTFUeFRjWEJ3WFNDZkoxejl0WXc?hl=en-US&gl=US&ceid=US%3Aen"
//     },
//     {
//         "title": "Johnson, McConnell ask Harris to ‘stop escalating the threat environment’ after Trump fascist remarks",
//         "url": "https://news.google.com/read/CBMizwFBVV95cUxOTGZJaF9rWDI0TlQxTzUzbzRDSlFEeEoxSEc5THZ6dWN6M2xYaEg3UHNld0RxRkVncXQ4LWNwcF8yclUxeEJZYm1nS2NvLWpqN3RwMmExa1MwQWV0dkwzUnMxWTJTNmhEbmxoX3BvaXhwVUV6QktId0gwY0t6TXNycFl5R2JFZVlHaW1vMjVIZlROQlRtbVZHa1E0RGNPUmg0TzZSVk9iYkNZLWhjbjBzY2ppMnVWNUFERTlKeklqWEswVGxWY0RINVhYSURwSjg?hl=en-US&gl=US&ceid=US%3Aen"
//     },
//     {
//         "title": "How “Trump is a fascist” became Kamala’s closing argument",
//         "url": "https://news.google.com/read/CBMi0AFBVV95cUxNbElOSGdwa1ZlMkFjVHI0ajJZRGowMEpUMEhPVWFTaW5NZzducU5meXhwdDVObGQ5UWdtR2FDY096czkzNDNmMjdRMjNNR3RKRmR6LTNyZ1ZnZVVGdkJMLTg0LUxya0tNbFVLSzh1SGRHb3JBRHdqMzFMTE5QWjJIVDNYTGVRbmdHVVdrWUx4QXdMZjI4UnFXc1BtT3Z1VzlzSG5FVWVDVVJpNzRNTFNsdEVNYXlzcmgzT3JKeW5xTDl2TmpTS2ItQ0NlcDV4Qko0?hl=en-US&gl=US&ceid=US%3Aen"
//     },
//     {
//         "title": "US judge orders Virginia to restore voters removed from rolls, restoring access to about 1600",
//         "url": "https://news.google.com/read/CBMiugFBVV95cUxNQVh2VGM1TEhvMDdiaDh3WUZKZGNYcHkwZm94anBQbXlaZXdYZTBIdTBoNldWR2FycDk1ZEJtYVRaaG15T2dNS0VOSDI4Y21LMVhQYkh6b3Rwcm9ON19lT3lSSDMyT2J3MVRFbmJ3SlpuNkJFODFlSjd4SVgwNUhvNlNsb3duby1waVNSanBfUkZLcTZNSzc1S3hBTUZlY0pSUFQxNEhWZThodHowQi1aSzlUdi1YZVQySmfSAb8BQVVfeXFMT3RwZC13N3MxczkyREg4VXlHOWlzS2VkX0VramRZRjlBcmNVNG4wcnhQeE5XcE84UzJRZUhPX01ZVUFrNk41bXlIZzFKeHhfM3BvV1prOXgtMy0wNGJ2dFdVUk5Gck5ZRXRxTU9QamYxQjF4MXVvTjgtTzd0NzIxWnFBaFp1aHdQSXBVRGxhemVfVjhvNXlyQjUwSTVYR2xGS1lRaHI1YlFscnpORHdtZHZhelpoZG8zUjJlNnlGZHM?hl=en-US&gl=US&ceid=US%3Aen"
//     },
//     {
//         "title": "Harris and Trump Deadlocked to the End, Final Times/Siena National Poll Finds",
//         "url": "https://news.google.com/read/CBMiiAFBVV95cUxPVmRTMUhrOXRRWGJWeC1rTDkxaUFmVmE2bkRnM21FY0ItdC00V2hiRGdEaWdveDdMTUJBZnNZX3c5bnY4YndCQjBvZ2FhWktiUVc0dzNuYXZSaGtzUUZmZHl2bkVZdzZsbEFzTDZ3Ny1DRnpaaHI4UllaOEp2WllmOHNVUHVvS2Rx?hl=en-US&gl=US&ceid=US%3Aen"
//     },
//     {
//         "title": "K-Pop Superstars Seventeen to Launch “The City” Experiences in Los Angeles to Celebrate Sold-Out Shows (Exclusive)",
//         "url": "https://news.google.com/read/CBMiyAFBVV95cUxQenZ1MVF4d1NvQUtiYlpMczN0NzFUc2JtVElqVUZiOEc3emlzOEQyMXJWZ2xFOHNjUkxnQVc4blZ6VnBJR2pVWkRkcnUyLXVGTnI3ZTVBS0VIVTBMbnQ0SFFURUQ2WGh0SjlaU0plZU1XeFNsSEtYaWlsOEIzT3J5SlZINkk1UFkxb2g0QlFOSHJUWWdtWUhwQmxLVklXRnVwMmsyQTdHWFRGeUxmeEh5N0REeDg2OWxwTXlHYlpXc2gzSXhhMk5hbA?hl=en-US&gl=US&ceid=US%3Aen"
//     },
//     {
//         "title": "Metro tries out new tech to find hidden weapons on subways",
//         "url": "https://news.google.com/read/CBMitwFBVV95cUxPcFpqc3RSSnlFZXF2a0RnUVV4M1hnb0RxTTVkcTR2blFrWmNURy1mZFdUTkRuUGhSWUs3TGsxVlJHeEpkU3J0UGVxTFdLOU5NWHpyOWRyZk9OeGNWYjFONU9fQWRQR19OX2szb2FNVU5wRkFQajZsWVp6eXB6eUNDSXRGUEJpa0VodDllV3preS1mVjJ3SnZNSWNsQ3FmSENsNGIwWnFzTkdDSHJWOWttSkdXWFU1QzA?hl=en-US&gl=US&ceid=US%3Aen"
//     },
//     {
//         "title": "Menendez Brothers: Resentencing recommended by LA DA Gascón",
//         "url": "https://news.google.com/read/CBMinAFBVV95cUxOay0tdHNhak0zUG00WXRKY2tYN3UzNVI0N25GR3hHUjRCbHNHVU9zS1VsZ2ZfV1RqNjVybDRwNlhUZnkydjNLVVdINjM3aXRRMk1LeHdvYVRtYnZNN1ZXN3JlM21NclZXSmpjeTdTWnJSbHlUVi1BRnNOcGRBc2FkWkZoZTgtRG9DSWVTTVI4V080ZEJtQ2ZCVGxfNWfSAaIBQVVfeXFMUG82NFh6TEMyX3ZFSXVUeGx2S19ZT1BESi1qYklLbXhQay1XNks0cjFYOC1zTXVlWHl2SjRhdGtVWkloNXY5aF9IOFNkU251Qjg0VDlLZnhhOERmN2c3WURNV3Mwb0dmZk96S0VxMk56d3pQZEhZY1NiaEdiUWg5TXh3aUg0QWRsZVpsc1lsZldXR2dGZ3ZoWFVFcGFxWHdHMkNn?hl=en-US&gl=US&ceid=US%3Aen"
//     },
//     {
//         "title": "Tesla's Bizarre New Cybertruck Trickery Is So Shady We Can't Believe It's Real",
//         "url": "https://news.google.com/read/CBMiZ0FVX3lxTE55dnlFQWwxQXh4SjZybWFTeWIwaEUtNnFRZ1UyWXowZGhXWld1RU5FcTBld1d3NG9DaXJhYXdKYlBLcTdack55OE5pYXRrQ0lBX3RWdThici0wU0N0dHJPQVR6LXZ3bzA?hl=en-US&gl=US&ceid=US%3Aen"
//     },
//     {
//         "title": "No one is ready for AGI — not even OpenAI",
//         "url": "https://news.google.com/read/CBMilAFBVV95cUxQT1MwdElLTDZyaFJqQjhfbVpxejFFMUhGVlhBZXBkN0p3OUhORnFFWVhvZUY1WnFHRm9uVE5sUmplX2ZqXzJZME9JcTJFUHBnMHZqMlpzV1o1TF9MMWRUVnh4bWxJTDE5TFppQm42emlGWnV5TGVoZnYyY1g3LWVVT0R2U0Y5aGtWMEx2SDhJWk96Z3lm?hl=en-US&gl=US&ceid=US%3Aen"
//     },
//     {
//         "title": "Apple adds a menu in iOS 18.2 to change default apps including messages and calls",
//         "url": "https://news.google.com/read/CBMitwFBVV95cUxPYkp3eDc1Z0JMVGgtNlZKN0h6ampKek9jTGl6T3ZRV3F5elY2alZRLTFkMGxHQWpmdUFGb19QV3RMQ1NPUTlFeTN6RHpaeVZHd3djVFhmck90YTMtZnVNQW0xVlFPVkdfQnNPUGVwZVRibENieDBjaV9nVUhhQkRMTXQ1UHRXaklvUElnOUNIa3A1bW5RYVFfSGpZMGY3YjZWR3hER2lRdmFXNWVpLWt5TE5RdkhidUU?hl=en-US&gl=US&ceid=US%3Aen"
//     },
//     {
//         "title": "Exclusive | Elon Musk's Secret Conversations With Vladimir Putin, a WSJ Investigation - WSJ",
//         "url": "https://news.google.com/read/CBMifkFVX3lxTE5BbkJxN29NX0lfNUhoZ2tuM09UZ1NBaF9WbmVNSnBXckV3VTNVUG96X3c2Nkk1aFRFNUJZYUQ1OWZCQ3BwMTd3d2NJT0txLVRCT2p2X2cxNFRzSzBYSmkwc0FiNVJ1V244VUVmdmhhVTRyUnRSZHRmbEtBZl9iUQ?hl=en-US&gl=US&ceid=US%3Aen"
//     },
//     {
//         "title": "Union's rejection of Boeing offer threatens jobs at aerospace suppliers",
//         "url": "https://news.google.com/read/CBMixgFBVV95cUxOMjV2N1dlaUpub0JOYXpWSU5NWEpyTXBuZGRPRWVhWVZOYXBza0FYOEgwRUhmWVhHMXBFbTdrZ19DTEczMzNvckdrREVyanZrWXFyMlhrRnFMc2xKTFpjcElLaml2a2NtWkxLbVM2SktoMEs1VXh6NlU4dXZpRTYxOW82X0hxZ1Z4Y3NFUVprTldxUGZpeDktMms2RUVNaC1vR3VRbVk2eUY0bTFLNURoRHNOR0w4UmJaeFhscGI4Qm5pVUlhZXc?hl=en-US&gl=US&ceid=US%3Aen"
//     },
//     {
//         "title": "I went for a job interview — these insane job conditions caused me to laugh out loud",
//         "url": "https://news.google.com/read/CBMiwAFBVV95cUxPYmlMRkxSbU51bTVZVzI2bHcya2JhVGtrQ09OblhZX0UyZDF2aFQ3NDYza1JrNVFnVS0tTGYzS19IQ0phdE1LdUQwU2tJZ003c0VaaGNLbnp6RFpIRlRvRE84TWlpR2hLRERsNWlmUzd2UXh3ck1MeUpuc3FmMHRUWE84THhCNURLTDR2NnZSNm55MlpNOVNHb0IwblhzSk1CaDV6T1RJUXNmTmU3Mm1wUW1fWENpYWpENFYxMDUtVmQ?hl=en-US&gl=US&ceid=US%3Aen"
//     },
//     {
//         "title": "OpenAI's AGI Czar Quits, Saying the Company Isn't ready For What It's Building",
//         "url": "https://news.google.com/read/CBMicEFVX3lxTFBPVlJrMjVxa0xHdXVUV2VLeXhoamRUekJRa0pvRDZIenpScjNVdzlob0FNU2NDSkNTRl9RcFRMYWZIaUlSeUFqMFVJN1JiSUhjT2tRWWxHWkRNQWNCam5ZRUJZZUpZT1IyYlRzWDE4SUQ?hl=en-US&gl=US&ceid=US%3Aen"
//     },
//     {
//         "title": "Farewell to America's most common banknote after decades: The date you won't be able to use it any more",
//         "url": "https://news.google.com/read/CBMidkFVX3lxTE5KejFLUXdMZXV3Uk5GNjBobDAzWEREUnZCMTc4UkVOMXhEeGR1TUNkMzh2SjI3UVpxTmVLUUtacWI4d1ZxUlBwRmJTRllwdzdiWm50ZXV3QWVCa0cyX1VRdGt1ZnJNbzZwNzIycTBjOFFOSm9nZWc?hl=en-US&gl=US&ceid=US%3Aen"
//     },
//     {
//         "title": "NY booting migrants from upstate hotels as contract expires",
//         "url": "https://news.google.com/read/CBMiiwFBVV95cUxPbEgzcWF5Q1I1ajdhZEJkWEZ1WDFENHZOZVVkWlhiejNzVGxhSVpYdjdHbWtBTzQ1S21palZaUWdVcHVuMFhhb0h6TFYwVVFXQ3dyTGdLVVpaTnloUG5ROEhaaGhZNUVDQ3NwbXZDRGtjQjJ2VGdZSmVTdWVLQ3FYNDBqOTEtVXZWb3gw0gGQAUFVX3lxTE1iYkV4RTNTUnlTdmRpZlcycXgwbGh1RzVpVG9nelZLd0JZODVzb0JFMjV5UDVXNHdRY3VQWUlvaUJCVUZ4ZmpKQmpsYUNITzF3YzRyVVBOZDdqdVl3NjAwZGhVYjFQdHQ2VUxheDh4MkU0dE5rTk9qQnppWDFCUzVZaFFwUVFjdXhmbmc4M244dw?hl=en-US&gl=US&ceid=US%3Aen"
//     },
//     {
//         "title": "North Korean troops fighting for Russia in Ukraine 'fair game,' U.S. warns Putin",
//         "url": "https://news.google.com/read/CBMioAFBVV95cUxOLWM5VHIydzNfcTJHbEMycGRLVFNLS24zeWx0VzFNZE9relJFcjJtUEpLSmhFZncxaWxneDBvUmJ1SEh6Q3pzTHdIRVQ1NndETndzeWZtVlJxSjIydGNhZy1MZTlmd3ZQZnJlVmJmQy1nbmJOd0xGU0gyOTBQN201YzZzT2R1cHNWU1g2SmN2WkIwSW1LRnA3UVBkRWNGNVJt0gFWQVVfeXFMTWtRRm1BVHZScWgyWVdkUDBZMWVKYVNUODhXRXJrQ2tsb3I3V0pfa1JnZWpVYkk2SHctX0FvaHdPQUlpZVEzcVlOUlFnNk9IcURSVU1zWkE?hl=en-US&gl=US&ceid=US%3Aen"
//     },
//     {
//         "title": "Fearing China's hypersonic weapons, US Navy seeks to arm ships with Patriot missiles",
//         "url": "https://news.google.com/read/CBMivgFBVV95cUxPVTlXVnhodl9Hc2I3ZXkycXFKLUpBaEs4bnRVblc4cEdyNHphamhsVmdnMWhMVFdOVHk3a2Y3RnZDS0NlMm8wQjViTzd6dGRTT1NhVnhPZ1E0OGJVMkg3U09DZG5fUFgzSFRpV3dSa3RMSDhROHJWYmh6dUZ0RlA3RXBVRFU4Vjk0N0VqZ2xlLUoxeEtYWnAzM0lPNXpaNzBld0FvdzR1VnlRRjBlSXZ5NGgxdF9wY2Z3bkN3NnNR?hl=en-US&gl=US&ceid=US%3Aen"
//     },
//     {
//         "title": "Thousands of children adopted by Americans are without citizenship. Congress is unwilling to act",
//         "url": "https://news.google.com/read/CBMiowFBVV95cUxQMzBWc3BvcFpyMjBLNjJrOHRSb1lMaVloODdiT3R3akV6TTY1bmFoNGxDRE5NVU94Q0pSQU9NNm5XQUYwRUFpMk9hbEExeG1tbGV0UWxreVV6MXJVbGJHT2pWUjc5Y1poYVR1d1kydGRzRzFqMjBKaFllVHdVVVVmTWpoNzg2eGVqaEJ0ckhqTDk2QkJ1RzZMM0tPMHpiOVdJQjJr?hl=en-US&gl=US&ceid=US%3Aen"
//     },
//     {
//         "title": "Here’s everything Apple will likely announce next week",
//         "url": "https://news.google.com/read/CBMijgFBVV95cUxNZTNraEJ3LV81UXgzMkNoTUFSZ0U4MmxId2pGcHVYQWVRa0xIQS1TQnRjaG9KVlJqcHAzMUVhYmVKY3kxbjZSQ2RqeXN1U05mN0VvcHRkNlBHMDNJNnFrUmtxcTlBTzQ4aHRRMkVXYjhGT1QtMUZzbDBRa1lUamxGN0d2RHBoUGhXa0ZFUE1R?hl=en-US&gl=US&ceid=US%3Aen"
//     },
//     {
//         "title": "Call of Duty: Black Ops 6 launches with eyes on Game Pass plan",
//         "url": "https://news.google.com/read/CBMiWkFVX3lxTE1iQm9fcHpjUWZuTkhxanp1TFcwMWx5S0RRbXZ6QTVlT2lVcUZRR1Q3MWhDc18zSFM0OW9zMzlHWldqbW44ZFQ2SnNKOUlnMkpVbXhQVEd2by05d9IBX0FVX3lxTE9XQ1dFMmgzUU1HM05HS2oxZ0JsYms1LUdPOWVfVVlyYWpxYlpRY3pWYi1FNm5icGRUM3FOdmR5Y2Fvd1RJNG9mN2pReWtmYW9tZUFPbmFtT2lRcGEwYlQ0?hl=en-US&gl=US&ceid=US%3Aen"
//     },
//     {
//         "title": "I Tried the iPhone 16's New Visual Intelligence, and It Feels Like the Future",
//         "url": "https://news.google.com/read/CBMirgFBVV95cUxOUWZNSGhjN2Zna3BEZ0o1RWd3WjVFSl9QdjlfN3lFWjlCeVdZNWh1cDFJN0ptSW50ZDJEajY0VEJBWTdETERnWEZBWnFfRWF4UHE1eDdEYzFiODJ2NzZTOEc3U1ZlYlRlX0pGX3l5aGdaYlA5SU1FTGJFVWhxdi1ja3FlRU9PTWVJMmZwRWNJSUl4NzFGWVpLVHpSREFDSXprdkRfQ0FDb04xMk5NNEE?hl=en-US&gl=US&ceid=US%3Aen"
//     },
//     {
//         "title": "SpaceX Crew-8 astronauts taken to Pensacola hospital for extra medical checks after Dragon capsule splashdown, NASA says",
//         "url": "https://news.google.com/read/CBMilgJBVV95cUxOVER3dnRjOXJKekh1emwtTzJqQXRvRzRQMHFDQmpFblgxZTJpMEo0TzZZdTFrdC1BRkg1Ty0yMGJnbmF3VEFhU0hYcVZEVGVpaDlyQ3FoclZpd3F1OFZnQkVqQmxGeDg4NjNXd1hNTEczSHNlaWlNTDZpN2l4eXBoX0p4VVhNZFhkZFYwSC1LaTViWlZJVU83eXE5aUZMZm1qNEJWMk5OWTZMUXdFQlRnRlF1WjF5M3lvcW5GUEZqRHVaNzNIbVhuREVKVDRMbloyWmswVGs4eXdpbVQzT3JfcXZmNzZVWnREY0JQMGUwMGVKSjl4dDZvbDlzLUtPUFE1Z1NBYTR2ZnpEUjJPeEd4Mm5rZmxBUQ?hl=en-US&gl=US&ceid=US%3Aen"
//     },
//     {
//         "title": "Astronomers take a close look at a dandelion-shaped supernova and zombie star",
//         "url": "https://news.google.com/read/CBMihAFBVV95cUxQU1BHS3VNU1dLd3pPWnpCdFBnRXI5Qi1YQjVwVzVqSUtPM1BLaDRfekJwb09GOE44WjBiXzVJcTFLOVVhTExiSU9tY3p6cnYtQVlNMjJfMERzLWZmTzNyNndKY3NrZmdxdHpnLUgyUlpGS3JQaUxVMS0xMFp4dVdYS2NndWXSAYMBQVVfeXFMTzZCajgxeDlKWThUdDUtbFl4el9vV3l4X1lVWUpTSzcxUFpfRmM4T3FqNUdHUVRENUhvb2l6aHhVVTlnT3VjSFViR1BCNllqaXlNWUFwc21raXJYU2JCUS0wdWFmaGVhMU11djNyelc2eVVtNEJHb1ZfSnhySnE3d0tVdk0?hl=en-US&gl=US&ceid=US%3Aen"
//     },
//     {
//         "title": "A medieval saga told of a man thrown in a well. Scientists found him.",
//         "url": "https://news.google.com/read/CBMihAFBVV95cUxPbXIwaFRTWDREcTVEdXVtZ0toZ3hrQ3BmeTBqVEtmTXlSRVJ5bHQ0M3Y2NUpBSWNMVjQzNHpuVlZPZU1MMFd1N3ozSlVwSHhpOThWZk5UNWx0SXFoeS13bmhhVHRfYTF6cXBKNUMtcExNV3YxcHE1azlsM0tYbVE3Vy12dGI?hl=en-US&gl=US&ceid=US%3Aen"
//     },
//     {
//         "title": "Ripple Challenges Regulatory Uncertainty in Crypto, Files Appeal in Case Against SEC",
//         "url": "https://news.google.com/read/CBMinAFBVV95cUxOMHI3R2V3MEpDaDcyLXJ4VzlQOEszNVRGdmViU2VhVjk4Q3d2cXpHWjlxQTFyQjFBMTM5akZUTENDVEJSQ21xSHY5THJheVhVU1d0TlZ1TlEzZmg0SnFKR2VqSDVoaThOZzY1LVEtLTk5QmdOR2RGb3lJRVM5dkVVb0xsalZqN0V5b1AxdXlhbEJfd3hLc24xMUd3anTSAaQBQVVfeXFMTTZyRmhLTllLRWlZTEU4RWpJTlFMR3BNdXhpU0xBMTJEbjJTOVEzYkhtZTRSdkozVFoyQlAzczZDY3hMV3BRcDc2MHRUZjZTT3dpWWRvNWZzUVY4QU01bUNlS3lKU3dERlA2X3RobVA3TzZ6dzJteGdwa0dqYkU1bW1Xc2VFVDBqSHpYTlhJVGo2akViMXRJbU1YTkw3Qlk4STgxeXA?hl=en-US&gl=US&ceid=US%3Aen"
//     },
//     {
//         "title": "Bitcoin Climbs 3% to Retake $68K With Solana Outperforming, Ether Showing Relative Weakness",
//         "url": "https://news.google.com/read/CBMizgFBVV95cUxOREYxc3BGSnVNRTlsNnMxNjIwN2tGX2xfZlZKelNDb0dXQ3NHclZxeTVYSm5aZmhjbW1WNkdLVFYyWGpaaUUyam5ha2t2ZEc5WlRXS2FscktRekxISW1DS3JTVHc2TGZMZVlPc0NWWVFpME5DbW5IRFU5Z2VkR0NWYUMzNjlGdVk4Uks0bVRXa3d4N3BadUdKQnhXdHYwaUFMRWIxaVptUHc3LWZfa0NUVGs5RUkwZ01uWElxVnJUREphMnBNV1N1TTdrd19VUdIB0wFBVV95cUxQTWk1N2dtU212azcxZklVNVVnekl3RXJIa3R3bHZHeWRhSDRDUU5Ca3dhSUxoUG9QTFJRdF8zQmN5cy05OXVWSjlzSUdoSVMzVTF4b1N4T1BSMDl4V0ZKYXV1bnhNcU9fdVlFcE1kSk5jWkw0RkxRZHdDYUI4U21NQjlydU9kZlhPTGtESXZ4eHhVbDdiazRtNk5LZ3g4VWdGajVIaXowMXJTRzQzajkxOWtTYXF4R2VidXNXVC1Ja0IzZ2E5SWVKOGFabzhIa05OMUdB?hl=en-US&gl=US&ceid=US%3Aen"
//     },
//     {
//         "title": "Bitcoin: Why 350K new addresses are crucial for a BTC rally to $70K",
//         "url": "https://news.google.com/read/CBMikgFBVV95cUxObTFGU2hSQ05YbDd6VTVwb3Iwb2ljRUt0TjRtY21ZQU9IdEVFRVdaczA1Z3ZFYVhWVG5lRTd2QVFzSXRlRGQxeGNRUkx3bTNlekQ4eGljUXBvTzQ4WUt2b0VoUHRJVHRiQV9Rc1dDWHB5anlPcThFUDY3WVRjMU5YRTFQTW9JWE1jRWJyck9fOHRsd9IBlwFBVV95cUxQRjNBdmg2Q3l6UG1VbHRmWFFxeFhfMkVpbTlCNHRQbEgwSDlLTFdFaVMzQjVSamhTNmtLVUhLeWRobWhYbTlOYVlZSFFVTWliRnk3LUtKQlNVM3pod3podlkxalZBOGhKNDYwT1Z6bnctV25aLXpXZ2RsX3ItU0g1OHdmVTMwOEU1X3FrQnRuUzVlRU5EYmtF?hl=en-US&gl=US&ceid=US%3Aen"
//     },
//     {
//         "title": "Scout Traveler vs. Rivian R1S: Comparing electric SUVs",
//         "url": "https://news.google.com/read/CBMimgFBVV95cUxNQjVEVjZnNGRBR3F6OTRZTGFZVmdMLTdpQUNuMmVOOGswRnhGbVl4MzhQbTZmbnFsQ1pnT29mSTlkTkxrNnV4ZzNFT0ZrUDJLQjR6bHVHNkQwU3FZV1VqR2JhY2FoWTZDR0NZMXZZcFVQaDlwVjRPbnp5M25NM2xXZDg5bjdNZ3k0RndzYTBnc2dnWk5WajFfUEFR?hl=en-US&gl=US&ceid=US%3Aen"
//     },
//     {
//         "title": "Florida’s new condo laws recognize the total price of living on the beach",
//         "url": "https://news.google.com/read/CBMiqwFBVV95cUxQb1BMbWdWU2JfQU5ZR2ZHTGRNdzZTWnh2TWFlNmZmRTBmMmZyT0dlWkNTbDE5ckFhTWh1YWU5a3dyZ2RRUG9aazhydUJDb283Y3h2a2JFTG5IcmYzSjFGUXVXRlVOdFZYakhvM1BEVWNWLVlrTGxfSUNacHlHb1B5RjdqcHJVUHB1QlREbG5xM2pwVnBpdzVYNDlMTDFNNVlYRFhfX2Y0UzVJdkU?hl=en-US&gl=US&ceid=US%3Aen"
//     },
//     {
//         "title": "Microsoft CEO Satya Nadella's pay soars to $79 million despite asking for a smaller bonus",
//         "url": "https://news.google.com/read/CBMisgFBVV95cUxPRkZTMWpsemktRl9paURtZTZUTktrZzA4TUpWbGtJbTRxTXlzQzdNTUE2UzlTZnJNcU9YN2J4c3pyMkZtVVBuNG5rRzY2aFpoaE94R0toUkMwMG45cUJmRWVSbHBaanNmMWxHcGdaZ2w3OTdkdC02aDZkaWhQMmtMT095d1duQUM0dlZzeWppT2RGSjRMWHVnM3RreHdBYVYyNUNLbHZ0QUZ0ZGUwMTU2T1ln?hl=en-US&gl=US&ceid=US%3Aen"
//     },
//     {
//         "title": "Lost Silk Road cities unearthed in Uzbekistan's high mountains",
//         "url": "https://news.google.com/read/CBMiWkFVX3lxTE1sYW05blRmaVhIeUFxQ3ZpWWxBeUtldHpaMEVtZnp0UmR3YzhOcEZiODUtRUFZaXg0NVpkQkdsTktPYktkZHdvcEtmS0JCLXFESkZXMURQZW0zd9IBX0FVX3lxTFBhbnlhVXR5S2NJbDN6cHhINzJvMXZEWjdJdTZpY1ZVOVBObmJ6MmNvUjRxMC1la3IxcmwzSXdQY3NzR3h5WnRwZkVPM3VFZkVCSl8yUHZmZUt1bTQ0elc0?hl=en-US&gl=US&ceid=US%3Aen"
//     },
//     {
//         "title": "Canada population curbs will be a drag for the loonie",
//         "url": "https://news.google.com/read/CBMimgFBVV95cUxQcTdiS0tlczlzZDZuNEhOUXdwTloyWlBlTmViZkxyM1FLaExIb0tiR1hsWlROVkpBVXBrNEgyaDVFcVp3SHNrdTZNdVUxNWVvSWt1Ui13bGx3enNkeDJKYnFicHgxUGxIeHlMS3h0ektSMm9SMENDMFdLeUY3TEtYdWNPaThLZkN1NGNFWVRpVGdsSVBMQnI4UzFR0gGfAUFVX3lxTE80TXE0c3J5LUtfMHZDc19HNGlpZzB2a21iemNhUXQ1NGtHYlIwSWMzaXE4TWJJNkVRUTBjQlVsNlc1RGZyc3BlRHJyUUsyMVBkTFJfcUs2UWQ5X2NwUXBscEhjaFUzQjhxYlNpZkJHUHRuZ2UzVG9zSnI3dHhtTDJYY0U1ZjFCSkZEc05NSVFWMkFuc2EwSU5ZMjRiOXlxZw?hl=en-US&gl=US&ceid=US%3Aen"
//     },
//     {
//         "title": "‘Indiana Jones civilization’ 2,000-year-old temple found submerged off Italian coast",
//         "url": "https://news.google.com/read/CBMivwFBVV95cUxQUS1rdGs5dDFrcDhSbW9xSWhRbVRaRDBadkY5UUw4OXprNVMwUnQyRjJHSVdZZWEyM0JRanp5MmdqNkdLb0tvSXM4U3RKSE42NWx0VHpxU1NWbUwyVFJFRkJvbGJuUkNTTUVPaFlEczVmams5Yl9yNGlmS01mazJTX09Eb2RZRmlYMy1Ta3dQYjM4dkloS25fbWk5SGVDX1p5MVI4OTlHemRudXdvaTZmOTItbW0tczNIUVQ4NFpjTQ?hl=en-US&gl=US&ceid=US%3Aen"
//     },
//     {
//         "title": "Fact Check: Did Kamala Harris Call Donald Trump 'Hitler'?",
//         "url": "https://news.google.com/read/CBMijwFBVV95cUxPREFSaWhpNFZZOXpsWjM3VUVwclJxcWlEOXlfVndlRUFwZ1E4Y3lrcVpDWFRCZEppRU0xOFBuYWhYWlhTVUYxTkFZOGVNaEFkeEpxVDNYa2pLanZxNXdTcTNOOHI3amxVV3JNOUNCY2RJQWtJRndWRWtvNHVqczVQQm9yOVJTVnd3MW1lblV0MA?hl=en-US&gl=US&ceid=US%3Aen"
//     },
//     {
//         "title": "Kremlin denies, falsely, North Korean military joining Russia's war in Ukraine",
//         "url": "https://news.google.com/read/CBMiswFBVV95cUxNT09zTnVnMTBNWXFzWUlTVXlwUDlGTlhrNTFxeUNhQXF0VWZXdEU0X1h2dnI0OFo0U2hVTV9jN1c3cEFIZ2ZBNWpIdUZsX0gzMzFwT1dlNmUyQUVRU3RoS0dOMTRHTGkzY1YzY29RWXFtQ1RhaGxpM2ZsT1hvRlU0MFZ4RFBoNHFNOGNwcHR0eVRrdEJBT2pEQVhJUThnRERIWlR3bjBPcVQ5SHVBMXlaNXZORQ?hl=en-US&gl=US&ceid=US%3Aen"
//     },
//     {
//         "title": "Georgia election officials refute early vote flipping claims",
//         "url": "https://news.google.com/read/CBMiWEFVX3lxTE4wVjgzQktXMk40My1OR1dZaUx1UTA0S21jZHdWcnRkSGc5cF9XSWpQX0tMX2pycEI3cmJONWYxalp4TFlFczJ3aDBvb2Vzd3QzRDR6ODB4TnI?hl=en-US&gl=US&ceid=US%3Aen"
//     },
//     {
//         "title": "X users, Elon Musk circulate image of fake Atlantic headline",
//         "url": "https://news.google.com/read/CBMirAFBVV95cUxQOVVaZXNyajNwWEM5WUZNcG9uVVRPUFREZnczWHV3SGFQS3BMOVFIMnhSclRQaE9XdThqNVoxX19wRFJnbXNlNTlWbFZSSEZSWFg2aFZveDlraFdZYTFnYWVHcVplaUZac0JQMUFLWjB5Rm5KSjZrcGJkY0lwV1BWLXhLSWR2aS01VzRRTU9xUFhFNURzQ3pBOUlRR0U0YlFuYjBJUDRBUk1UNHlC?hl=en-US&gl=US&ceid=US%3Aen"
//     },
//     {
//         "title": "Google Drive Full? Here's How You Can Get More Storage Without Paying for It",
//         "url": "https://news.google.com/read/CBMiwAFBVV95cUxPVjNyTmU3R0VNS2lUY3NXUjFudi1xSXprbjBNdzRBQ3FBcUl6aTlKWHRXY3VaTXNKdWtEc2hobnJFa05uZEp3Y29xdXYzZ25JeXAxME1lWlgzRG9vZlhCX1RSWjZCOUJsU1c3bDczdGQ3YloybFIxU0xwRVFMaE9qRTJFQURweERpX1NSRFpMSXZtVnhrWFFJNFk0Y3JQaWpLUjBFWkdDbWl4VllqNFZnSEhnRHB1NER2Zk9nOUN4X0Q?hl=en-US&gl=US&ceid=US%3Aen"
//     },
//     {
//         "title": "Can the Media Survive?",
//         "url": "https://news.google.com/read/CBMilgFBVV95cUxOOU1ISVk4NkNXWEN4dWtuSTVfLWtldGF5RXhORWdROGR1RjBYSi1xUUFtSHM0bHM3Rm9qQ0gySUwyYmZkMEJRUDhCWHZSaVdFdXdneGNhQVRfTnc2OG5oRW5qcEZDM0N2cTNrQ3pKZVF1ektzMUlOSWJTMEp3bG43TXE0cEU2N3pQRkFxdW9QRXJXaHZPc0E?hl=en-US&gl=US&ceid=US%3Aen"
//     },
//     {
//         "title": "A Controversial Rare-Book Dealer Tries to Rewrite His Own Ending",
//         "url": "https://news.google.com/read/CBMirwFBVV95cUxOTjFoWW5FV1prNzh0ZWRLQUo3YlhZVV9BRDNxMTU0RU4wZmRLeERYSzh4bTBnVmpsR1ZkSVZzakVWeGJFOFdGWkZ5RkkyN29pOHlpOGM0cGEyMXhEbUlNVnpZajFSQ0ZhNFhhcHV1MlFRaUQ4NXlsSGF6dlpWMnUxWEtad1R4TVlITVhJQVJISEt5ZV9jeU9RR0ZlM1NFNWE2QmRFVjZjVzd5OG52Q000?hl=en-US&gl=US&ceid=US%3Aen"
//     },
//     {
//         "title": "Liquid AI Is Redesigning the Neural Network",
//         "url": "https://news.google.com/read/CBMic0FVX3lxTE5zRjFOSFRtUl95WDdHTVNMOUZ5WUp6R3VEWXFCeUhWZlBWRHh6QkxCWVFYZEJGVmxVaVlQRmYzLUhqQmtocDdpSXlQU3VZbjdUTUNza3J6UE5LamFPMDdNNG1OTDM1Tjlsd0NNcVlITVlrS2M?hl=en-US&gl=US&ceid=US%3Aen"
//     }
// ]
