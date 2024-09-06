#include <IOKit/hid/IOHIDLib.h>
#include <CoreFoundation/CoreFoundation.h>
#include <stdio.h>

// Callback function to handle input values
void inputValueCallback(void *context, IOReturn result, void *sender, IOHIDValueRef value) {
    CFIndex length = IOHIDValueGetLength(value);
    const uint8_t *buffer = IOHIDValueGetBytePtr(value);

    printf("Read %ld bytes:\n", length);
    for (CFIndex i = 0; i < length; i++) {
        // Print the bytes in hexadecimal format, ignoring control characters
        if (buffer[i] >= 32 && buffer[i] < 127) {  // printable ASCII range
            printf("%c", buffer[i]);
        } else {
            printf(".");  // Replace non-printable characters with '.'
        }
    }
    printf("\n");
}

// Function to print device properties
void printDeviceProperties(IOHIDDeviceRef device) {
    CFArrayRef propertyKeys = CFArrayCreate(NULL, (const void*[]){
        CFSTR(kIOHIDProductKey),
        CFSTR(kIOHIDVendorIDKey),
        CFSTR(kIOHIDLocationIDKey),
        CFSTR(kIOHIDSerialNumberKey),
        CFSTR(kIOHIDManufacturerKey)
    }, 5, &kCFTypeArrayCallBacks);

    for (CFIndex i = 0; i < CFArrayGetCount(propertyKeys); i++) {
        CFStringRef key = (CFStringRef)CFArrayGetValueAtIndex(propertyKeys, i);
        CFTypeRef value = IOHIDDeviceGetProperty(device, key);

        printf("Property %s: ", CFStringGetCStringPtr(key, kCFStringEncodingUTF8));

        if (value) {
            CFTypeID typeID = CFGetTypeID(value);

            if (typeID == CFStringGetTypeID()) {
                // Handle CFString type
                CFStringRef str = (CFStringRef)value;
                char buf[256];
                if (CFStringGetCString(str, buf, sizeof(buf), kCFStringEncodingUTF8)) {
                    printf("%s\n", buf);
                } else {
                    printf("Failed to get C string\n");
                }
            } else if (typeID == CFNumberGetTypeID()) {
                // Handle CFNumber type
                CFNumberRef num = (CFNumberRef)value;
                int numValue;
                CFNumberGetValue(num, kCFNumberIntType, &numValue);
                printf("%d\n", numValue);
            } else {
                printf("Unhandled type\n");
            }
        } else {
            printf("No value\n");
        }
    }
    CFRelease(propertyKeys);
}

// Function to handle a device
void handleDevice(IOHIDDeviceRef device, const char *targetPath) {
    printDeviceProperties(device);

    // Check for the correct property here, if it matches the target path
    CFTypeRef deviceSerialNumber = IOHIDDeviceGetProperty(device, CFSTR(kIOHIDSerialNumberKey));
    if (deviceSerialNumber) {
        char pathBuf[256];
        if (CFGetTypeID(deviceSerialNumber) == CFStringGetTypeID()) {
            CFStringRef serialNumberString = (CFStringRef)deviceSerialNumber;
            if (CFStringGetCString(serialNumberString, pathBuf, sizeof(pathBuf), kCFStringEncodingUTF8)) {
                printf("Retrieved Serial Number: %s\n", pathBuf);

                // Compare the path of the device
                if (strcmp(pathBuf, targetPath) == 0) {
                    printf("Opening device at path: %s\n", pathBuf);

                    // Register callback to handle input values
                    IOHIDDeviceRegisterInputValueCallback(device, inputValueCallback, NULL);

                    // Run the event loop to handle asynchronous callbacks
                    CFRunLoopRunInMode(kCFRunLoopDefaultMode, 1000, FALSE);  // Run loop for 10 seconds
                    printf("return");
                    return;
                } else {
                    printf("Serial number does not match: %s\n", pathBuf);
                }
            } else {
                printf("Failed to convert serial number to C string.\n");
            }
        } else {
            printf("Serial number property is not a string.\n");
        }
    } else {
        printf("Serial number property not found.\n");
    }

    printf("Device at path: %s not matched.\n", targetPath);
}


int main() {
    const char *targetPath = "E7EEDBB014D52E82";  // Use the serial number or appropriate identifier

    IOHIDManagerRef hidManager = IOHIDManagerCreate(kCFAllocatorDefault, kIOHIDOptionsTypeNone);
    if (!hidManager) {
        printf("Failed to create HID manager.\n");
        return -1;
    }

    IOHIDManagerSetDeviceMatching(hidManager, NULL);
    IOReturn result = IOHIDManagerOpen(hidManager, kIOHIDOptionsTypeNone);
    if (result != kIOReturnSuccess) {
        printf("Failed to open HID manager: %08x\n", result);
        CFRelease(hidManager);
        return -1;
    }

    CFSetRef devices = IOHIDManagerCopyDevices(hidManager);
    if (devices) {
        CFIndex numDevices = CFSetGetCount(devices);
        IOHIDDeviceRef *deviceArray = malloc(numDevices * sizeof(IOHIDDeviceRef));
        CFSetGetValues(devices, (const void **)deviceArray);

        for (CFIndex i = 0; i < numDevices; i++) {
            handleDevice(deviceArray[i], targetPath);
        }
        free(deviceArray);
        CFRelease(devices);
    } else {
        printf("No devices found.\n");
    }

    CFRelease(hidManager);
    return 0;
}
