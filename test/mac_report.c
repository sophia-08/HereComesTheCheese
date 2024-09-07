#include <IOKit/hid/IOHIDManager.h>
#include <CoreFoundation/CoreFoundation.h>
#include <stdio.h>

// Function prototypes
void deviceAdded(void *context, IOReturn result, void *sender, IOHIDDeviceRef device);
void inputReportCallback(void *context, IOReturn result, void *sender,
                         IOHIDReportType type, uint32_t reportID,
                         uint8_t *report, CFIndex reportLength);

// Callback function for input reports
void inputReportCallback(void *context, IOReturn result, void *sender,
                         IOHIDReportType type, uint32_t reportID,
                         uint8_t *report, CFIndex reportLength) {
    printf("Received report: ");
    for (CFIndex i = 0; i < reportLength; i++) {
        printf("%02X ", report[i]);
    }
    printf("\n");
}

// Callback function for device matching
void deviceAdded(void *context, IOReturn result, void *sender, IOHIDDeviceRef device) {
    printf("Device added\n");
    
    // Get the product name
    CFStringRef productName = IOHIDDeviceGetProperty(device, CFSTR(kIOHIDProductKey));
    if (productName) {
        char name[256];
        CFStringGetCString(productName, name, sizeof(name), kCFStringEncodingUTF8);
        printf("Product Name: %s\n", name);
    }

    // Open the device
    IOReturn openResult = IOHIDDeviceOpen(device, kIOHIDOptionsTypeNone);
    if (openResult == kIOReturnSuccess) {
        printf("Device opened successfully\n");
        
        // Here you would implement your custom report handling
        // For example, to send a custom report:
        // uint8_t report[] = {0x01, 0x02, 0x03}; // Example report data
        // IOHIDDeviceSetReport(device, kIOHIDReportTypeOutput, 0, report, sizeof(report));
        uint8_t report[16] ;
        // To receive reports, you would set up an input report callback
        IOHIDDeviceRegisterInputReportCallback(device, report, sizeof(report),
                                               inputReportCallback, NULL);
    } else {
        printf("Failed to open device\n");
    }
}

int main() {
    IOHIDManagerRef manager = IOHIDManagerCreate(kCFAllocatorDefault, kIOHIDOptionsTypeNone);
    
    // Set up matching for your specific Bluetooth HID device
    CFMutableDictionaryRef matchingDict = CFDictionaryCreateMutable(kCFAllocatorDefault, 0,
                                                             &kCFTypeDictionaryKeyCallBacks,
                                                             &kCFTypeDictionaryValueCallBacks);
    
    // Use the specific VID and PID for your device
    int vendorID = 0x3333;
    int productID = 0x7856;
    CFNumberRef vidNumber = CFNumberCreate(kCFAllocatorDefault, kCFNumberIntType, &vendorID);
    CFNumberRef pidNumber = CFNumberCreate(kCFAllocatorDefault, kCFNumberIntType, &productID);
    
    CFDictionarySetValue(matchingDict, CFSTR(kIOHIDVendorIDKey), vidNumber);
    CFDictionarySetValue(matchingDict, CFSTR(kIOHIDProductIDKey), pidNumber);
    
    IOHIDManagerSetDeviceMatching(manager, matchingDict);
    
    // Register the device matching callback
    IOHIDManagerRegisterDeviceMatchingCallback(manager, deviceAdded, NULL);
    
    // Schedule the HID manager with the run loop
    IOHIDManagerScheduleWithRunLoop(manager, CFRunLoopGetCurrent(), kCFRunLoopDefaultMode);
    
    // Open the HID manager
    IOReturn openResult = IOHIDManagerOpen(manager, kIOHIDOptionsTypeNone);
    if (openResult != kIOReturnSuccess) {
        printf("Failed to open HID manager\n");
        return 1;
    }
    
    printf("Waiting for device connection...\n");
    
    // Run the main loop
    CFRunLoopRun();
    
    // Clean up (this part will not be reached in this example)
    IOHIDManagerClose(manager, kIOHIDOptionsTypeNone);
    CFRelease(manager);
    CFRelease(matchingDict);
    CFRelease(vidNumber);
    CFRelease(pidNumber);
    
    return 0;
}