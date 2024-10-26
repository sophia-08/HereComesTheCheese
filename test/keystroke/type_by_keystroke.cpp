#include <ApplicationServices/ApplicationServices.h>
#include <iostream>
#include <thread>
#include <chrono>

// Function to generate a keyboard event (key down or key up)
void postKeyEvent(CGKeyCode key, bool keyDown) {
    CGEventRef event = CGEventCreateKeyboardEvent(NULL, key, keyDown);
    CGEventPost(kCGHIDEventTap, event);
    CFRelease(event);
}

// Map a character to its corresponding macOS key code
CGKeyCode keyCodeForChar(char c) {
    switch (c) {
        case 'a': return (CGKeyCode)0;
        case 'b': return (CGKeyCode)11;
        case 'c': return (CGKeyCode)8;
        case 'd': return (CGKeyCode)2;
        case 'e': return (CGKeyCode)14;
        case 'f': return (CGKeyCode)3;
        case 'g': return (CGKeyCode)5;
        case 'h': return (CGKeyCode)4;
        case 'i': return (CGKeyCode)34;
        case 'j': return (CGKeyCode)38;
        case 'k': return (CGKeyCode)40;
        case 'l': return (CGKeyCode)37;
        case 'm': return (CGKeyCode)46;
        case 'n': return (CGKeyCode)45;
        case 'o': return (CGKeyCode)31;
        case 'p': return (CGKeyCode)35;
        case 'q': return (CGKeyCode)12;
        case 'r': return (CGKeyCode)15;
        case 's': return (CGKeyCode)1;
        case 't': return (CGKeyCode)17;
        case 'u': return (CGKeyCode)32;
        case 'v': return (CGKeyCode)9;
        case 'w': return (CGKeyCode)13;
        case 'x': return (CGKeyCode)7;
        case 'y': return (CGKeyCode)16;
        case 'z': return (CGKeyCode)6;
        case '0': return (CGKeyCode)29;
        case '1': return (CGKeyCode)18;
        case '2': return (CGKeyCode)19;
        case '3': return (CGKeyCode)20;
        case '4': return (CGKeyCode)21;
        case '5': return (CGKeyCode)23;
        case '6': return (CGKeyCode)22;
        case '7': return (CGKeyCode)26;
        case '8': return (CGKeyCode)28;
        case '9': return (CGKeyCode)25;
        default: return (CGKeyCode)-1; // Invalid character
    }
}

// Function to simulate typing a string
void typeString(const std::string& text) {
    for (char c : text) {
        CGKeyCode keyCode = keyCodeForChar(c);
        if (keyCode != (CGKeyCode)-1) {
            // Simulate key press
            postKeyEvent(keyCode, true);
            // Simulate key release
            postKeyEvent(keyCode, false);
            // Add a short delay between key events
            std::this_thread::sleep_for(std::chrono::milliseconds(100));
        }
    }
}

int main() {
    // The string we want to simulate typing
    std::string text = "test";

    // Simulate typing "test" in the foreground app
    std::cout << "Simulating typing: " << text << std::endl;
    typeString(text);

    return 0;
}
