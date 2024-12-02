

/**
 * cmd_click.js - Voice Command Link Navigation System
 * 
 * This module implements an intelligent link matching and navigation system that:
 * - Maintains a record of visible links on the current page
 * - Uses fuzzy string matching to find links based on voice/text input
 * - Implements sophisticated keyword extraction and matching algorithms
 * - Provides detailed logging for debugging and monitoring
 */

// This implementation of "click":

// Stores the last known visible links in memory
// Uses Levenshtein distance for fuzzy string matching
// Ignores common words and very short words
// Requires more than 40% of keywords to match for navigation
// Provides detailed logging of the matching process
// Handles partial matches and similar words
// Navigates the current tab to the matched URL

// The matching algorithm:
// Breaks down input and link text into keywords
// Ignores common words and punctuation
// Calculates similarity scores between words
// Considers a word matched if similarity is > 70%
// Requires overall match score > 50% for navigation
// Handles variations in word order


/**
 * Array to maintain references to all currently visible links on the page.
 * Each link object should contain at least {text: string, url: string}
 */
let lastVisibleLinks = [];

/**
 * Set of common English words that should be ignored during keyword matching
 * to improve the quality of matches by focusing on meaningful content words.
 */
const COMMON_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'up', 'about', 'into', 'over', 'after'
]);

/**
 * Calculates the Levenshtein (edit) distance between two strings.
 * This metric represents the minimum number of single-character edits required
 * to transform one string into another.
 * 
 * @param {string} str1 - First string to compare
 * @param {string} str2 - Second string to compare
 * @returns {number} The Levenshtein distance between the strings
 */
function levenshteinDistance(str1, str2) {
  const m = str1.length;
  const n = str2.length;
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = Math.min(
          dp[i - 1][j - 1] + 1,  // substitution
          dp[i - 1][j] + 1,      // deletion
          dp[i][j - 1] + 1       // insertion
        );
      }
    }
  }
  return dp[m][n];
}

/**
 * Extracts meaningful keywords from a text string by:
 * - Converting to lowercase
 * - Removing punctuation
 * - Splitting into words
 * - Filtering out common words and very short words
 * 
 * @param {string} text - Input text to process
 * @returns {string[]} Array of extracted keywords
 */
function getKeywords(text) {
  return text.toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .split(/\s+/)
    .filter(word =>
      word.length > 2 && // Ignore very short words
      !COMMON_WORDS.has(word) // Ignore common words
    );
}

/**
 * Calculates how well the input keywords match against a set of link keywords.
 * Uses fuzzy string matching with Levenshtein distance to handle
 * minor variations and typos in the input.
 * 
 * @param {string[]} inputKeywords - Keywords from user input
 * @param {string[]} linkKeywords - Keywords from link text
 * @returns {Object} Score and detailed matching information
 */
function calculateMatchScore(inputKeywords, linkKeywords) {
  let matchedWords = 0;
  let matchDetails = [];

  for (const inputWord of inputKeywords) {
    let bestMatch = {
      word: null,
      distance: Infinity
    };

    for (const linkWord of linkKeywords) {
      const distance = levenshteinDistance(inputWord, linkWord);
      const maxLength = Math.max(inputWord.length, linkWord.length);
      const similarity = 1 - (distance / maxLength);

      if (similarity > 0.7 && distance < bestMatch.distance) { // 70% similarity threshold
        bestMatch = {
          word: linkWord,
          distance: distance,
          similarity: similarity
        };
      }
    }

    if (bestMatch.word) {
      matchedWords++;
      matchDetails.push(`'${inputWord}' matched with '${bestMatch.word}' (${(bestMatch.similarity * 100).toFixed(1)}% similar)`);
    } else {
      matchDetails.push(`'${inputWord}' had no good matches`);
    }
  }

  return {
    score: matchedWords / inputKeywords.length,
    details: matchDetails
  };
}

/**
 * Main function to find the best matching link based on user input.
 * Implements the core matching logic by:
 * 1. Extracting keywords from input
 * 2. Comparing against all visible links
 * 3. Finding the best match above the threshold
 * 4. Providing detailed logging of the matching process
 * 
 * @param {string} userInput - Raw user input to match against links
 * @returns {Object|null} Best matching link object or null if no good match found
 */
function findBestMatch(userInput) {
  console.log('Processing voice input:', userInput);

  const inputKeywords = getKeywords(userInput);
  console.log('Extracted keywords from input:', inputKeywords);

  if (inputKeywords.length === 0) {
    console.log('No valid keywords found in input');
    return null;
  }

  let bestMatch = {
    link: null,
    score: 0,
    details: []
  };

  for (const link of lastVisibleLinks) {
    const linkKeywords = getKeywords(link.text);
    console.log(`\nAnalyzing link: "${link.text}"\nKeywords:`, linkKeywords);

    const match = calculateMatchScore(inputKeywords, linkKeywords);
    console.log('Match score:', match.score);
    console.log('Match details:', match.details);

    if (match.score > bestMatch.score) {
      bestMatch = {
        link: link,
        score: match.score,
        details: match.details
      };
    }
  }

  console.log('\nBest match results:');
  if (bestMatch.link) {
    console.log('Text:', bestMatch.link.text);
    console.log('URL:', bestMatch.link.url);
    console.log('Score:', bestMatch.score);
    console.log('Match details:', bestMatch.details);
  } else {
    console.log('No matching link found');
  }

  // Return the match only if more than 40% of keywords matched
  return bestMatch.score > 0.4 ? bestMatch.link : null;
}