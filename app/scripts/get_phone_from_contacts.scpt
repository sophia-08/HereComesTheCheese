on run argv
    log "Script started"
    log "Arguments received: " & argv
    
    set nameInput to argv
    log "Number of arguments: " & (count of nameInput)

    tell application "Contacts"
        log "Accessing Contacts application"
        
        if (count of nameInput) is 1 then
            set searchName to item 1 of nameInput
            log "Searching by first name: " & searchName
            set matchingPeople to (every person whose first name is searchName)
        else if (count of nameInput) is 2 then
            set firstName to item 1 of nameInput
            set lastName to item 2 of nameInput
            log "Searching by full name: " & firstName & " " & lastName
            set matchingPeople to (every person whose first name is firstName and last name is lastName)
        else
            log "Error: Invalid number of arguments"
            return "Error: Invalid number of arguments"
        end if

        log "Number of matching contacts: " & (count of matchingPeople)

        if (count of matchingPeople) is 0 then
            log "No matching contact found"
            return "No matching contact found"
        else if (count of matchingPeople) > 1 then
            log "Multiple matching contacts found"
            return "Multiple matching contacts found"
        else
            set thePerson to item 1 of matchingPeople
            log "Matching contact found: " & (first name of thePerson) & " " & (last name of thePerson)
            
            if (count of phones of thePerson) is 0 then
                log "No phone number found for the contact"
                return "No phone number found for the contact"
            else
                set phoneNumber to value of item 1 of phones of thePerson
                log "Phone number found: " & phoneNumber
                return phoneNumber
            end if
        end if
    end tell
end run