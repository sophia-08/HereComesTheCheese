on run argv
    log "Script started"
    log "Arguments received: " & argv
    
    set recipientList to item 1 of argv
    set subjectLine to item 2 of argv
    set messageBody to item 3 of argv
    set attachmentPaths to item 4 of argv
    set ccList to item 5 of argv

    log "Recipients: " & recipientList
    log "Subject: " & subjectLine
    log "Message Body: " & messageBody
    log "Attachments: " & attachmentPaths
    log "CC List: " & ccList

    tell application "Mail"
        log "Creating new outgoing message"
        set newMessage to make new outgoing message with properties {subject:subjectLine, content:messageBody & return & return}
        
        -- Add recipients
        log "Adding recipients"
        repeat with recipientAddress in my splitString(recipientList, ",")
            log "Adding recipient: " & recipientAddress
            tell newMessage to make new to recipient with properties {address:recipientAddress}
        end repeat
        
        -- Add CC recipients
        log "Adding CC recipients"
        repeat with ccAddress in my splitString(ccList, ",")
            log "Adding CC recipient: " & ccAddress
            tell newMessage to make new cc recipient with properties {address:ccAddress}
        end repeat
        
        -- Add attachments
        log "Adding attachments"
        repeat with attachmentPath in my splitString(attachmentPaths, ",")
            set fullPath to my expandPath(attachmentPath)
            log "Attempting to attach file: " & fullPath
            try
                tell newMessage to make new attachment with properties {file name:fullPath} at after the last paragraph
                log "File attached successfully: " & fullPath
            on error errMsg
                log "Failed to attach file: " & fullPath & ". Error: " & errMsg
            end try
        end repeat
        
        log "Activating Mail application"
        activate
    end tell
    
    log "Email composition completed"
    return "New email composed successfully."
end run

on splitString(theString, theDelimiter)
    set oldDelimiters to AppleScript's text item delimiters
    set AppleScript's text item delimiters to theDelimiter
    set theArray to every text item of theString
    set AppleScript's text item delimiters to oldDelimiters
    return theArray
end splitString

on expandPath(filePath)
    if filePath starts with "~" then
        set homePath to POSIX path of (path to home folder)
        set filePath to homePath & text 2 thru -1 of filePath
    end if
    return filePath
end expandPath