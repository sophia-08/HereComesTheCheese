

function grabHeadlines() {
    const headlines = [];
    console.log('Starting grabHeadlines function');
  
    function isElementInViewport(element, partialVisible = true) {
      const rect = element.getBoundingClientRect();
      const windowHeight = window.innerHeight || document.documentElement.clientHeight;
      const windowWidth = window.innerWidth || document.documentElement.clientWidth;
  
      if (partialVisible) {
        // Element is partially visible if any part of it is in viewport
        const verticalVisible = (rect.top >= 0 && rect.top <= windowHeight) || 
                              (rect.bottom >= 0 && rect.bottom <= windowHeight) ||
                              (rect.top <= 0 && rect.bottom >= windowHeight);
        const horizontalVisible = (rect.left >= 0 && rect.left <= windowWidth) ||
                                (rect.right >= 0 && rect.right <= windowWidth) ||
                                (rect.left <= 0 && rect.right >= windowWidth);
        
        const isVisible = verticalVisible && horizontalVisible;
        console.log(`Element visibility check:`, {
          element: element.tagName,
          verticalVisible,
          horizontalVisible,
          isVisible,
          rect: {
            top: rect.top,
            bottom: rect.bottom,
            left: rect.left,
            right: rect.right
          }
        });
        return isVisible;
      } else {
        // Original fully visible check
        return (
          rect.top >= 0 &&
          rect.left >= 0 &&
          rect.bottom <= windowHeight &&
          rect.right <= windowWidth
        );
      }
    }
  
    if (window.location.hostname.includes('yahoo.com')) {
      console.log('Detected Yahoo News site');
  
      // Method 1: Find all links that might be headlines
      const headlineLinks = document.querySelectorAll('a[class*="ntk-link"], a[data-test-locator="lead-content-link"]');
      console.log('Found headline links:', headlineLinks.length);
  
      headlineLinks.forEach((link, index) => {
        if (!isElementInViewport(link)) {
          console.log(`Headline link ${index + 1} is not in viewport, skipping`);
          return;
        }
  
        console.group(`Processing headline link ${index + 1}`);
  
        let title = '';
        const h3Element = link.querySelector('h3');
  
        if (h3Element) {
          title = h3Element.textContent.trim();
          console.log('Found title in h3:', title);
        } else if (link.getAttribute('aria-label')) {
          title = link.getAttribute('aria-label').trim();
          console.log('Found title in aria-label:', title);
        }
  
        let url = link.href;
        if (!url.startsWith('http')) {
          url = 'https://news.yahoo.com' + url;
        }
  
        if (title && url) {
          console.log('Adding headline:', { title, url });
          headlines.push({
            title: title,
            url: url
          });
        }
  
        console.groupEnd();
      });
  
      // Method 3: Find filmstrip articles
      const filmstripLinks = document.querySelectorAll('.ntk-filmstrip .ntk-item a[data-test-locator="item-link"]');
      console.log('Found filmstrip links:', filmstripLinks.length);
  
      filmstripLinks.forEach((link, index) => {
        if (!isElementInViewport(link)) {
          console.log(`Filmstrip link ${index + 1} is not in viewport, skipping`);
          return;
        }
  
        console.group(`Processing filmstrip article ${index + 1}`);
        console.log('Link HTML:', link.outerHTML);
  
        const h3Element = link.querySelector('h3[data-test-locator="item-title"]');
        if (h3Element) {
          const title = h3Element.textContent.trim();
          let url = link.getAttribute('href');
          if (!url.startsWith('http')) {
            url = 'https://news.yahoo.com' + url;
          }
  
          console.log('Found filmstrip article:', { title, url });
          headlines.push({
            title: title,
            url: url
          });
        } else {
          console.log('No h3 found in this filmstrip item');
        }
  
        console.groupEnd();
      });
  
      // Method 2: Find all h3 elements
      const articles = document.querySelectorAll('h3');
      console.log('Found h3 elements:', articles.length);
  
      articles.forEach((article, index) => {
        if (!isElementInViewport(article)) {
          console.log(`H3 article ${index + 1} is not in viewport, skipping`);
          return;
        }
  
        console.group(`Processing h3 article ${index + 1}`);
        console.log('Article HTML:', article.outerHTML);
  
        const linkElement = article.querySelector('a');
        if (linkElement) {
          const title = linkElement.textContent.trim();
          let url = linkElement.href;
  
          if (!url.startsWith('http')) {
            url = 'https://news.yahoo.com' + url;
          }
  
          console.log('Found article:', { title, url });
          headlines.push({
            title: title,
            url: url
          });
        } else {
          console.log('No link found in this article');
        }
  
        console.groupEnd();
      });
    }
    else if (window.location.hostname.includes('news.google.com')) {
      console.log('Detected Google News site');
  
      const articles = document.querySelectorAll('article');
      console.log('Found articles:', articles.length);
  
      articles.forEach((article, index) => {
        if (!isElementInViewport(article)) {
          console.log(`Article ${index + 1} is not in viewport, skipping`);
          return;
        }
  
        console.group(`Processing article ${index + 1}`);
        console.log('Article HTML:', article.outerHTML);
  
        // Try first format (gPFEn)
        const titleLink = article.querySelector('a.gPFEn');
  
        if (titleLink) {
          const title = titleLink.textContent.trim();
          let url = titleLink.href;
  
          if (url.includes('./read/')) {
            url = 'https://news.google.com' + url;
          }
  
          console.log('Found article (format 1):', { title, url });
          headlines.push({
            title: title,
            url: url
          });
        }
        // Try second format (WwrzSb)
        else {
          const altTitleLink = article.querySelector('a.WwrzSb');
          if (altTitleLink) {
            // Look for title in the JtKRv link
            const titleElement = article.querySelector('a.JtKRv');
            if (titleElement) {
              const title = titleElement.textContent.trim();
              let url = altTitleLink.href;
  
              if (url.includes('./read/')) {
                url = 'https://news.google.com' + url;
              }
  
              console.log('Found article (format 2):', { title, url });
              headlines.push({
                title: title,
                url: url
              });
            } else {
              // Fallback to h3/h4 if JtKRv not found
              const headlineElement = article.querySelector('h3, h4');
              if (headlineElement) {
                const title = headlineElement.textContent.trim();
                let url = altTitleLink.href;
  
                if (url.includes('./read/')) {
                  url = 'https://news.google.com' + url;
                }
  
                console.log('Found article (fallback):', { title, url });
                headlines.push({
                  title: title,
                  url: url
                });
              }
            }
          }
        }
  
        console.groupEnd();
      });
    }
  
    console.log('Final headlines array:', headlines);
    return headlines;
  }
  
  const STOP_WORDS = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 
    'with', 'by', 'from', 'up', 'about', 'into', 'over', 'after', 'is', 'are', 
    'was', 'were', 'be', 'been', 'has', 'have', 'had', 'will', 'would', 'could', 
    'should', 'may', 'might', 'must', 'can'
  ]);
  
  // Levenshtein distance calculation
  function levenshteinDistance(str1, str2) {
    const m = str1.length;
    const n = str2.length;
    const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
  
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
  
  // Check if two words are similar enough
  function isSimilar(word1, word2, threshold = 0.8) {
    const distance = levenshteinDistance(word1, word2);
    const maxLength = Math.max(word1.length, word2.length);
    const similarity = 1 - (distance / maxLength);
    return {
        isSimilar: similarity >= threshold,
        similarity: similarity
    };
  }
  
  function filterHeadlines(headlines, searchInput) {
    console.group('FilterHeadlines Function');
    console.log('Input search terms:', searchInput);
    console.log('Total headlines to search:', headlines.length);
  
    const rawTerms = searchInput.toLowerCase().split(/[\s,]+/);
    console.log('Raw terms after split:', rawTerms);
  
    const searchTerms = rawTerms.filter(term => {
        const isStopWord = STOP_WORDS.has(term);
        const isTooShort = term.length <= 2;
        
        console.log(`Analyzing term "${term}":`, {
            isStopWord: isStopWord,
            isTooShort: isTooShort,
            willKeep: !isStopWord && !isTooShort
        });
  
        return !isStopWord && !isTooShort;
    });
  
    console.log('Meaningful search terms after filtering:', searchTerms);
    
    if (searchTerms.length === 0) {
        console.log('No meaningful search terms found, returning null');
        console.groupEnd();
        return null;
    }
  
    const scoredHeadlines = headlines.map(headline => {
        const title = headline.title.toLowerCase();
        console.group(`Checking headline: "${headline.title}"`);
        
        // Split title into words for better matching
        const titleWords = title.split(/[\s,.-]+/);
        
        // Check each search term against title words
        const termMatches = searchTerms.map(term => {
            let bestMatch = {
                found: false,
                similarity: 0,
                matchedWord: ''
            };
  
            // Check term against each word in title
            titleWords.forEach(titleWord => {
                const match = isSimilar(term, titleWord);
                if (match.isSimilar && match.similarity > bestMatch.similarity) {
                    bestMatch = {
                        found: true,
                        similarity: match.similarity,
                        matchedWord: titleWord
                    };
                }
            });
  
            console.log(`Checking term "${term}":`, {
                term: term,
                found: bestMatch.found,
                similarity: bestMatch.similarity.toFixed(3),
                matchedWord: bestMatch.matchedWord
            });
  
            return bestMatch.found;
        });
  
        const matchCount = termMatches.filter(match => match).length;
        const matchPercentage = (matchCount / searchTerms.length) * 100;
  
        console.log(`Headline score:`, {
            title: headline.title,
            matchedTerms: matchCount,
            totalTerms: searchTerms.length,
            percentage: matchPercentage.toFixed(2) + '%'
        });
        console.groupEnd();
  
        return {
            headline: headline,
            matchPercentage: matchPercentage,
            matchedTerms: matchCount,
            totalTerms: searchTerms.length
        };
    });
  
    const sortedResults = scoredHeadlines.sort((a, b) => b.matchPercentage - a.matchPercentage);
    const bestMatch = sortedResults[0];
  
    console.log('filterHeadlines,  Best match found:', {
        title: bestMatch.headline.title,
        matchPercentage: bestMatch.matchPercentage.toFixed(2) + '%',
        matchedTerms: bestMatch.matchedTerms,
        totalTerms: bestMatch.totalTerms
    });
  
    console.groupEnd();
    return bestMatch;
  }
  
  // const headlines = [
  //   { title: "California governor announces new policy", url: "..." },
  //   { title: "Calif. faces drought concerns", url: "..." },
  //   { title: "New kalifornia regulations", url: "..." },
  //   { title: "Government spending increases", url: "..." },
  //   { title: "Govt review process", url: "..." }
  // ];
  
  // // Single term
  // console.log(filterHeadlines(headlines, "california"));
  
  // // Multiple terms
  // console.log(filterHeadlines(headlines, "california government"));
  
  // // With typos
  // console.log(filterHeadlines(headlines, "kalifornia"));
  
  function openArticle(headlines, searchInput) {
    console.group('Opening Article');
    console.log('Headlines:', headlines);
    console.log('Search input:', searchInput);
  
    // Use your existing filterHeadlines function to find the best match
    const bestMatch = filterHeadlines(headlines, searchInput);
    
    if (bestMatch && bestMatch.headline ) {
        console.log('openArticle, Best match found:', bestMatch);
        window.location.href = bestMatch.headline.url;
        
        // Navigate the current tab to the article URL
        // chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        //     const currentTab = tabs[0];
        //     console.log('Navigating current tab to:', bestMatch.headline.url);
            
        //     chrome.tabs.update(currentTab.id, {
        //         url: bestMatch.headline.url
        //     });
        // });
    } else {
        console.log('No matching article found');
        // Optionally show a message to the user
        // alert('No matching article found');
    }
    
    console.groupEnd();
  }
  