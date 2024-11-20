class LinkVisualizer {
    static visualizationStyles = {
        // 1. Minimal Overlay
        minimal(link, index) {
            // link.style.position = 'relative';
            const overlay = document.createElement('span');
            overlay.style.cssText = `
                position: absolute;
                top: -5px;
                left: -25px;
                background-color: rgba(52, 152, 219, 0.8);
                color: white;
                border-radius: 50%;
                width: 20px;
                height: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 12px;
                font-weight: bold;
                z-index: 1000;
            `;
            overlay.textContent = index;
            link.parentNode.insertBefore(overlay, link);
        },

        // 2. Colorful Badge
        colorful(link, index) {
            const colors = [
                '#3498db', '#2ecc71', '#e74c3c', 
                '#f39c12', '#9b59b6', '#1abc9c'
            ];
            const color = colors[index % colors.length];
            
            link.style.cssText += `
                position: relative;
                padding-left: 25px;
                border-left: 4px solid ${color};
                transition: background-color 0.3s ease;
            `;
            link.setAttribute('data-link-index', index);
            link.title = `Link #${index}`;
        },

        // 3. Tooltip Style
        tooltip(link, index) {
            link.setAttribute('data-link-index', index);
            link.style.position = 'relative';
            link.style.cursor = 'help';
            
            const tooltip = document.createElement('span');
            tooltip.style.cssText = `
                visibility: hidden;
                position: absolute;
                bottom: 100%;
                left: 50%;
                transform: translateX(-50%);
                background-color: rgba(0,0,0,0.8);
                color: white;
                padding: 3px 8px;
                border-radius: 3px;
                font-size: 12px;
                opacity: 0;
                transition: opacity 0.3s;
                z-index: 1000;
            `;
            tooltip.textContent = `Link #${index}`;
            
            link.addEventListener('mouseenter', () => {
                tooltip.style.visibility = 'visible';
                tooltip.style.opacity = '1';
            });
            
            link.addEventListener('mouseleave', () => {
                tooltip.style.visibility = 'hidden';
                tooltip.style.opacity = '0';
            });
            
            link.appendChild(tooltip);
        },

        // 4. Highlight with Number
        highlight(link, index) {
            const originalBg = link.style.backgroundColor;
            const originalColor = link.style.color;
            
            // link.style.transition = 'all 0.3s ease';
            // link.style.backgroundColor = 'rgba(52, 152, 219, 0.1)';
            // link.style.borderBottom = '2px dotted #3498db';
            
            const numberSpan = document.createElement('span');
            numberSpan.style.cssText = `
                background-color: #3498db;
                color: white;
                border-radius: 3px;
                padding: 1px 4px;
                margin-right: 5px;
                font-size: 0.7em;
                vertical-align: super;
            `;
            numberSpan.textContent = index;
            
            link.insertAdjacentElement('afterbegin', numberSpan);
        }
    };

    static applyVisualization(link, index, style = 'highlight') {
        // Remove any previous numbering
        if (link.getAttribute('data-link-index')) {
            return; // Already processed
        }

        // Apply the chosen visualization style
        const visualizationMethod = this.visualizationStyles[style];
        if (visualizationMethod) {
            visualizationMethod(link, index);
        }
    }
}

// Key improvements in this version:

// Immediate Processing:

// Scans for links as soon as the DOM is loaded
// Doesn't wait for any timeout period
// Processes existing links immediately


// Progressive Updates:

// Processes new links as they're added to the DOM
// Keeps track of already processed links to avoid duplicates
// Updates numbering sequentially as new links are found


// Efficient Processing:

// Only processes new elements and their children
// Maintains a Set of processed links to avoid duplicates
// No need to re-scan the entire page when new content is added


// Better Organization:

// Class-based structure for better state management
// Clear separation of responsibilities
// Easy to extend with new features

class LinkExtractor {
    constructor() {
        this.processedLinks = new Set(); // Track processed links
        this.linkCount = 0;
        this.observer = null;
        
        // Store link information
        this.linkCollection = {
            links: [], // Array of link objects
            timestamp: Date.now(),
            pageUrl: window.location.href,
            pageTitle: document.title
        };

        this.setupMessageListener();
        this.setupObserver();
        this.initialScan();
    }

    setupMessageListener() {
        // Listen for messages from background script
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            console.log('Received message:', message);
            
            if (typeof message === 'object' && message !== null) {
                switch (message.action) {
                    case 'NAVIGATE_TO_LINK':
                        if (typeof message.linkIndex === 'number') {
                            const result = this.navigateToLink(message.linkIndex);
                            sendResponse(result);
                        } else {
                            sendResponse({ 
                                success: false, 
                                error: 'Invalid link index' 
                            });
                        }
                        break;

                    case 'GET_LINKS':
                        sendResponse({
                            success: true,
                            data: this.linkCollection
                        });
                        break;

                    case 'GET_LINK_INFO':
                        if (typeof message.linkIndex === 'number') {
                            const link = this.getLinkById(message.linkIndex);
                            sendResponse({
                                success: !!link,
                                data: link || null,
                                error: link ? null : 'Link not found'
                            });
                        } else {
                            sendResponse({ 
                                success: false, 
                                error: 'Invalid link index' 
                            });
                        }
                        break;

                    default:
                        sendResponse({ 
                            success: false, 
                            error: 'Unknown action' 
                        });
                }
            } else {
                sendResponse({ 
                    success: false, 
                    error: 'Invalid message format' 
                });
            }
            
            return true; // Keep the message channel open for async response
        });
    }

    navigateToLink(index) {
        const link = this.getLinkById(index);
        if (!link) {
            return {
                success: false,
                error: `Link with index ${index} not found`
            };
        }

        try {
            console.log(`Navigating to link [${index}]:`, link.url);
            
            // Check if it's a valid URL
            if (link.url && (link.url.startsWith('http') || link.url.startsWith('/'))) {
                window.location.href = link.url;
                return {
                    success: true,
                    data: {
                        url: link.url,
                        method: 'location'
                    }
                };
            } else if (link.element && link.element.click) {
                // Try clicking the element if URL is invalid
                console.log(`Attempting to click element for link [${index}]`);
                link.element.click();
                return {
                    success: true,
                    data: {
                        url: link.url,
                        method: 'click'
                    }
                };
            } else {
                return {
                    success: false,
                    error: 'Unable to navigate: Invalid URL and no clickable element'
                };
            }
        } catch (error) {
            return {
                success: false,
                error: `Navigation failed: ${error.message}`
            };
        }
    }

    setupObserver() {
        this.observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                if (mutation.addedNodes.length) {
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            this.processNewElement(node);
                        }
                    });
                }
            }
        });

        this.observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    processLink(link) {
        if (this.processedLinks.has(link)) {
            return false;
        }

        const textContent = link.textContent.trim();
        const ariaLabel = link.getAttribute('aria-label');
        const title = link.getAttribute('title');

        if (textContent.length > 0 || ariaLabel || title) {
            this.linkCount++;
            const originalText = link.textContent;
            
            // Store link information
            const linkInfo = {
                id: this.linkCount,
                text: originalText,
                url: link.href || link.getAttribute('data-href'),
                title: title || '',
                ariaLabel: ariaLabel || '',
                timestamp: Date.now(),
                type: this.getLinkType(link),
                metadata: {
                    classList: Array.from(link.classList),
                    path: this.getElementPath(link),
                    position: link.getBoundingClientRect()
                }
            };

            this.linkCollection.links.push(linkInfo);
            this.processedLinks.add(link);
            
            // Highlight and number the link
            // link.style.backgroundColor = 'yellow';
            // link.textContent = `[${this.linkCount}] ${originalText}`;

            // Apply visualization
            LinkVisualizer.applyVisualization(link, this.linkCount, 'highlight');

            // Store reference to DOM element (optional)
            linkInfo.element = link;

            return true;
        }

        return false;
    }

    getLinkType(link) {
        if (link.tagName === 'A') return 'anchor';
        if (link.getAttribute('role') === 'link') return 'aria-link';
        if (link.hasAttribute('data-href')) return 'data-href';
        if ((link.getAttribute('onclick') || '').includes('location.href')) return 'onclick';
        return 'other';
    }

    getElementPath(element) {
        const path = [];
        while (element && element.nodeType === Node.ELEMENT_NODE) {
            let selector = element.nodeName.toLowerCase();
            if (element.id) {
                selector += `#${element.id}`;
            } else {
                let sibling = element;
                let nth = 1;
                while (sibling = sibling.previousElementSibling) {
                    if (sibling.nodeName.toLowerCase() === selector) nth++;
                }
                if (nth !== 1) selector += `:nth-of-type(${nth})`;
            }
            path.unshift(selector);
            element = element.parentNode;
        }
        return path.join(' > ');
    }

    processNewElement(element) {
        if (this.isLinkElement(element)) {
            this.processLink(element);
        }

        const linkElements = this.findLinkElements(element);
        linkElements.forEach(link => this.processLink(link));
    }

    isLinkElement(element) {
        return (
            element.tagName === 'A' ||
            element.getAttribute('role') === 'link' ||
            element.hasAttribute('data-href') ||
            (element.getAttribute('onclick') || '').includes('location.href')
        );
    }

    findLinkElements(element) {
        return [
            ...element.getElementsByTagName('a'),
            ...element.querySelectorAll('[role="link"]'),
            ...element.querySelectorAll('[data-href]'),
            ...element.querySelectorAll('[onclick*="location.href"]')
        ];
    }

    initialScan() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.processNewElement(document.body);
                console.log('Initial scan complete. Links found:', this.linkCount);
            });
        } else {
            this.processNewElement(document.body);
            console.log('Initial scan complete. Links found:', this.linkCount);
        }
    }

    disconnect() {
        if (this.observer) {
            this.observer.disconnect();
            console.log('Link extractor disconnected. Total links found:', this.linkCount);
        }
    }

    // Methods to access stored links
    getAllLinks() {
        return this.linkCollection;
    }

    getLinkById(id) {
        return this.linkCollection.links.find(link => link.id === id);
    }

    getLinksByText(searchText) {
        const searchLower = searchText.toLowerCase();
        return this.linkCollection.links.filter(link => 
            link.text.toLowerCase().includes(searchLower)
        );
    }

    // Export links to various formats
    exportToJSON() {
        return JSON.stringify(this.linkCollection, (key, value) => {
            // Skip DOM element references when stringifying
            if (key === 'element') return undefined;
            return value;
        }, 2);
    }

    exportToCSV() {
        const headers = ['id', 'text', 'url', 'type', 'title', 'ariaLabel'];
        const csv = [
            headers.join(','),
            ...this.linkCollection.links.map(link => 
                headers.map(header => 
                    JSON.stringify(link[header] || '')
                ).join(',')
            )
        ].join('\n');
        return csv;
    }
}

// Usage example:
const linkExtractor = new LinkExtractor();

// Access links later
// setTimeout(() => {
//     // Get all links
//     const allLinks = linkExtractor.getAllLinks();
//     console.log('Collected links:', allLinks);

//     // Export to JSON
//     const jsonExport = linkExtractor.exportToJSON();
//     console.log('JSON export:', jsonExport);

//     // Export to CSV
//     const csvExport = linkExtractor.exportToCSV();
//     console.log('CSV export:', csvExport);

//     // Find specific links
//     const searchResults = linkExtractor.getLinksByText('example');
//     console.log('Search results:', searchResults);
// }, 5000);

