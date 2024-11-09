#include "HIDManager.h"
#include "Logger.h"
#include <iostream>
#include <nlohmann/json.hpp>

using json = nlohmann::json;
HIDManager::HIDManager()
    : m_manager(IOHIDManagerCreate(kCFAllocatorDefault, kIOHIDOptionsTypeNone)),
      m_socket_server("/tmp/hid_device_socket") {
    IOHIDManagerSetDeviceMatching(m_manager, createMatchingDictionary());
    IOHIDManagerRegisterDeviceMatchingCallback(m_manager, deviceAdded, this);
    IOHIDManagerRegisterDeviceRemovalCallback(m_manager, deviceRemoved, this);
    IOHIDManagerScheduleWithRunLoop(m_manager, CFRunLoopGetCurrent(),
                                    kCFRunLoopDefaultMode);
    IOHIDManagerOpen(m_manager, kIOHIDOptionsTypeNone);

    m_socket_server.start();
    log("HIDManager created and socket server started");
}

HIDManager::~HIDManager() {
    m_socket_server.stop();
    IOHIDManagerClose(m_manager, kIOHIDOptionsTypeNone);
    CFRelease(m_manager);
    log("HIDManager destroyed");
}

void HIDManager::run() {
    log("Waiting for device connection...");
    CFRunLoopRun();
}

void HIDManager::deviceAdded(void *context, IOReturn result, void *sender, IOHIDDeviceRef device) {
    (void)result;
    (void)sender;
    auto *manager = static_cast<HIDManager *>(context);
    manager->handleDeviceAdded(device);
}

void HIDManager::deviceRemoved(void *context, IOReturn result, void *sender, IOHIDDeviceRef device) {
    (void)result;
    (void)sender;
    auto *manager = static_cast<HIDManager *>(context);
    manager->handleDeviceRemoved(device);
}

void HIDManager::handleDeviceAdded(IOHIDDeviceRef device) {
    log("Device added");

    auto hidDevice = std::make_unique<HIDDevice>(device, &m_socket_server);
    hidDevice->registerInputReportCallback();

    m_devices.push_back(std::move(hidDevice));
    log("HID device added and initialized");

    // Notify clients about the new device
    json j = {{"type", "device_added"},
              {"message", "New HID device connected"}};
    m_socket_server.sendToClients(j.dump());
}

void HIDManager::handleDeviceRemoved(IOHIDDeviceRef device) {
    log("Device removed");

    auto it = std::find_if(m_devices.begin(), m_devices.end(),
                           [device](const std::unique_ptr<HIDDevice> &d) {
                               return d->getDevice() == device;
                           });

    if (it != m_devices.end()) {
        (*it)->disconnect();
        m_devices.erase(it);
        log("HID device removed and cleaned up");

        // Notify clients about the removed device
        json j = {{"type", "device_removed"},
                  {"message", "HID device disconnected"}};
        m_socket_server.sendToClients(j.dump());
    } else {
        log("Removed device not found in the device list");
    }
}

CFMutableDictionaryRef HIDManager::createMatchingDictionary() {
    CFMutableDictionaryRef dict = CFDictionaryCreateMutable(
        kCFAllocatorDefault, 0, &kCFTypeDictionaryKeyCallBacks,
        &kCFTypeDictionaryValueCallBacks);

    int vendorID = 0x3333;
    int productID = 0x7856;
    CFNumberRef vidNumber =
        CFNumberCreate(kCFAllocatorDefault, kCFNumberIntType, &vendorID);
    CFNumberRef pidNumber =
        CFNumberCreate(kCFAllocatorDefault, kCFNumberIntType, &productID);

    CFDictionarySetValue(dict, CFSTR(kIOHIDVendorIDKey), vidNumber);
    CFDictionarySetValue(dict, CFSTR(kIOHIDProductIDKey), pidNumber);

    CFRelease(vidNumber);
    CFRelease(pidNumber);

    log("Matching dictionary created for VendorID: 0x" +
        std::to_string(vendorID) + ", ProductID: 0x" +
        std::to_string(productID));

    return dict;
}