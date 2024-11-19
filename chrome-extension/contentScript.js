
const customLog = (...args) => {
  // Convert any non-string arguments to strings for serialization
  const serializedArgs = args.map((arg) => {
    if (typeof arg === "object") {
      try {
        return JSON.stringify(arg);
      } catch (e) {
        return String(arg);
      }
    }
    return String(arg);
  });

  // Create a timestamp
  const timestamp = new Date().toISOString();

  // Create the log message
  const logMessage = {
    // timestamp,
    type: "log",
    source: "content.js",
    message: serializedArgs.join(" "),
    // stack: new Error().stack
  };

  // Send message to background script
  chrome.runtime
    .sendMessage({
      type: "LOG",
      data: logMessage,
    })
    .catch((error) => {
      // Fallback to console.log if messaging fails
      console.log("[CustomLog Failed]", ...args, error);
    });
};

console.log = customLog;

function extractTextContent() {
  return document.body.innerText;
}

function processArticle() {
  const documentClone = document.cloneNode(true);
  const article = new Readability(documentClone).parse();
  return article;
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("contentScript ", request);
  if (request.action === "getDOMContent") {
    // sendResponse({ content: extractTextContent() });
    sendResponse({ content: processArticle() });
  } else if (request.action === "definition") {
    definitionHandler() ;
  } else if (request.action === "highlight_facts") {
    console.log("highlight_facts:", request.facts);
    highlightFacts(request.facts);
  } 
  
  // else if (request.action === "grab_title") {
  //   console.log("grab_title:");
  //   grabHeadlines();
  // } else if (request.action === "click") {
  //   console.log("click:", request.parameter);
  //   let headLines = grabHeadlines();
  //   console.log("headlines:", headLines);
  //   if (headLines) {
  //     console.log("click the headline with: ", request.parameter);
  //     openArticle(headLines, request.parameter);
  //   }
  // }
});


// Track the last known mouse position
document.addEventListener(
  "mousemove",
  (e) => {
    lastKnownMouseX = e.clientX;
    lastKnownMouseY = e.clientY;

    // Add popup removal logic here
    if (highlightedElement && popupElement) {
      const highlightedRect = highlightedElement.getBoundingClientRect();
      const popupRect = popupElement.getBoundingClientRect();

      // Check if mouse is outside both the highlighted element and the popup
      if (
        !isMouseInElement(e, highlightedRect) &&
        !isMouseInElement(e, popupRect)
      ) {
        removeHighlight();
      }
    }
  },
  { passive: true }
);

// Helper function to check if mouse is inside an element
function isMouseInElement(mouseEvent, elementRect) {
  return (
    mouseEvent.clientX >= elementRect.left &&
    mouseEvent.clientX <= elementRect.right &&
    mouseEvent.clientY >= elementRect.top &&
    mouseEvent.clientY <= elementRect.bottom
  );
}

// document.addEventListener("keydown", (e) => {
//   // Check if the pressed key combination is Ctrl+Q
//   if (e.ctrlKey && e.key === "q") {
//     e.preventDefault(); // Prevent default browser behavior for this key combination
//     // const selection = window.getSelection();
//     // const range = selection.rangeCount > 0 ? selection.getRangeAt(0) : document.caretRangeFromPoint(e.clientX, e.clientY);

//     // Remove previous highlight if it exists
//     removeHighlight();

//     console.log("Last xy: ", lastKnownMouseX, lastKnownMouseY);

//     // Use the last known mouse position
//     const result = getWordAtPosition(lastKnownMouseX, lastKnownMouseY);

//     if (result && result.word) {
//       lastWord = result.word;
//       // lastWord = word;
//       chrome.runtime.sendMessage({
//         type: "wordUnderCursor",
//         word: result.word,
//       });

//       // Highlight the word
//       highlightWord(result.range);
//     }
//   }
// });

function highlightFacts(strings) {
  const body = document.body;

  // Loop over each string in the list
  strings.forEach((str) => {
    // Create a regular expression for the string, case-insensitive
    const regex = new RegExp(str, "gi");

    // Use treeWalker to find text nodes in the DOM
    const walker = document.createTreeWalker(
      body,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );
    let node;

    // Iterate over all text nodes
    while ((node = walker.nextNode())) {
      const parent = node.parentNode;

      // If the node contains the string we're looking for
      if (regex.test(node.nodeValue)) {
        // Replace the string with a marked version
        const highlighted = node.nodeValue.replace(
          regex,
          (match) =>
            `<span style="background-color: lightblue; color: black;">${match}</span>`
        );

        // Replace the original text with the new highlighted HTML
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = highlighted;

        // Replace the original text node with the new HTML
        while (tempDiv.firstChild) {
          parent.insertBefore(tempDiv.firstChild, node);
        }

        // Remove the original text node
        parent.removeChild(node);
      }
    }
  });
}
