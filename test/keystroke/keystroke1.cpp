#include <ApplicationServices/ApplicationServices.h>
#include <iostream>
#include <string>
#include <unistd.h>

void sendUnicodeString(const std::string& text) {
    // Create event source
    CGEventSourceRef source = CGEventSourceCreate(kCGEventSourceStateHIDSystemState);
    if (!source) {
        std::cerr << "Failed to create event source" << std::endl;
        return;
    }

    // Create keyboard event
    CGEventRef event = CGEventCreateKeyboardEvent(source, 0, true);
    if (!event) {
        std::cerr << "Failed to create keyboard event" << std::endl;
        CFRelease(source);
        return;
    }

    // Convert string to UniChar array
    UniChar* buffer = new UniChar[text.length()];
    for (size_t i = 0; i < text.length(); i++) {
        buffer[i] = (UniChar)text[i];
    }

    // Set unicode string
    CGEventKeyboardSetUnicodeString(event, text.length(), buffer);
    
    // Post the event
    CGEventPost(kCGSessionEventTap, event);

    // Clean up
    delete[] buffer;
    CFRelease(event);
    CFRelease(source);
}

int main(int argc, char* argv[]) {
    if (argc != 2) {
        std::cout << "Usage: " << argv[0] << " \"text to send\"" << std::endl;
        return 1;
    }
    
    std::cout << "Sending text in 3 seconds: " << argv[1] << std::endl;
    sleep(3);
    
    sendUnicodeString(argv[1]);
    
    return 0;
}