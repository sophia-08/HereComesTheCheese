#include <ApplicationServices/ApplicationServices.h>
#include <Cocoa/Cocoa.h>
#include <chrono> // For specifying time intervals
#include <iostream>
#include <string>
#include <thread> // For sleep_for

// Function to copy text to the clipboard
void copyTextToClipboard(const std::string &text) {
  NSString *nsText = [NSString stringWithUTF8String:text.c_str()];
  NSPasteboard *pasteboard = [NSPasteboard generalPasteboard];
  [pasteboard clearContents];
  [pasteboard setString:nsText forType:NSPasteboardTypeString];

  // Debug: Check if text is properly copied to clipboard
  NSString *copiedText = [pasteboard stringForType:NSPasteboardTypeString];
  std::cout << "Copied to clipboard: " << [copiedText UTF8String] << std::endl;
}

// Function to simulate Cmd + V (paste) key press using Quartz Event Services
void pasteText() {
  // Cmd key down
  CGEventRef commandDown =
      CGEventCreateKeyboardEvent(NULL, (CGKeyCode)55, true);
  CGEventSetFlags(commandDown, kCGEventFlagMaskCommand); // Set Command flag
  CGEventPost(kCGHIDEventTap, commandDown);

  // 'v' key down
  CGEventRef vDown = CGEventCreateKeyboardEvent(NULL, (CGKeyCode)9, true);
  CGEventSetFlags(vDown, kCGEventFlagMaskCommand); // Set Command flag
  CGEventPost(kCGHIDEventTap, vDown);

  // 'v' key up
  CGEventRef vUp = CGEventCreateKeyboardEvent(NULL, (CGKeyCode)9, false);
  CGEventSetFlags(vUp, kCGEventFlagMaskCommand); // Set Command flag
  CGEventPost(kCGHIDEventTap, vUp);

  // Cmd key up
  CGEventRef commandUp = CGEventCreateKeyboardEvent(NULL, (CGKeyCode)55, false);
  CGEventPost(kCGHIDEventTap, commandUp);

  // Release the events
  CFRelease(commandDown);
  CFRelease(vDown);
  CFRelease(vUp);
  CFRelease(commandUp);
}

// int main() {
//     // The string we want to simulate typing (or pasting)
//     std::string text = "test";

//     // Copy the text to the clipboard
//     copyTextToClipboard(text);

//     // 3-second delay before pasting
//     std::cout << "Waiting 3 seconds before pasting..." << std::endl;
//     std::this_thread::sleep_for(std::chrono::seconds(3));

//     // Simulate Cmd + V to paste the text
//     std::cout << "Simulating paste of: " << text << std::endl;
//     pasteText();

//     return 0;
// }
