on run argv
    set theURL to item 1 of argv
    
    tell application "Google Chrome"
        activate
        
        if (count every window) = 0 then
            make new window
        end if
        
        set found to false
        set theTabIndex to 0
        repeat with theWindow in every window
            set theTabIndex to 0
            repeat with theTab in every tab of theWindow
                set theTabIndex to theTabIndex + 1
                if theTab's URL = theURL then
                    set found to true
                    exit repeat
                end if
            end repeat
            
            if found then
                exit repeat
            end if
        end repeat
        
        if found then
            tell theWindow
                set active tab index to theTabIndex
                set index to 1
            end tell
        else
            tell window 1
                make new tab with properties {URL:theURL}
            end tell
        end if
    end tell
end run