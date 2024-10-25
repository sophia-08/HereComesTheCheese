function grabHeadlines() {
    const headlines = [];
    console.log('Starting grabHeadlines function');

    if (window.location.hostname.includes('yahoo.com')) {
        console.log('Detected Yahoo News site');

        // Method 1: Find all links that might be headlines (including the main headline)
        const headlineLinks = document.querySelectorAll('a[class*="ntk-link"], a[data-test-locator="lead-content-link"]');
        console.log('Found headline links:', headlineLinks.length);

        headlineLinks.forEach((link, index) => {
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

        // Method 2: Find all h3 elements (for other articles)
        const articles = document.querySelectorAll('h3');
        console.log('Found h3 elements:', articles.length);

        articles.forEach((article, index) => {
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

        // Method 1: Find articles with gPFEn class
        const articles = document.querySelectorAll('article');
        console.log('Found articles:', articles.length);

        articles.forEach((article, index) => {
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
                    // For this format, we need to find the title from a different element
                    const titleElement = article.querySelector('h3, h4');
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
                    }
                } else {
                    console.log('No title link found in this article');
                }
            }

            console.groupEnd();
        });
    }



    console.log('Final headlines array:', headlines);
    return headlines;
}