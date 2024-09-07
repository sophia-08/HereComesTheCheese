#include <IOKit/hid/IOHIDManager.h>
#include <iostream>
#include <vector>
#include <memory>
#include <thread>
#include <sys/socket.h>
#include <sys/un.h>
#include <unistd.h>
#include <cstring>
#include <atomic>

class HIDDevice {
public:
    HIDDevice(IOHIDDeviceRef device) : m_device(device) {
        IOHIDDeviceOpen(m_device, kIOHIDOptionsTypeNone);
    }

    ~HIDDevice() {
        IOHIDDeviceClose(m_device, kIOHIDOptionsTypeNone);
    }

    void sendReport(const std::vector<uint8_t>& report) {
        IOHIDDeviceSetReport(m_device, kIOHIDReportTypeOutput, 0, report.data(), report.size());
    }

    static void inputReportCallback(void* context, IOReturn result, void* sender,
                                    IOHIDReportType type, uint32_t reportID,
                                    uint8_t* report, CFIndex reportLength) {
        std::cout << "Received report: ";
        for (CFIndex i = 0; i < reportLength; i++) {
            printf("%02X ", report[i]);
        }
        std::cout << std::endl;
    }

    void registerInputReportCallback() {
        static uint8_t report[64];  // Adjust size as needed
        IOHIDDeviceRegisterInputReportCallback(m_device, report, sizeof(report),
                                               inputReportCallback, nullptr);
    }

private:
    IOHIDDeviceRef m_device;
};

class UnixDomainSocketServer {
public:
    UnixDomainSocketServer(const std::string& socket_path) 
        : m_socket_path(socket_path), m_running(false) {}

    ~UnixDomainSocketServer() {
        stop();
    }

    void start() {
        std::cout << "UnixDomainSocketServer start" << std::endl;
        m_running = true;
        m_thread = std::thread(&UnixDomainSocketServer::run, this);
    }

    void stop() {
        m_running = false;
        if (m_thread.joinable()) {
            m_thread.join();
        }
        if (m_server_fd >= 0) {
            close(m_server_fd);
        }
        unlink(m_socket_path.c_str());
    }

private:
    void run() {
        m_server_fd = socket(AF_UNIX, SOCK_STREAM, 0);
        if (m_server_fd < 0) {
            std::cerr << "Error creating socket" << std::endl;
            return;
        }

        struct sockaddr_un server_addr;
        memset(&server_addr, 0, sizeof(server_addr));
        server_addr.sun_family = AF_UNIX;
        strncpy(server_addr.sun_path, m_socket_path.c_str(), sizeof(server_addr.sun_path) - 1);

        unlink(m_socket_path.c_str());
        if (bind(m_server_fd, (struct sockaddr*)&server_addr, sizeof(server_addr)) < 0) {
            std::cerr << "Error binding socket" << std::endl;
            return;
        }

        if (listen(m_server_fd, 5) < 0) {
            std::cerr << "Error listening on socket" << std::endl;
            return;
        }

        std::cout << "Unix Domain Socket server listening on " << m_socket_path << std::endl;

        while (m_running) {
            int client_fd = accept(m_server_fd, nullptr, nullptr);
            if (client_fd < 0) {
                if (m_running) {
                    std::cerr << "Error accepting connection" << std::endl;
                }
                continue;
            }

            handleClient(client_fd);
            close(client_fd);
        }
    }

    void handleClient(int client_fd) {
        char buffer[1024];
        ssize_t bytes_read = read(client_fd, buffer, sizeof(buffer) - 1);
        if (bytes_read > 0) {
            buffer[bytes_read] = '\0';
            std::string response = processCommand(buffer);
            write(client_fd, response.c_str(), response.length());
        }
    }

    std::string processCommand(const std::string& command) {
        if (command == "status") {
            return "HID Device is connected";
        } else if (command.substr(0, 4) == "send") {
            // Example: send a report to the HID device
            // In a real implementation, you would parse the command and send the appropriate report
            return "Report sent to HID device";
        } else {
            return "Unknown command";
        }
    }

    std::string m_socket_path;
    std::atomic<bool> m_running;
    std::thread m_thread;
    int m_server_fd = -1;
};

class HIDManager {
public:
    HIDManager() : m_manager(IOHIDManagerCreate(kCFAllocatorDefault, kIOHIDOptionsTypeNone)),
                   m_socket_server("/tmp/hid_device_socket") {
        IOHIDManagerSetDeviceMatching(m_manager, createMatchingDictionary());
        IOHIDManagerRegisterDeviceMatchingCallback(m_manager, deviceAdded, this);
        IOHIDManagerScheduleWithRunLoop(m_manager, CFRunLoopGetCurrent(), kCFRunLoopDefaultMode);
        IOHIDManagerOpen(m_manager, kIOHIDOptionsTypeNone);

        m_socket_server.start();
    }

    ~HIDManager() {
        m_socket_server.stop();
        IOHIDManagerClose(m_manager, kIOHIDOptionsTypeNone);
        CFRelease(m_manager);
    }

    void run() {
        std::cout << "Waiting for device connection..." << std::endl;
        CFRunLoopRun();
    }

private:
    static void deviceAdded(void* context, IOReturn result, void* sender, IOHIDDeviceRef device) {
        auto* manager = static_cast<HIDManager*>(context);
        manager->handleDeviceAdded(device);
    }

    void handleDeviceAdded(IOHIDDeviceRef device) {
        std::cout << "Device added" << std::endl;

        auto hidDevice = std::make_unique<HIDDevice>(device);
        hidDevice->registerInputReportCallback();

        // Example: Send a custom report
        std::vector<uint8_t> report = {0x01, 0x02, 0x03};
        hidDevice->sendReport(report);

        m_devices.push_back(std::move(hidDevice));
    }

    static CFMutableDictionaryRef createMatchingDictionary() {
        CFMutableDictionaryRef dict = CFDictionaryCreateMutable(kCFAllocatorDefault, 0,
                                                                &kCFTypeDictionaryKeyCallBacks,
                                                                &kCFTypeDictionaryValueCallBacks);

        int vendorID = 0x3333;
        int productID = 0x7856;
        CFNumberRef vidNumber = CFNumberCreate(kCFAllocatorDefault, kCFNumberIntType, &vendorID);
        CFNumberRef pidNumber = CFNumberCreate(kCFAllocatorDefault, kCFNumberIntType, &productID);

        CFDictionarySetValue(dict, CFSTR(kIOHIDVendorIDKey), vidNumber);
        CFDictionarySetValue(dict, CFSTR(kIOHIDProductIDKey), pidNumber);

        CFRelease(vidNumber);
        CFRelease(pidNumber);

        return dict;
    }

    IOHIDManagerRef m_manager;
    std::vector<std::unique_ptr<HIDDevice>> m_devices;
    UnixDomainSocketServer m_socket_server;
};

int main() {
    HIDManager manager;
    manager.run();
    return 0;
}