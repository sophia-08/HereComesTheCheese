#include <CoreGraphics/CoreGraphics.h>
#include <iostream>
#include <unistd.h>
#include <map>
#include <string>

class KeyboardInput {
private:
    // Mapping for special characters that require shift
    static std::map<char, std::pair<CGKeyCode, bool>> createKeyMap() {
        std::map<char, std::pair<CGKeyCode, bool>> keyMap;
        
        // Lowercase letters
        for (char c = 'a'; c <= 'z'; c++) {
            keyMap[c] = {static_cast<CGKeyCode>(c - 'a'), false};
        }
        
        // Uppercase letters
        for (char c = 'A'; c <= 'Z'; c++) {
            keyMap[c] = {static_cast<CGKeyCode>(c - 'A'), true};
        }
        
        // Numbers
        for (char c = '0'; c <= '9'; c++) {
            keyMap[c] = {static_cast<CGKeyCode>(0x12 + (c - '0')), false};
        }
        
        // Common punctuation
        keyMap['.'] = {0x2F, false};
        keyMap[','] = {0x2B, false};
        keyMap[' '] = {0x31, false};
        keyMap['!'] = {0x12, true};  // Shift + 1
        keyMap['@'] = {0x13, true};  // Shift + 2
        keyMap['#'] = {0x14, true};  // Shift + 3
        keyMap['$'] = {0x15, true};  // Shift + 4
        keyMap['%'] = {0x16, true};  // Shift + 5
        keyMap['^'] = {0x17, true};  // Shift + 6
        keyMap['&'] = {0x18, true};  // Shift + 7
        keyMap['*'] = {0x1C, true};  // Shift + 8
        keyMap['('] = {0x19, true};  // Shift + 9
        keyMap[')'] = {0x1D, true};  // Shift + 0
        keyMap['-'] = {0x1B, false};
        keyMap['_'] = {0x1B, true};
        keyMap['='] = {0x18, false};
        keyMap['+'] = {0x18, true};
        
        return keyMap;
    }
    
    static const std::map<char, std::pair<CGKeyCode, bool>> keyMap;
    
    void sendKeystroke(CGKeyCode keyCode, bool useShift) {
        CGEventSourceRef source = CGEventSourceCreate(kCGEventSourceStateHIDSystemState);
        
        if (source == NULL) {
            std::cerr << "Failed to create event source" << std::endl;
            return;
        }
        
        CGEventRef keyDown = CGEventCreateKeyboardEvent(source, keyCode, true);
        CGEventRef keyUp = CGEventCreateKeyboardEvent(source, keyCode, false);
        
        if (keyDown == NULL || keyUp == NULL) {
            std::cerr << "Failed to create keyboard events" << std::endl;
            CFRelease(source);
            return;
        }
        
        if (useShift) {
            CGEventSetFlags(keyDown, kCGEventFlagMaskShift);
            CGEventSetFlags(keyUp, kCGEventFlagMaskShift);
        }
        
        CGEventPost(kCGHIDEventTap, keyDown);
        usleep(20000); // 20ms delay between down and up
        CGEventPost(kCGHIDEventTap, keyUp);
        
        CFRelease(keyDown);
        CFRelease(keyUp);
        CFRelease(source);
        
        // Add a small delay between characters
        usleep(30000); // 30ms delay between characters
    }

public:
    void sendString(const std::string& text) {
        for (char c : text) {
            auto it = keyMap.find(c);
            if (it != keyMap.end()) {
                sendKeystroke(it->second.first, it->second.second);
            } else {
                std::cerr << "Character not mapped: " << c << std::endl;
            }
        }
    }
};

// Initialize the static map
const std::map<char, std::pair<CGKeyCode, bool>> KeyboardInput::keyMap = KeyboardInput::createKeyMap();

int main(int argc, char* argv[]) {
    if (argc != 2) {
        std::cout << "Usage: " << argv[0] << " \"text to send\"" << std::endl;
        return 1;
    }
    
    std::string textToSend = argv[1];
    std::cout << "Sending text in 3 seconds: " << textToSend << std::endl;
    sleep(3); // Give user time to switch to target application
    
    KeyboardInput keyboard;
    keyboard.sendString(textToSend);
    
    return 0;
}