#!/bin/bash

# Enable debug logging
set -x

open_chrome() {
    local url="$1"
    echo "Attempting to open URL: $url"
    
    osascript 2>&1 <<EOF
    tell application "Google Chrome"
        log "Activating Chrome"
        activate
        
        log "Checking window count"
        if (count every window) = 0 then
            log "No windows found, creating new window"
            make new window
        end if
        
        log "Starting tab search"
        set found_tab to false
        set target_url to "$url"
        set target_window to window 1
        set target_tab_index to 1
        
        log "Number of windows: " & (count every window)
        repeat with w in windows
            log "Checking window " & (index of w)
            set tab_list to tabs of w
            log "Number of tabs in window: " & (count of tab_list)
            
            set current_tab_index to 1
            repeat with t in tab_list
                log "Checking tab " & current_tab_index & " with URL: " & (URL of t)
                if URL of t contains target_url then
                    log "Found matching tab"
                    set found_tab to true
                    set target_window to w
                    set target_tab_index to current_tab_index
                    exit repeat
                end if
                set current_tab_index to current_tab_index + 1
            end repeat
            
            if found_tab then
                log "Tab was found, exiting window loop"
                exit repeat
            end if
        end repeat
        
        if found_tab then
            log "Activating found tab"
            tell target_window
                set active tab index to target_tab_index
                set index to 1
            end tell
        else
            log "No existing tab found, creating new tab"
            tell window 1 to make new tab with properties {URL:target_url}
        end if
    end tell
EOF
}

# Check if URL is provided
if [ -z "$1" ]; then
    echo "Error: Please provide a URL"
    echo "Usage: $0 <url>"
    exit 1
fi

echo "Starting script with URL: $1"
open_chrome "$1"
echo "Script completed"