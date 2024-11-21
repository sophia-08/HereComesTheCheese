/**
 * LinkVisualizer class handles the visual representation of links on the webpage
 * Provides different styles for visualizing numbered links
 */
class LinkVisualizer {
    // Static object containing different visualization methods
    static visualizationStyles = {
        // 1. Minimal Overlay style - adds a small circular number overlay
        minimal(link, index) {
            const overlay = document.createElement('span');
            // Set CSS styles for circular overlay
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

        // 2. Colorful Badge style - adds colored border and background effects
        colorful(link, index) {
            // Array of colors for rotation
            const colors = [
                '#3498db', '#2ecc71', '#e74c3c', 
                '#f39c12', '#9b59b6', '#1abc9c'
            ];
            const color = colors[index % colors.length];
            
            // Apply styles to link
            link.style.cssText += `
                position: relative;
                padding-left: 25px;
                border-left: 4px solid ${color};
                transition: background-color 0.3s ease;
            `;
            link.setAttribute('data-link-index', index);
            link.title = `Link #${index}`;
        },

        // 3. Tooltip style - adds hoverable tooltip with link number
        tooltip(link, index) {
            link.setAttribute('data-link-index', index);
            link.style.position = 'relative';
            link.style.cursor = 'help';
            
            // Create tooltip element
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
            
            // Add hover event listeners
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

        // 4. Highlight with Number style - adds numbered badge inline with link text
        highlight(link, index) {
            // Create number badge
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

    /**
     * Applies the specified visualization style to a link
     * @param {HTMLElement} link - The link element to style
     * @param {number} index - The link's index number
     * @param {string} style - The visualization style to apply
     */
    static applyVisualization(link, index, style = 'highlight') {
        // Check if link was already processed
        if (link.getAttribute('data-link-index')) {
            return;
        }

        // Apply the chosen visualization style
        const visualizationMethod = this.visualizationStyles[style];
        if (visualizationMethod) {
            visualizationMethod(link, index);
        }
    }
}

/**
 * LinkExtractor class handles finding, processing, and managing links on the webpage
 */
class LinkExtractor {
    constructor() {
        // Initialize properties
        this.processedLinks = new Set(); // Track processed links to avoid duplicates
        this.linkCount = 0;
        this.observer = null;
        
        // Store link information
        this.linkCollection = {
            links: [], // Array of link objects
            timestamp: Date.now(),
            pageUrl: window.location.href,
            pageTitle: document.title
        };

        // Setup functionality
        this.setupMessageListener();
        this.setupObserver();
        this.initialScan();
    }

    /**
     * Sets up message listener for communication with background script
     */
    setupMessageListener() {
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            console.log('Received message:', message);
            
            if (typeof message === 'object' && message !== null) {
                // Handle different message actions
                switch (message.action) {
                    case 'NAVIGATE_TO_LINK':
                        // Handle link navigation
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
                        // Return all links
                        sendResponse({
                            success: true,
                            data: this.linkCollection
                        });
                        break;

                    case 'GET_LINK_INFO':
                        // Return specific link info
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
            
            return true; // Keep message channel open for async response
        });
    }

    /**
     * Navigates to a specific link by index
     * @param {number} index - The index of the link to navigate to
     * @returns {Object} Result of navigation attempt
     */
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
            
            // Try URL navigation first
            if (link.url && (link.url.startsWith('http') || link.url.startsWith('/'))) {
                window.location.href = link.url;
                return {
                    success: true,
                    data: {
                        url: link.url,
                        method: 'location'
                    }
                };
            } 
            // Fall back to click() method
            else if (link.element && link.element.click) {
                link.element.click();
                return {
                    success: true,
                    data: {
                        url: link.url,
                        method: 'click'
                    }
                };
            } 
            // Navigation not possible
            else {
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

    /**
     * Sets up MutationObserver to watch for DOM changes
     */
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

        // Start observing the document body
        this.observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    /**
     * Processes a single link element
     * @param {HTMLElement} link - The link element to process
     * @returns {boolean} Whether the link was processed successfully
     */
    processLink(link) {
        // Skip if already processed
        if (this.processedLinks.has(link)) {
            return false;
        }

        const textContent = link.textContent.trim();
        const ariaLabel = link.getAttribute('aria-label');
        const title = link.getAttribute('title');

        // Only process links with content
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

            // Store reference to DOM element
            linkInfo.element = link;

            return true;
        }

        return false;
    }

    /**
     * Determines the type of link element
     * @param {HTMLElement} link - The link element
     * @returns {string} The type of link
     */
    getLinkType(link) {
        if (link.tagName === 'A') return 'anchor';
        if (link.getAttribute('role') === 'link') return 'aria-link';
        if (link.hasAttribute('data-href')) return 'data-href';
        if ((link.getAttribute('onclick') || '').includes('location.href')) return 'onclick';
        return 'other';
    }

    /**
     * Gets the CSS selector path to an element
     * @param {HTMLElement} element - The element to get the path for
     * @returns {string} The CSS selector path
     */
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

    /**
     * Processes a new element and its children for links
     * @param {HTMLElement} element - The element to process
     */
    processNewElement(element) {
        if (this.isLinkElement(element)) {
            this.processLink(element);
        }

        const linkElements = this.findLinkElements(element);
        linkElements.forEach(link => this.processLink(link));
    }

    /**
     * Checks if an element is a link
     * @param {HTMLElement} element - The element to check
     * @returns {boolean} Whether the element is a link
     */
    isLinkElement(element) {
        return (
            element.tagName === 'A' ||
            element.getAttribute('role') === 'link' ||
            element.hasAttribute('data-href') ||
            (element.getAttribute('onclick') || '').includes('location.href')
        );
    }

    /**
     * Finds all link elements within an element
     * @param {HTMLElement} element - The element to search within
     * @returns {Array} Array of link elements
     */
    findLinkElements(element) {
        return [
            ...element.getElementsByTagName('a'),
            ...element.querySelectorAll('[role="link"]'),
            ...element.querySelectorAll('[data-href]'),
            ...element.querySelectorAll('[onclick*="location.href"]')
        ];
    }

    /**
     * Performs initial scan of the page for links
     */
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

    /**
     * Disconnects the MutationObserver
     */
    disconnect() {
        if (this.observer) {
            this.observer.disconnect();
            console.log('Link extractor disconnected. Total links found:', this.linkCount);
        }
    }

    // Utility methods for accessing stored links
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

    /**
     * Exports link collection to JSON format
     * @returns {string} JSON string of link collection
     */
    exportToJSON() {
        return JSON.stringify(this.linkCollection, (key, value) => {
            // Skip DOM element references when stringifying
            if (key === 'element') return undefined;
            return value;
        }, 2);
    }

    /**
     * Exports link collection to CSV format
     * @returns {string} CSV string of link collection
     */
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

// Initialize the link extractor
const linkExtractor = new LinkExtractor();