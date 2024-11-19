(function () {
    class YouTubeAutoPlayer {
      constructor() {
        this.DEBUG = true;
        this.SUPPORTED_DOMAINS = ["youtube.com", "music.youtube.com"];
        this.PLATFORM = {
          YOUTUBE: "youtube",
          YOUTUBE_MUSIC: "youtube_music",
          UNSUPPORTED: "unsupported",
        };
  
        this.SELECTORS = {
          [this.PLATFORM.YOUTUBE]: {
            searchResults: "a#video-title",
            isValidResult: (link) => link.href.includes("/watch?v="),
          },
          [this.PLATFORM.YOUTUBE_MUSIC]: {
            songResults: "ytmusic-responsive-list-item-renderer",
            videoResults: "ytmusic-video-renderer",
            playlistResults: "ytmusic-playlist-renderer",
            channelSongResults: "#contents ytmusic-responsive-list-item-renderer",
            channelShuffleButton:
              'ytmusic-play-button-renderer[data-tooltip="Shuffle"]',
            channelPlayButton:
              'ytmusic-play-button-renderer[data-tooltip="Play"]',
            playButton: "ytmusic-play-button-renderer",
            titleLink: "a.yt-simple-endpoint",
          },
        };
  
        const platform = this.getCurrentPlatform();
        if (platform !== this.PLATFORM.UNSUPPORTED) {
          this.debugLog("Supported platform detected:", platform);
          this.initWhenReady();
        } else {
          this.debugLog("Unsupported domain, extension inactive");
        }
      }
  
      initWhenReady() {
        if (
          document.readyState === "interactive" ||
          document.readyState === "complete"
        ) {
          this.init();
        } else {
          document.addEventListener("DOMContentLoaded", () => this.init(), {
            once: true,
          });
        }
      }
  
      debugLog(message, data = null) {
        if (!this.DEBUG) return;
        // const timestamp = new Date().toISOString();
        // const logStyle = 'background: #f0f0f0; color: #333; padding: 2px 5px; border-radius: 3px;';
  
        // if (data) {
        //   console.log(`%c[YouTube Autoplay ${timestamp}] ${message}`, logStyle, data);
        // } else {
        //   console.log(`%c[YouTube Autoplay ${timestamp}] ${message}`, logStyle);
        // }
  
        if (data) {
          console.log("youtube plugin: ", message, data);
        } else {
          console.log("youtube plugin: ", message);
        }
      }
  
      getCurrentPlatform() {
        const currentDomain = window.location.hostname;
  
        if (
          !this.SUPPORTED_DOMAINS.some((domain) => currentDomain.includes(domain))
        ) {
          return this.PLATFORM.UNSUPPORTED;
        }
  
        return currentDomain === "music.youtube.com"
          ? this.PLATFORM.YOUTUBE_MUSIC
          : this.PLATFORM.YOUTUBE;
      }
  
      isSearchPage() {
        const platform = this.getCurrentPlatform();
  
        if (platform === this.PLATFORM.UNSUPPORTED) return false;
  
        const isSearch =
          platform === this.PLATFORM.YOUTUBE
            ? window.location.pathname === "/results" &&
              window.location.search.includes("search_query")
            : window.location.pathname.includes("/search") ||
              window.location.search.includes("q=") ||
              window.location.pathname.includes("/channel");
  
        this.debugLog(`Checking if search/channel page: ${isSearch}`, {
          platform,
          pathname: window.location.pathname,
          search: window.location.search,
        });
  
        return isSearch;
      }
  
      getResultsInfo() {
        const platform = this.getCurrentPlatform();
        if (platform === this.PLATFORM.UNSUPPORTED) return null;
  
        this.debugLog(`Getting results info for platform: ${platform}`);
  
        if (platform === this.PLATFORM.YOUTUBE) {
          const videoLinks = document.querySelectorAll(
            this.SELECTORS[platform].searchResults
          );
          return {
            videos: {
              count: videoLinks.length,
              firstTitle: videoLinks[0]?.textContent || "N/A",
            },
          };
        } else {
          const selectors = this.SELECTORS[platform];
          const songResults = document.querySelectorAll(selectors.songResults);
          const videoResults = document.querySelectorAll(selectors.videoResults);
          const playlistResults = document.querySelectorAll(
            selectors.playlistResults
          );
          const channelSongs = document.querySelectorAll(
            selectors.channelSongResults
          );
  
          return {
            songs: {
              count: songResults.length,
              firstTitle:
                songResults[0]?.querySelector(selectors.titleLink)?.textContent ||
                "N/A",
            },
            videos: {
              count: videoResults.length,
              firstTitle:
                videoResults[0]?.querySelector(selectors.titleLink)
                  ?.textContent || "N/A",
            },
            playlists: {
              count: playlistResults.length,
              firstTitle:
                playlistResults[0]?.querySelector(selectors.titleLink)
                  ?.textContent || "N/A",
            },
            channelSongs: {
              count: channelSongs.length,
              firstTitle:
                channelSongs[0]?.querySelector(selectors.titleLink)
                  ?.textContent || "N/A",
            },
          };
        }
      }
  
      handleYouTubePlay(checkForResults) {
        const videoLinks = document.querySelectorAll(
          this.SELECTORS[this.PLATFORM.YOUTUBE].searchResults
        );
  
        for (let link of videoLinks) {
          if (this.SELECTORS[this.PLATFORM.YOUTUBE].isValidResult(link)) {
            this.debugLog("Found valid YouTube video link:", link.href);
            window.location.href = link.href + "&autoplay=1";
            clearInterval(checkForResults);
            break;
          }
        }
      }
  
      handleYouTubeMusicPlay(checkForResults) {
        const selectors = this.SELECTORS[this.PLATFORM.YOUTUBE_MUSIC];
  
        // Handle channel page
        if (window.location.pathname.includes("/channel")) {
          this.debugLog("Handling YouTube Music channel page");
  
          // Try shuffle button first
          const shuffleButton = document.querySelector(
            selectors.channelShuffleButton
          );
          if (shuffleButton) {
            this.debugLog("Found shuffle button, attempting to click");
            try {
              shuffleButton.click();
              clearInterval(checkForResults);
              this.debugLog("Successfully clicked shuffle button");
              return;
            } catch (error) {
              this.debugLog("Error clicking shuffle button:", error);
            }
          }
  
          // Try play button if shuffle isn't available
          const playButton = document.querySelector(selectors.channelPlayButton);
          if (playButton) {
            this.debugLog("Found play button, attempting to click");
            try {
              playButton.click();
              clearInterval(checkForResults);
              this.debugLog("Successfully clicked play button");
              return;
            } catch (error) {
              this.debugLog("Error clicking play button:", error);
            }
          }
  
          // Fall back to first song if buttons aren't available
          const channelSongs = document.querySelectorAll(
            selectors.channelSongResults
          );
          if (channelSongs.length > 0) {
            const firstSong = channelSongs[0];
            const songPlayButton = firstSong.querySelector(selectors.playButton);
            if (songPlayButton) {
              this.debugLog("Found first song play button, attempting to click");
              try {
                songPlayButton.click();
                clearInterval(checkForResults);
                this.debugLog("Successfully clicked first song play button");
                return;
              } catch (error) {
                this.debugLog("Error clicking first song play button:", error);
              }
            }
          }
        }
  
        // Handle search results
        const songResults = document.querySelectorAll(selectors.songResults);
        const videoResults = document.querySelectorAll(selectors.videoResults);
        const playlistResults = document.querySelectorAll(
          selectors.playlistResults
        );
  
        const resultsInfo = this.getResultsInfo();
        this.debugLog("Current YouTube Music results found:", resultsInfo);
  
        let firstResult = null;
        let resultType = "";
  
        if (songResults.length > 0) {
          firstResult = songResults[0];
          resultType = "song";
        } else if (videoResults.length > 0) {
          firstResult = videoResults[0];
          resultType = "video";
        } else if (playlistResults.length > 0) {
          firstResult = playlistResults[0];
          resultType = "playlist";
        }
  
        if (firstResult) {
          clearInterval(checkForResults);
          this.debugLog(
            `Found first YouTube Music result of type: ${resultType}`
          );
  
          const playButton = firstResult.querySelector(selectors.playButton);
          if (playButton) {
            this.debugLog("Found play button, attempting to click");
            try {
              playButton.click();
              this.debugLog("Successfully clicked play button");
            } catch (error) {
              this.debugLog("Error clicking play button:", error);
            }
          } else {
            this.debugLog("No play button found, trying title element");
            const titleElement = firstResult.querySelector(selectors.titleLink);
            if (titleElement) {
              this.debugLog("Found title element, attempting to click");
              try {
                titleElement.click();
                this.debugLog("Successfully clicked title element");
              } catch (error) {
                this.debugLog("Error clicking title element:", error);
              }
            }
          }
        }
      }
  
      playFirstResult() {
        const platform = this.getCurrentPlatform();
        if (platform === this.PLATFORM.UNSUPPORTED) return;
  
        this.debugLog(
          `Starting playFirstResult function for platform: ${platform}`
        );
  
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
        this.debugLog("Initializing YouTube Autoplay extension");
        this.debugLog(`Current platform: ${this.getCurrentPlatform()}`);
  
        // Handle initial page load
        if (this.isSearchPage()) {
          this.debugLog("Initial page is a search page, scheduling autoplay");
          setTimeout(() => this.playFirstResult(), 1500);
        }
  
        // Handle navigation within the SPA
        let lastUrl = location.href;
        this.debugLog("Starting URL observer");
        new MutationObserver(() => {
          const url = location.href;
          if (url !== lastUrl) {
            this.debugLog("URL changed", {
              from: lastUrl,
              to: url,
            });
            lastUrl = url;
            if (this.isSearchPage()) {
              this.debugLog("New URL is a search page, scheduling autoplay");
              setTimeout(() => this.playFirstResult(), 1500);
            }
          }
        }).observe(document, { subtree: true, childList: true });
  
        // Add keyboard shortcut
        document.addEventListener("keydown", (e) => {
          if (e.ctrlKey && e.key === "p") {
            this.debugLog("Manual trigger shortcut (Ctrl+P) detected");
            this.playFirstResult();
          }
        });
      }
    }
  
    // Create instance immediately
    const player = new YouTubeAutoPlayer();
  })();