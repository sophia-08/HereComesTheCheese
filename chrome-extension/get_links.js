// content-script.js

// processedSet = new Set();
// const visibleLinks = [];
// count=1;
// Main function to get viewport links (remains the same)
function getViewportLinks() {
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    const links = document.getElementsByTagName('a');


    for (let link of links) {
        // if (processedSet.has(link.href)) {
        //     continue;
        // }

        // text = link.innerText;
        // if (text.trim().length == 0) continue;
        // processedSet.add(link.href);
        // link.innerText=  `[${count}] ${text}`;
        // count += 1;
        if (isElementSufficientlyVisible(link, 0.3) && isElementVisible(link)) {
            const rect = link.getBoundingClientRect();
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

    visibleLinks.sort((a, b) => {
        if (Math.abs(a.position.top - b.position.top) > 10) {
            return a.position.top - b.position.top;
        }
        return a.position.left - b.position.left;
    });

    return visibleLinks.map(({ text, url }) => ({ text, url }));
}

// Helper functions (remain the same)
function isElementSufficientlyVisible(element, threshold = 0.3) {
    const rect = element.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;

    const visibleWidth = Math.min(rect.right, viewportWidth) - Math.max(rect.left, 0);
    const visibleHeight = Math.min(rect.bottom, viewportHeight) - Math.max(rect.top, 0);

    const totalArea = rect.width * rect.height;
    const visibleArea = visibleWidth * visibleHeight;
    const visibilityRatio = visibleArea / totalArea;

    // return true;
    return visibilityRatio >= threshold;
}

function isElementVisible(element) {
    const style = window.getComputedStyle(element);
    return style.display !== 'none' &&
           style.visibility !== 'hidden' &&
           style.opacity !== '0';
}

function getLinkText(link) {
    let text = link.textContent.trim();
    
    if (!text) {
        const images = link.getElementsByTagName('img');
        for (let img of images) {
            if (img.alt) {
                text = img.alt.trim();
                break;
            }
        }
    }
    
    if (!text) {
        text = link.getAttribute('aria-label') || '';
    }
    
    if (!text) {
        text = link.href;
    }
    
    return text;
}

// New Intersection Observer setup
function setupLinkObserver() {
    let currentLinks = [];
    let updateTimeout = null;

    // Create intersection observer
    const observer = new IntersectionObserver((entries) => {
        // Clear existing timeout
        if (updateTimeout) {
            clearTimeout(updateTimeout);
        }

        // Set a new timeout to update links
        updateTimeout = setTimeout(() => {
            const newLinks = getViewportLinks();
            
            if (JSON.stringify(currentLinks) !== JSON.stringify(newLinks)) {
                currentLinks = newLinks;
                chrome.runtime.sendMessage({ 
                    type: 'linksUpdate',
                    links: newLinks 
                });
            }
        }, 100); // Small delay to batch multiple intersection changes
    }, {
        threshold: [0.3], // Trigger when 30% visible
        root: null, // Use viewport as root
    });

    // Function to observe all links
    function observeAllLinks() {
        // Disconnect existing observations
        observer.disconnect();
        
        // Observe all links
        const links = document.getElementsByTagName('a');
        for (let link of links) {
            observer.observe(link);
        }

        // Send initial links update
        const initialLinks = getViewportLinks();
        chrome.runtime.sendMessage({ 
            type: 'linksUpdate',
            links: initialLinks 
        });
    }

    // Watch for DOM changes to observe new links
    const mutationObserver = new MutationObserver((mutations) => {
        observeAllLinks();
    });

    mutationObserver.observe(document.body, {
        childList: true,
        subtree: true
    });

    // Initial observation
    observeAllLinks();

    // Also handle resize events
    const handleResize = () => {
        if (updateTimeout) {
            clearTimeout(updateTimeout);
        }
        updateTimeout = setTimeout(() => {
            const newLinks = getViewportLinks();
            if (JSON.stringify(currentLinks) !== JSON.stringify(newLinks)) {
                currentLinks = newLinks;
                chrome.runtime.sendMessage({ 
                    type: 'linksUpdate',
                    links: newLinks 
                });
            }
        }, 100);
    };

    window.addEventListener('resize', handleResize, { passive: true });

    // Cleanup function
    return () => {
        observer.disconnect();
        mutationObserver.disconnect();
        window.removeEventListener('resize', handleResize);
        if (updateTimeout) {
            clearTimeout(updateTimeout);
        }
    };
}

// Initialize tracking
function initializeLinkTracking() {
    const cleanup = setupLinkObserver();
    window.addEventListener('unload', cleanup);
}

// Start tracking
initializeLinkTracking();