function getViewportLinks() {
    // Get viewport dimensions
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

    // Get all links in the document
    const links = document.getElementsByTagName('a');
    const visibleLinks = [];

    // Check each link
    for (let link of links) {
        const rect = link.getBoundingClientRect();
        
        // Calculate visibility percentage
        if (isElementSufficientlyVisible(link, 0.3) && isElementVisible(link)) {
            visibleLinks.push({
                text: getLinkText(link),
                url: link.href,
                position: {
                    top: rect.top,
                    left: rect.left
                }
            });
        }
    }

    // Sort links by position (top to bottom, left to right)
    visibleLinks.sort((a, b) => {
        // If the difference in vertical position is significant (more than 10px)
        if (Math.abs(a.position.top - b.position.top) > 10) {
            return a.position.top - b.position.top;
        }
        // If they're roughly on the same line, sort by left position
        return a.position.left - b.position.left;
    });

    // Return final array without position data
    return visibleLinks.map(({ text, url }) => ({ text, url }));
}

// Helper function to check if element is sufficiently visible (more than threshold percentage)
function isElementSufficientlyVisible(element, threshold = 0.3) {
    const rect = element.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;

    // Calculate the visible area of the element
    const visibleWidth = Math.min(rect.right, viewportWidth) - Math.max(rect.left, 0);
    const visibleHeight = Math.min(rect.bottom, viewportHeight) - Math.max(rect.top, 0);

    // Calculate total and visible area
    const totalArea = rect.width * rect.height;
    const visibleArea = visibleWidth * visibleHeight;

    // Calculate visibility ratio
    const visibilityRatio = visibleArea / totalArea;

    return visibilityRatio >= threshold;
}

// Helper function to check if element is visible via CSS
function isElementVisible(element) {
    const style = window.getComputedStyle(element);
    return style.display !== 'none' &&
           style.visibility !== 'hidden' &&
           style.opacity !== '0';
}

// Helper function to get link text (including image alt text if necessary)
function getLinkText(link) {
    // First try to get the text content
    let text = link.textContent.trim();
    
    // If no text content, check for images with alt text
    if (!text) {
        const images = link.getElementsByTagName('img');
        for (let img of images) {
            if (img.alt) {
                text = img.alt.trim();
                break;
            }
        }
    }
    
    // If still no text, try to get aria-label
    if (!text) {
        text = link.getAttribute('aria-label') || '';
    }
    
    // If still no text, use the URL as last resort
    if (!text) {
        text = link.href;
    }
    
    return text;
}

// Usage example
// const links = getViewportLinks();
// console.log(links);

// Throttle function to limit how often the update runs
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    }
}

// Function to handle updates
function setupScrollListener() {
    // Initial list
    let currentLinks = getViewportLinks();
    
    // Send initial links
    chrome.runtime.sendMessage({ 
        type: 'linksUpdate',
        links: currentLinks 
    });

    // Throttled scroll handler
    const handleScroll = throttle(() => {
        const newLinks = getViewportLinks();
        
        // Send update only if links have changed
        if (JSON.stringify(currentLinks) !== JSON.stringify(newLinks)) {
            currentLinks = newLinks;
            chrome.runtime.sendMessage({ 
                type: 'linksUpdate',
                links: newLinks 
            });
        }
    }, 150); // Update at most every 150ms

    // Add scroll event listener
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Optional: Also listen for window resize
    window.addEventListener('resize', handleScroll, { passive: true });

    // Cleanup function
    return () => {
        window.removeEventListener('scroll', handleScroll);
        window.removeEventListener('resize', handleScroll);
    };
}

// Initialize the tracking
function initializeLinkTracking() {
    // Choose one of the two approaches:
    const cleanup = setupScrollListener();
    // OR
    // const cleanup = setupLinkObserver();

    // Cleanup when the content script is unloaded
    window.addEventListener('unload', cleanup);
}

// Start tracking
initializeLinkTracking();