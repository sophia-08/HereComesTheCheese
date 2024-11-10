on run argv
    log "Script started"
    log "Arguments received: " & argv
    
    if (count of argv) is not 1 then
        log "Error: Expected exactly one argument"
        return "Error: Expected exactly one argument"
    end if
    
    set nameInput to item 1 of argv
    set nameWords to every word of nameInput
    log "Name words: " & nameWords
    
    tell application "Contacts"
        log "Accessing Contacts application"
        
        if (count of nameWords) is 1 then
            set searchName to item 1 of nameWords
            log "Searching by first name: " & searchName
            set matchingPeople to (every person whose first name is searchName)
        else if (count of nameWords) is 2 then
            set firstName to item 1 of nameWords
            set lastName to item 2 of nameWords
            log "Searching by full name: " & firstName & " " & lastName
            set matchingPeople to (every person whose first name is firstName and last name is lastName)
        else
            log "Error: Invalid name format"
            return "Error: Invalid name format"
        end if

        log "Number of matching contacts: " & (count of matchingPeople)

        if (count of matchingPeople) is 0 then
            log "No matching contact found"
            return ""
        else if (count of matchingPeople) > 1 then
            log "Multiple matching contacts found"
            return "Multiple matching contacts found"
        else
            set thePerson to item 1 of matchingPeople
            log "Matching contact found: " & (first name of thePerson) & " " & (last name of thePerson)
            
            if (count of emails of thePerson) is 0 then
                log "No email found for the contact"
                return ""
            else
                set emailAddress to value of item 1 of emails of thePerson
                log "Email found: " & emailAddress
                return emailAddress
            end if
        end if
    end tell
end run