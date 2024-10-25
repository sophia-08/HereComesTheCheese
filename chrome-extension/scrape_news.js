function scrapeNews() {
    const articles = [];
    const hostname = window.location.hostname;
    console.log("Scraping news from:", hostname);

    if (hostname.includes('news.yahoo.com')) {
        const articleElements = document.querySelectorAll('li[class*="stream-item"]');
        
        articleElements.forEach(article => {
            // Log the entire article content to inspect structure
            console.log("Yahoo Article content:", article.textContent);
            console.log("Yahoo Article HTML:", article.innerHTML);
            
            articles.push({
                content: article.textContent.trim(),
                html: article.innerHTML,
                source: 'Yahoo News'
            });
        });
    } 
    else if (hostname.includes('news.google.com')) {
        const articleElements = document.querySelectorAll('article');
        
        articleElements.forEach(article => {
            console.log("Google Article content:", article.textContent);
            console.log("Google Article HTML:", article.innerHTML);
            
            articles.push({
                content: article.textContent.trim(),
                html: article.innerHTML,
                source: 'Google News'
            });
        });
    }

    console.log("Scraped articles:", articles.length);
    return {
        articles: articles,
        source: hostname,
        timestamp: new Date().toISOString()
    };
}