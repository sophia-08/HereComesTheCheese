on run argv
    log "Script started"
    log "Arguments received: " & argv
    
    -- Correct parameter order and handle array format
    set recipientList to my stripArrayBrackets(item 1 of argv)
    set ccList to my stripArrayBrackets(item 2 of argv)
    set subjectLine to item 3 of argv
    set messageBody to item 4 of argv
    set attachmentPaths to my stripArrayBrackets(item 5 of argv)

    log "Recipients: " & recipientList
    log "CC List: " & ccList
    log "Subject: " & subjectLine
    log "Message Body: " & messageBody
    log "Attachments: " & attachmentPaths

    tell application "Mail"
        log "Creating new outgoing message"
        set newMessage to make new outgoing message with properties {subject:subjectLine, content:messageBody & return & return}
        
        -- Add recipients
        log "Adding recipients"
        if recipientList is not "" then
            set recipientAddresses to my splitString(recipientList, ",")
            repeat with recipientAddress in recipientAddresses
                set trimmedAddress to my trimString(recipientAddress)
                if trimmedAddress is not "" then
                    log "Adding recipient: " & trimmedAddress
                    tell newMessage to make new to recipient with properties {address:trimmedAddress}
                end if
            end repeat
        end if
        
        -- Add CC recipients
        log "Adding CC recipients"
        if ccList is not "" then
            set ccAddresses to my splitString(ccList, ",")
            repeat with ccAddress in ccAddresses
                set trimmedAddress to my trimString(ccAddress)
                if trimmedAddress is not "" then
                    log "Adding CC recipient: " & trimmedAddress
                    tell newMessage to make new cc recipient with properties {address:trimmedAddress}
                end if
            end repeat
        end if
        
        -- Add attachments
        log "Adding attachments"
        if attachmentPaths is not "" then
            set attachmentList to my splitString(attachmentPaths, ",")
            repeat with attachmentPath in attachmentList
                set trimmedPath to my trimString(attachmentPath)
                if trimmedPath is not "" then
                    set fullPath to my expandPath(trimmedPath)
                    log "Attempting to attach file: " & fullPath
                    try
                        tell newMessage to make new attachment with properties {file name:fullPath} at after the last paragraph
                        log "File attached successfully: " & fullPath
                    on error errMsg
                        log "Failed to attach file: " & fullPath & ". Error: " & errMsg
                    end try
                end if
            end repeat
        end if
        
        log "Activating Mail application"
        activate
    end tell
    
    log "Email composition completed"
    return "New email composed successfully."
end run

on splitString(theString, theDelimiter)
    -- Handle empty string case
    if theString is "" then return {}
    
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

on stripArrayBrackets(arrayString)
    -- Remove [] brackets and handle empty arrays
    if arrayString is "[]" then
        return ""
    else if arrayString starts with "[" and arrayString ends with "]" then
        return text 2 thru -2 of arrayString
    end if
    return arrayString
end stripArrayBrackets

on trimString(theString)
    -- Fixed trimString function
    set trimmed to theString
    
    -- Remove leading spaces
    repeat while trimmed begins with " "
        set trimmed to text 2 thru -1 of trimmed
    end repeat
    
    -- Remove trailing spaces
    repeat while trimmed ends with " "
        set trimmed to text 1 thru -2 of trimmed
    end repeat
    
    return trimmed
end trimString