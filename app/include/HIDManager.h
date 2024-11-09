#pragma once

#include <IOKit/hid/IOHIDManager.h>
#include <vector>
#include <memory>
#include "HIDDevice.h"
#include "ProxySocketServer.h"

class HIDManager {
public:
    HIDManager();
    ~HIDManager();

    void run();

private:
    static void deviceAdded(void *context, IOReturn result, void *sender, IOHIDDeviceRef device);
    static void deviceRemoved(void *context, IOReturn result, void *sender, IOHIDDeviceRef device);

    void handleDeviceAdded(IOHIDDeviceRef device);
    void handleDeviceRemoved(IOHIDDeviceRef device);

    static CFMutableDictionaryRef createMatchingDictionary();

    IOHIDManagerRef m_manager;
    std::vector<std::unique_ptr<HIDDevice>> m_devices;
    ProxySocketServer m_socket_server;
};
