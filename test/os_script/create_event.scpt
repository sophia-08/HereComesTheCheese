on run argv
    log "Starting event creation process"
    set eventTitle to item 1 of argv
    log "Event title: " & eventTitle
    
    set startDateString to item 2 of argv
    set endDateString to item 3 of argv
    log "Start date string: " & startDateString
    log "End date string: " & endDateString
    
    -- Parse the date strings
    set startDate to my parseDate(startDateString)
    set endDate to my parseDate(endDateString)
    log "Parsed start date: " & startDate as string
    log "Parsed end date: " & endDate as string
    
    set eventLocation to item 4 of argv
    log "Event location: " & eventLocation
    
    set eventInvitees to my splitString(item 5 of argv, ",")
    log "Event invitees: " & eventInvitees as string
    
    set eventNotes to item 6 of argv
    log "Event notes: " & eventNotes
    
    tell application "Calendar"
        try
            log "Attempting to access Calendar application"
            set defaultCalendar to first calendar whose name is "Calendar"
            log "Default calendar found: " & (name of defaultCalendar)
            
            log "Creating new event"
            set newEvent to make new event at end of events of defaultCalendar with properties {summary:eventTitle, start date:startDate, end date:endDate, location:eventLocation}
            log "New event created with ID: " & (id of newEvent)
            
            log "Adding attendees"
            repeat with invitee in eventInvitees
                make new attendee at end of attendees of newEvent with properties {email:invitee}
                log "Added attendee: " & invitee
            end repeat
            
            log "Setting event description"
            set description of newEvent to eventNotes
            
            log "Saving changes"
            save
            
            log "Event creation completed successfully"
            return "Event created successfully!"
        on error errMsg
            log "Error occurred: " & errMsg
            return "Failed to create event: " & errMsg
        end try
    end tell
end run

on parseDate(dateString)
    -- Split into date and time parts
    set {datePart, timePart} to my splitString(dateString, " ")
    
    -- Split date part into year, month, day
    set dateParts to my splitString(datePart, "-")
    set yearNum to item 1 of dateParts as number
    set monthNum to item 2 of dateParts as number
    set dayNum to item 3 of dateParts as number
    
    -- Split time part into hours and minutes
    set timeParts to my splitString(timePart, ":")
    set hourNum to item 1 of timeParts as number
    set minuteNum to item 2 of timeParts as number
    
    -- Create a new date object
    set today to current date
    set year of today to yearNum
    set month of today to monthNum
    set day of today to dayNum
    set hours of today to hourNum
    set minutes of today to minuteNum
    set seconds of today to 0
    
    log "Created date with Year: " & yearNum & ", Month: " & monthNum & ", Day: " & dayNum & ", Hour: " & hourNum & ", Minute: " & minuteNum
    
    return today
end parseDate

on splitString(theString, theDelimiter)
    set oldDelimiters to AppleScript's text item delimiters
    set AppleScript's text item delimiters to theDelimiter
    set theArray to every text item of theString
    set AppleScript's text item delimiters to oldDelimiters
    return theArray
end splitString