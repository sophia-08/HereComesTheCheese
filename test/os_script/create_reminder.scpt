on run argv
    log "Script started"
    log "Arguments received: " & argv
    
    set reminderName to item 1 of argv
    set reminderDueDateString to item 2 of argv
    set reminderNotes to item 3 of argv
    set reminderListName to item 4 of argv
    set reminderPriority to (item 5 of argv as number)
    set reminderAllDay to (item 6 of argv as boolean)
    
    log "Parsing due date: " & reminderDueDateString
    set reminderDueDate to my parseDate(reminderDueDateString)
    log "Parsed due date: " & reminderDueDate
    
    tell application "Reminders"
        log "Activating Reminders app"
        activate
        
        if reminderListName is "" then
            log "Using default list"
            set targetList to default list
        else
            log "Attempting to use list: " & reminderListName
            try
                set targetList to list reminderListName
            on error
                log "List not found, using default list"
                set targetList to default list
            end try
        end if
        
        log "Creating reminder"
        if reminderAllDay then
            log "Creating all-day reminder"
            make new reminder at end of targetList with properties {name:reminderName, body:reminderNotes, due date:reminderDueDate, priority:reminderPriority, allday due date:reminderDueDate}
        else
            log "Creating time-specific reminder"
            make new reminder at end of targetList with properties {name:reminderName, body:reminderNotes, due date:reminderDueDate, priority:reminderPriority}
        end if
        
    end tell
    
    log "Reminder created successfully"
    display notification "Reminder created: " & reminderName with title "Reminder Added"
end run

on parseDate(dateString)
    log "Parsing date string: " & dateString
    set {year:y, month:m, day:d, hours:h, minutes:min} to extractDateComponents(dateString)
    log "Extracted components - Year: " & y & ", Month: " & m & ", Day: " & d & ", Hour: " & h & ", Minute: " & min
    set theDate to current date
    set year of theDate to y
    set month of theDate to m
    set day of theDate to d
    set hours of theDate to h
    set minutes of theDate to min
    set seconds of theDate to 0
    log "Constructed date: " & theDate
    return theDate
end parseDate

on extractDateComponents(dateString)
    set {y, m, d, h, min} to {0, 1, 1, 0, 0}
    try
        set {y, m, d} to extractNumbers(text 1 thru 10 of dateString)
        set {h, min} to extractNumbers(text 12 thru -1 of dateString)
    end try
    return {year:y, month:m, day:d, hours:h, minutes:min}
end extractDateComponents

on extractNumbers(s)
    set {TID, text item delimiters} to {text item delimiters, {"-", " ", ":"}}
    set nums to text items of s
    set text item delimiters to TID
    return nums as list
end extractNumbers