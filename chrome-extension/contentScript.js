// Create a button to toggle the DOM display
// const domButton = document.createElement('button');
// domButton.textContent = 'Show/Hide DOM';
// domButton.style.position = 'fixed';
// domButton.style.top = '10px';
// domButton.style.right = '10px';
// domButton.style.zIndex = '10000';
// document.body.appendChild(domButton);

// // Create a button to show input elements
// const inputButton = document.createElement('button');
// inputButton.textContent = 'Show Input Elements';
// inputButton.style.position = 'fixed';
// inputButton.style.top = '40px';
// inputButton.style.right = '10px';
// inputButton.style.zIndex = '10000';
// document.body.appendChild(inputButton);

// // Create a container for the DOM text
// const domContainer = document.createElement('div');
// domContainer.style.position = 'fixed';
// domContainer.style.right = '0';
// domContainer.style.top = '0';
// domContainer.style.bottom = '0';
// domContainer.style.width = '50%';
// domContainer.style.backgroundColor = 'white';
// domContainer.style.overflow = 'auto';
// domContainer.style.zIndex = '9999';
// domContainer.style.display = 'none';
// document.body.appendChild(domContainer);

// // Create a divider
// const divider = document.createElement('div');
// divider.style.position = 'fixed';
// divider.style.left = '50%';
// divider.style.top = '0';
// divider.style.bottom = '0';
// divider.style.width = '4px';
// divider.style.backgroundColor = 'black';
// divider.style.zIndex = '9998';
// divider.style.cursor = 'col-resize';
// divider.style.display = 'none'; // Initially hide the divider
// document.body.appendChild(divider);

// Variables to track mouse state
// let isDragging = false;
// let currentX;

// // Event listener for the DOM button
// domButton.addEventListener('click', () => {
//   const isVisible = domContainer.style.display === 'none';
//   domContainer.style.display = isVisible ? 'block' : 'none';
//   divider.style.display = isVisible ? 'block' : 'none'; // Show/hide the divider

//   if (isVisible) {
//     const domText = document.documentElement.outerHTML;
//     domContainer.textContent = domText;
//     document.body.style.width = '50%';
//   } else {
//     domContainer.textContent = '';
//     document.body.style.width = '';
//   }
// });

// // Event listener for the input button
// inputButton.addEventListener('click', () => {
//   const inputElements = document.querySelectorAll('input, button');
//   let inputText = '';

//   inputElements.forEach((input) => {
//     inputText += `${input.outerHTML}\n\n`;
//   });

//   domContainer.textContent = inputText;
//   domContainer.style.display = 'block';
//   divider.style.display = 'block'; // Show the divider
//   document.body.style.width = '50%';
// });

// // Event listeners for the divider
// divider.addEventListener('mousedown', dragStart);
// divider.addEventListener('mouseup', dragEnd);
// divider.addEventListener('mousemove', drag);

// function dragStart(e) {
//   isDragging = true;
//   currentX = e.clientX;
// }

// function dragEnd() {
//   isDragging = false;
// }

// function drag(e) {
//   if (isDragging) {
//     const delta = e.clientX - currentX;
//     currentX = e.clientX;
//     divider.style.left = `${newLeft}px`;
//     domContainer.style.width = `${100 - (newLeft / window.innerWidth) * 100}%`;
//     document.body.style.width = `${(newLeft / window.innerWidth) * 100}%`;
//   }
// }

function extractTextContent() {
  return document.body.innerText;
}

 function processArticle() {
  const documentClone = document.cloneNode(true);
  const article = new Readability(documentClone).parse();

  return article ;
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("contentScript ", request);
  if (request.action === "getDOMContent") {
    // sendResponse({ content: extractTextContent() });
    sendResponse({ content: processArticle()});
  } else if (request.action === "definition") {
        // Remove previous highlight if it exists
        removeHighlight();

        console.log("Last xy: ", lastKnownMouseX, lastKnownMouseY);
    
        // Use the last known mouse position
        const result = getWordAtPosition(lastKnownMouseX, lastKnownMouseY);
    
        if (result && result.word) {
          lastWord = result.word;
          // lastWord = word;
          chrome.runtime.sendMessage({
            type: "wordUnderCursor",
            word: result.word,
          });
    
          // Highlight the word
          highlightWord(result.range);
        }
  } else if (request.action === "checkPlayer") {
    checkPlayer() ;
  }
});

// document.addEventListener('mousemove', (e) => {
//   const range = document.caretRangeFromPoint(e.clientX, e.clientY);
//   if (range) {
//     const word = getWordAtPosition(range.startContainer, range.startOffset);
//     if (word) {
//       chrome.runtime.sendMessage({
//         type: "wordUnderCursor",
//         word: word,
//       });
//     }
//   }
// });
let lastWord = "";
let lastKnownMouseX = 0;
let lastKnownMouseY = 0;
let highlightedElement = null;
let popupElement = null;

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

document.addEventListener("keydown", (e) => {
  // Check if the pressed key combination is Ctrl+Q
  if (e.ctrlKey && e.key === "q") {
    e.preventDefault(); // Prevent default browser behavior for this key combination
    // const selection = window.getSelection();
    // const range = selection.rangeCount > 0 ? selection.getRangeAt(0) : document.caretRangeFromPoint(e.clientX, e.clientY);

    // Remove previous highlight if it exists
    removeHighlight();

    console.log("Last xy: ", lastKnownMouseX, lastKnownMouseY);

    // Use the last known mouse position
    const result = getWordAtPosition(lastKnownMouseX, lastKnownMouseY);

    if (result && result.word) {
      lastWord = result.word;
      // lastWord = word;
      chrome.runtime.sendMessage({
        type: "wordUnderCursor",
        word: result.word,
      });

      // Highlight the word
      highlightWord(result.range);
    }
  }
});

function getWordAtPosition(x, y) {
  const range = document.caretRangeFromPoint(x, y);
  if (!range) return null;

  const textNode = range.startContainer;
  const offset = range.startOffset;

  if (textNode.nodeType !== Node.TEXT_NODE) return null;

  const text = textNode.textContent;
  let start = offset;
  let end = offset;

  // Find the start of the word
  while (start > 0 && /\w/.test(text[start - 1])) {
    start--;
  }

  // Find the end of the word
  while (end < text.length && /\w/.test(text[end])) {
    end++;
  }

  const word = text.slice(start, end);
  range.setStart(textNode, start);
  range.setEnd(textNode, end);

  return { word, range };
}

function highlightWord(range) {
  removeHighlight(); // Ensure any existing highlight is removed
  const highlight = document.createElement("span");
  highlight.className = "extension-highlight"; // Add a class for easier identification

  // Set theme-aware highlight color
  setThemeAwareHighlight(highlight);

  range.surroundContents(highlight);
  highlightedElement = highlight;

  // Create and position the popup
  createPopup(highlight);

  // Fetch the definition
  fetchDefinition(lastWord);
}

function setThemeAwareHighlight(element) {
  const bodyStyles = window.getComputedStyle(document.body);
  const isDarkTheme =
    bodyStyles.backgroundColor
      .match(/^rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i)
      .slice(1)
      .map(Number)
      .reduce((a, b) => a + b) < 382; // Threshold for considering it a dark theme

  if (isDarkTheme) {
    element.style.backgroundColor = "rgba(80, 80, 0, 0.5)"; // Dark yellow with transparency
    element.style.color = "#fff"; // White text for dark background
  } else {
    element.style.backgroundColor = "rgba(255, 255, 0, 0.3)"; // Light yellow with transparency
    element.style.color = "inherit"; // Inherit text color from parent
  }

  // Add a subtle outline for better visibility
  element.style.outline = isDarkTheme
    ? "1px solid rgba(255, 255, 0, 0.5)"
    : "1px solid rgba(0, 0, 0, 0.2)";
  element.style.borderRadius = "2px";
}

function removeHighlight() {
  if (highlightedElement) {
    const parent = highlightedElement.parentNode;
    while (highlightedElement.firstChild) {
      parent.insertBefore(highlightedElement.firstChild, highlightedElement);
    }
    parent.removeChild(highlightedElement);
    highlightedElement = null;
    removePopup(); // Remove the popup when removing the highlight
  }
}

function createPopup(highlightElement) {
  removePopup(); // Remove any existing popup

  popupElement = document.createElement("div");
  popupElement.style.position = "absolute";
  popupElement.style.padding = "10px";
  popupElement.style.borderRadius = "5px";
  popupElement.style.boxShadow = "0 2px 10px rgba(0,0,0,0.3)";
  popupElement.style.zIndex = "1000";
  popupElement.style.maxWidth = "500px";
  // popupElement.style.fontSize = "14px";
  popupElement.style.lineHeight = "1.4";
  popupElement.textContent = "Loading definition...";

  // Set theme-aware styles
  setThemeAwareStyles(popupElement);

  // Position the popup under the highlighted word
  const rect = highlightElement.getBoundingClientRect();
  popupElement.style.left = `${rect.left + window.scrollX}px`;
  popupElement.style.top = `${rect.bottom + window.scrollY + 5}px`; // Added 5px gap

  document.body.appendChild(popupElement);
}

function setThemeAwareStyles(element) {
  // Get the computed styles of the body to determine the theme
  const bodyStyles = window.getComputedStyle(document.body);
  const isDarkTheme =
    bodyStyles.backgroundColor
      .match(/^rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i)
      .slice(1)
      .map(Number)
      .reduce((a, b) => a + b) < 382; // Threshold for considering it a dark theme

  if (isDarkTheme) {
    element.style.backgroundColor = "rgba(40, 40, 40, 0.95)";
    element.style.color = "#e0e0e0";
    element.style.border = "1px solid #555";
  } else {
    element.style.backgroundColor = "rgba(255, 255, 255, 0.95)";
    element.style.color = "#333";
    element.style.border = "1px solid #ccc";
  }
}

function removePopup() {
  if (popupElement) {
    popupElement.remove();
    popupElement = null;
  }
}

// Function to handle API requests
function fetchDefinition(word) {
  const lowercaseWord = word.toLowerCase();
  fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${lowercaseWord}`)
    .then((response) => response.json())
    .then((data) => {
      if (Array.isArray(data) && data.length > 0) {
        const entry = data[0];
        let definitionHTML = `<h2>${word}</h2>`;

        entry.meanings.forEach((meaning, index) => {
          definitionHTML += `<h3>${index + 1}. ${meaning.partOfSpeech}</h3>`;
          definitionHTML += "<ul>";
          meaning.definitions.forEach((def) => {
            definitionHTML += `<li><strong>Definition:</strong> ${def.definition}`;
            if (def.example) {
              definitionHTML += `<br><em>Example:</em> "${def.example}"`;
            }
            definitionHTML += "</li>";
          });
          definitionHTML += "</ul>";

          if (meaning.synonyms.length > 0) {
            definitionHTML += `<p><strong>Synonyms:</strong> ${meaning.synonyms.join(
              ", "
            )}</p>`;
          }
          if (meaning.antonyms.length > 0) {
            definitionHTML += `<p><strong>Antonyms:</strong> ${meaning.antonyms.join(
              ", "
            )}</p>`;
          }
        });

        if (entry.phonetics && entry.phonetics.length > 0) {
          const phonetic = entry.phonetics.find((p) => p.text && p.audio);
          if (phonetic) {
            definitionHTML += `<p><strong>Pronunciation:</strong> ${phonetic.text} `;
            definitionHTML += `<audio controls src="${phonetic.audio}">Your browser does not support the audio element.</audio></p>`;
          }
        }

        updatePopupContent(definitionHTML);
      } else {
        updatePopupContent("Definition not found.");
      }
    })
    .catch((error) => {
      console.error("Error fetching definition:", error);
      updatePopupContent("Error fetching definition.");
    });
}

// Function to update the popup content
function updatePopupContent(content) {
  if (popupElement) {
    popupElement.innerHTML = content;
  }
}

(function() {
  class YouTubeAutoPlayer {
    constructor() {
      this.DEBUG = true;
      this.SUPPORTED_DOMAINS = ['youtube.com', 'music.youtube.com'];
      this.PLATFORM = {
        YOUTUBE: 'youtube',
        YOUTUBE_MUSIC: 'youtube_music',
        UNSUPPORTED: 'unsupported'
      };

      this.SELECTORS = {
        [this.PLATFORM.YOUTUBE]: {
          searchResults: 'a#video-title',
          isValidResult: (link) => link.href.includes('/watch?v=')
        },
        [this.PLATFORM.YOUTUBE_MUSIC]: {
          songResults: 'ytmusic-responsive-list-item-renderer',
          videoResults: 'ytmusic-video-renderer',
          playlistResults: 'ytmusic-playlist-renderer',
          channelSongResults: '#contents ytmusic-responsive-list-item-renderer',
          channelShuffleButton: 'ytmusic-play-button-renderer[data-tooltip="Shuffle"]',
          channelPlayButton: 'ytmusic-play-button-renderer[data-tooltip="Play"]',
          playButton: 'ytmusic-play-button-renderer',
          titleLink: 'a.yt-simple-endpoint'
        }
      };

      const platform = this.getCurrentPlatform();
      if (platform !== this.PLATFORM.UNSUPPORTED) {
        this.debugLog('Supported platform detected:', platform);
        this.initWhenReady();
      } else {
        this.debugLog('Unsupported domain, extension inactive');
      }
    }

    initWhenReady() {
      if (document.readyState === 'interactive' || document.readyState === 'complete') {
        this.init();
      } else {
        document.addEventListener('DOMContentLoaded', () => this.init(), { once: true });
      }
    }

    debugLog(message, data = null) {
      if (!this.DEBUG) return;
      const timestamp = new Date().toISOString();
      const logStyle = 'background: #f0f0f0; color: #333; padding: 2px 5px; border-radius: 3px;';
      
      if (data) {
        console.log(`%c[YouTube Autoplay ${timestamp}] ${message}`, logStyle, data);
      } else {
        console.log(`%c[YouTube Autoplay ${timestamp}] ${message}`, logStyle);
      }
    }

    getCurrentPlatform() {
      const currentDomain = window.location.hostname;
      
      if (!this.SUPPORTED_DOMAINS.some(domain => currentDomain.includes(domain))) {
        return this.PLATFORM.UNSUPPORTED;
      }

      return currentDomain === 'music.youtube.com' ? 
        this.PLATFORM.YOUTUBE_MUSIC : 
        this.PLATFORM.YOUTUBE;
    }

    isSearchPage() {
      const platform = this.getCurrentPlatform();
      
      if (platform === this.PLATFORM.UNSUPPORTED) return false;

      const isSearch = platform === this.PLATFORM.YOUTUBE 
        ? window.location.pathname === '/results' && window.location.search.includes('search_query')
        : (window.location.pathname.includes('/search') || 
           window.location.search.includes('q=') || 
           window.location.pathname.includes('/channel'));
      
      this.debugLog(`Checking if search/channel page: ${isSearch}`, {
        platform,
        pathname: window.location.pathname,
        search: window.location.search
      });
      
      return isSearch;
    }

    getResultsInfo() {
      const platform = this.getCurrentPlatform();
      if (platform === this.PLATFORM.UNSUPPORTED) return null;

      this.debugLog(`Getting results info for platform: ${platform}`);

      if (platform === this.PLATFORM.YOUTUBE) {
        const videoLinks = document.querySelectorAll(this.SELECTORS[platform].searchResults);
        return {
          videos: {
            count: videoLinks.length,
            firstTitle: videoLinks[0]?.textContent || 'N/A'
          }
        };
      } else {
        const selectors = this.SELECTORS[platform];
        const songResults = document.querySelectorAll(selectors.songResults);
        const videoResults = document.querySelectorAll(selectors.videoResults);
        const playlistResults = document.querySelectorAll(selectors.playlistResults);
        const channelSongs = document.querySelectorAll(selectors.channelSongResults);
        
        return {
          songs: {
            count: songResults.length,
            firstTitle: songResults[0]?.querySelector(selectors.titleLink)?.textContent || 'N/A'
          },
          videos: {
            count: videoResults.length,
            firstTitle: videoResults[0]?.querySelector(selectors.titleLink)?.textContent || 'N/A'
          },
          playlists: {
            count: playlistResults.length,
            firstTitle: playlistResults[0]?.querySelector(selectors.titleLink)?.textContent || 'N/A'
          },
          channelSongs: {
            count: channelSongs.length,
            firstTitle: channelSongs[0]?.querySelector(selectors.titleLink)?.textContent || 'N/A'
          }
        };
      }
    }

    handleYouTubePlay(checkForResults) {
      const videoLinks = document.querySelectorAll(this.SELECTORS[this.PLATFORM.YOUTUBE].searchResults);
      
      for (let link of videoLinks) {
        if (this.SELECTORS[this.PLATFORM.YOUTUBE].isValidResult(link)) {
          this.debugLog('Found valid YouTube video link:', link.href);
          window.location.href = link.href + '&autoplay=1';
          clearInterval(checkForResults);
          break;
        }
      }
    }

    handleYouTubeMusicPlay(checkForResults) {
      const selectors = this.SELECTORS[this.PLATFORM.YOUTUBE_MUSIC];
      
      // Handle channel page
      if (window.location.pathname.includes('/channel')) {
        this.debugLog('Handling YouTube Music channel page');
        
        // Try shuffle button first
        const shuffleButton = document.querySelector(selectors.channelShuffleButton);
        if (shuffleButton) {
          this.debugLog('Found shuffle button, attempting to click');
          try {
            shuffleButton.click();
            clearInterval(checkForResults);
            this.debugLog('Successfully clicked shuffle button');
            return;
          } catch (error) {
            this.debugLog('Error clicking shuffle button:', error);
          }
        }

        // Try play button if shuffle isn't available
        const playButton = document.querySelector(selectors.channelPlayButton);
        if (playButton) {
          this.debugLog('Found play button, attempting to click');
          try {
            playButton.click();
            clearInterval(checkForResults);
            this.debugLog('Successfully clicked play button');
            return;
          } catch (error) {
            this.debugLog('Error clicking play button:', error);
          }
        }

        // Fall back to first song if buttons aren't available
        const channelSongs = document.querySelectorAll(selectors.channelSongResults);
        if (channelSongs.length > 0) {
          const firstSong = channelSongs[0];
          const songPlayButton = firstSong.querySelector(selectors.playButton);
          if (songPlayButton) {
            this.debugLog('Found first song play button, attempting to click');
            try {
              songPlayButton.click();
              clearInterval(checkForResults);
              this.debugLog('Successfully clicked first song play button');
              return;
            } catch (error) {
              this.debugLog('Error clicking first song play button:', error);
            }
          }
        }
      }

      // Handle search results
      const songResults = document.querySelectorAll(selectors.songResults);
      const videoResults = document.querySelectorAll(selectors.videoResults);
      const playlistResults = document.querySelectorAll(selectors.playlistResults);
      
      const resultsInfo = this.getResultsInfo();
      this.debugLog('Current YouTube Music results found:', resultsInfo);
      
      let firstResult = null;
      let resultType = '';
      
      if (songResults.length > 0) {
        firstResult = songResults[0];
        resultType = 'song';
      } else if (videoResults.length > 0) {
        firstResult = videoResults[0];
        resultType = 'video';
      } else if (playlistResults.length > 0) {
        firstResult = playlistResults[0];
        resultType = 'playlist';
      }
      
      if (firstResult) {
        clearInterval(checkForResults);
        this.debugLog(`Found first YouTube Music result of type: ${resultType}`);
        
        const playButton = firstResult.querySelector(selectors.playButton);
        if (playButton) {
          this.debugLog('Found play button, attempting to click');
          try {
            playButton.click();
            this.debugLog('Successfully clicked play button');
          } catch (error) {
            this.debugLog('Error clicking play button:', error);
          }
        } else {
          this.debugLog('No play button found, trying title element');
          const titleElement = firstResult.querySelector(selectors.titleLink);
          if (titleElement) {
            this.debugLog('Found title element, attempting to click');
            try {
              titleElement.click();
              this.debugLog('Successfully clicked title element');
            } catch (error) {
              this.debugLog('Error clicking title element:', error);
            }
          }
        }
      }
    }

    playFirstResult() {
      const platform = this.getCurrentPlatform();
      if (platform === this.PLATFORM.UNSUPPORTED) return;

      this.debugLog(`Starting playFirstResult function for platform: ${platform}`);
      
      let attemptCount = 0;
      const checkForResults = setInterval(() => {
        attemptCount++;
        this.debugLog(`Attempt ${attemptCount} to find results`);
        
        if (platform === this.PLATFORM.YOUTUBE) {
          this.handleYouTubePlay(checkForResults);
        } else {
          this.handleYouTubeMusicPlay(checkForResults);
        }
      }, 1000);

      // Stop checking after 10 seconds
      setTimeout(() => {
        clearInterval(checkForResults);
        this.debugLog(`Search timeout reached after ${attemptCount} attempts`);
      }, 10000);
    }

    init() {
      this.debugLog('Initializing YouTube Autoplay extension');
      this.debugLog(`Current platform: ${this.getCurrentPlatform()}`);

      // Handle initial page load
      if (this.isSearchPage()) {
        this.debugLog('Initial page is a search page, scheduling autoplay');
        setTimeout(() => this.playFirstResult(), 1500);
      }

      // Handle navigation within the SPA
      let lastUrl = location.href;
      this.debugLog('Starting URL observer');
      new MutationObserver(() => {
        const url = location.href;
        if (url !== lastUrl) {
          this.debugLog('URL changed', {
            from: lastUrl,
            to: url
          });
          lastUrl = url;
          if (this.isSearchPage()) {
            this.debugLog('New URL is a search page, scheduling autoplay');
            setTimeout(() => this.playFirstResult(), 1500);
          }
        }
      }).observe(document, { subtree: true, childList: true });

      // Add keyboard shortcut
      document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'p') {
          this.debugLog('Manual trigger shortcut (Ctrl+P) detected');
          this.playFirstResult();
        }
      });
    }
  }

  // Create instance immediately
  const player = new YouTubeAutoPlayer();
})();


