#include <IOKit/hid/IOHIDManager.h>
#include <atomic>
#include <chrono>
#include <cstring>
#include <ctime>
#include <iomanip>
#include <iostream>
#include <memory>
#include <mutex>
#include <queue>
#include <sstream>
#include <sys/socket.h>
#include <sys/un.h>
#include <thread>
#include <unistd.h>
#include <vector>

// Added for logging
#include <fstream>

// Simple JSON class
class JSON {
public:
  static std::string
  makeObject(const std::vector<std::pair<std::string, std::string>> &pairs) {
    std::stringstream ss;
    ss << "{";
    for (size_t i = 0; i < pairs.size(); ++i) {
      if (i > 0)
        ss << ",";
      ss << "\"" << pairs[i].first << "\":\"" << pairs[i].second << "\"";
    }
    ss << "}";
    return ss.str();
  }
};

// Updated logging class
class Logger {
public:
  static Logger &getInstance() {
    static Logger instance;
    return instance;
  }

  void log(const std::string &message) {
    auto now = std::chrono::system_clock::now();
    auto now_c = std::chrono::system_clock::to_time_t(now);
    m_logFile << std::put_time(std::localtime(&now_c), "%F %T") << " - "
              << message << std::endl;
    std::cout << message << std::endl; // Also print to console
  }

  void close() {
    if (m_logFile.is_open()) {
      m_logFile.close();
    }
  }

private:
  Logger() : m_logFile("ergo_app.log", std::ios::app) {}
  ~Logger() { close(); }
  Logger(const Logger &) = delete;
  Logger &operator=(const Logger &) = delete;

  std::ofstream m_logFile;
};

// Updated logging function
void log(const std::string &message) { Logger::getInstance().log(message); }

class HIDDevice;

class ProxySocketServer {
public:
  ProxySocketServer(const std::string &socket_path)
      : m_socket_path(socket_path), m_running(false) {
    log("ProxySocketServer created with socket path: " + socket_path);
  }

  ~ProxySocketServer() {
    stop();
    log("ProxySocketServer destroyed");
  }

  void start() {
    m_running = true;
    m_thread = std::thread(&ProxySocketServer::run, this);
    log("ProxySocketServer started");
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
    log("ProxySocketServer stopped");
  }

  void sendToClients(const std::string &message) {
    std::lock_guard<std::mutex> lock(m_clients_mutex);
    for (int client_fd : m_clients) {
      write(client_fd, message.c_str(), message.length());
    }
    log("Message sent to " + std::to_string(m_clients.size()) + " clients");
  }

private:
  void run() {
    m_server_fd = socket(AF_UNIX, SOCK_STREAM, 0);
    if (m_server_fd < 0) {
      log("Error creating socket");
      return;
    }

    struct sockaddr_un server_addr;
    memset(&server_addr, 0, sizeof(server_addr));
    server_addr.sun_family = AF_UNIX;
    strncpy(server_addr.sun_path, m_socket_path.c_str(),
            sizeof(server_addr.sun_path) - 1);

    unlink(m_socket_path.c_str());
    if (bind(m_server_fd, (struct sockaddr *)&server_addr,
             sizeof(server_addr)) < 0) {
      log("Error binding socket");
      return;
    }

    if (listen(m_server_fd, 5) < 0) {
      log("Error listening on socket");
      return;
    }

    log("Unix Domain Socket server listening on " + m_socket_path);

    while (m_running) {
      int client_fd = accept(m_server_fd, nullptr, nullptr);
      if (client_fd < 0) {
        if (m_running) {
          log("Error accepting connection");
        }
        continue;
      }

      {
        std::lock_guard<std::mutex> lock(m_clients_mutex);
        m_clients.push_back(client_fd);
        log("New client connected. Total clients: " +
            std::to_string(m_clients.size()));
      }

      std::thread client_thread(&ProxySocketServer::handleClient, this,
                                client_fd);
      client_thread.detach();
    }
  }

  void handleClient(int client_fd) {
    char buffer[1024];
    while (m_running) {
      ssize_t bytes_read = read(client_fd, buffer, sizeof(buffer) - 1);
      if (bytes_read <= 0) {
        break;
      }
      buffer[bytes_read] = '\0';
      std::string response = processCommand(buffer);
      write(client_fd, response.c_str(), response.length());
      log("Processed command from client: " + std::string(buffer));
    }

    {
      std::lock_guard<std::mutex> lock(m_clients_mutex);
      m_clients.erase(
          std::remove(m_clients.begin(), m_clients.end(), client_fd),
          m_clients.end());
      log("Client disconnected. Total clients: " +
          std::to_string(m_clients.size()));
    }
    close(client_fd);
  }

  std::string processCommand(const std::string &command) {
    if (command == "status") {
      return "HID Device is connected";
    } else if (command.substr(0, 4) == "send") {
      // Example: send a report to the HID device
      return "Report sent to HID device";
    } else {
      return "Unknown command";
    }
  }

  std::string m_socket_path;
  std::atomic<bool> m_running;
  std::thread m_thread;
  int m_server_fd = -1;
  std::vector<int> m_clients;
  std::mutex m_clients_mutex;
};

class HIDDevice {
public:
  HIDDevice(IOHIDDeviceRef device, ProxySocketServer *server)
      : m_device(device), m_server(server), m_connected(true) {
    IOHIDDeviceOpen(m_device, kIOHIDOptionsTypeNone);
    log("HIDDevice created");
  }

  ~HIDDevice() {
    if (m_connected) {
      IOHIDDeviceClose(m_device, kIOHIDOptionsTypeNone);
    }
    log("HIDDevice destroyed");
  }

  void sendReport(const std::vector<uint8_t> &report) {
    IOHIDDeviceSetReport(m_device, kIOHIDReportTypeOutput, 0, report.data(),
                         report.size());
    log("Report sent to HID device");
  }

  static void inputReportCallback(void *context, IOReturn result, void *sender,
                                  IOHIDReportType type, uint32_t reportID,
                                  uint8_t *report, CFIndex reportLength) {
    (void)result;
    (void)type;
    (void)sender;
    (void)reportID;

    auto *device = static_cast<HIDDevice *>(context);
    device->handleInputReport(report, reportLength);
  }

  void handleInputReport(uint8_t *report, CFIndex reportLength) {
    std::stringstream ss;
    ss << std::hex << std::setfill('0');
    for (CFIndex i = 0; i < reportLength; i++) {
      ss << std::setw(2) << static_cast<int>(report[i]);
    }

    std::string jsonReport =
        JSON::makeObject({{"type", "hid_report"}, {"data", ss.str()}});

    m_server->sendToClients(jsonReport);
    log("Input report received and sent to clients. Length: " +
        std::to_string(reportLength));
  }

  void registerInputReportCallback() {
    IOHIDDeviceRegisterInputReportCallback(m_device, m_report, sizeof(m_report),
                                           inputReportCallback, this);
    log("Input report callback registered");
  }

  void disconnect() {
    if (m_connected) {
      IOHIDDeviceClose(m_device, kIOHIDOptionsTypeNone);
      m_connected = false;
      log("HIDDevice disconnected");
    }
  }

  bool isConnected() const { return m_connected; }

  IOHIDDeviceRef getDevice() const { return m_device; }

private:
  IOHIDDeviceRef m_device;
  ProxySocketServer *m_server;
  uint8_t m_report[64]; // Adjust size as needed
  bool m_connected;
};

class HIDManager {
public:
  HIDManager()
      : m_manager(
            IOHIDManagerCreate(kCFAllocatorDefault, kIOHIDOptionsTypeNone)),
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

  ~HIDManager() {
    m_socket_server.stop();
    IOHIDManagerClose(m_manager, kIOHIDOptionsTypeNone);
    CFRelease(m_manager);
    log("HIDManager destroyed");
  }

  void run() {
    log("Waiting for device connection...");
    CFRunLoopRun();
  }

private:
  static void deviceAdded(void *context, IOReturn result, void *sender,
                          IOHIDDeviceRef device) {
    (void)result;
    (void)sender;
    auto *manager = static_cast<HIDManager *>(context);
    manager->handleDeviceAdded(device);
  }

  static void deviceRemoved(void *context, IOReturn result, void *sender,
                            IOHIDDeviceRef device) {
    (void)result;
    (void)sender;
    auto *manager = static_cast<HIDManager *>(context);
    manager->handleDeviceRemoved(device);
  }

  void handleDeviceAdded(IOHIDDeviceRef device) {
    log("Device added");

    auto hidDevice = std::make_unique<HIDDevice>(device, &m_socket_server);
    hidDevice->registerInputReportCallback();

    m_devices.push_back(std::move(hidDevice));
    log("HID device added and initialized");

    // Notify clients about the new device
    m_socket_server.sendToClients(JSON::makeObject(
        {{"type", "device_added"}, {"message", "New HID device connected"}}));
  }

  void handleDeviceRemoved(IOHIDDeviceRef device) {
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
      m_socket_server.sendToClients(
          JSON::makeObject({{"type", "device_removed"},
                            {"message", "HID device disconnected"}}));
    } else {
      log("Removed device not found in the device list");
    }
  }

  static CFMutableDictionaryRef createMatchingDictionary() {
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

  IOHIDManagerRef m_manager;
  std::vector<std::unique_ptr<HIDDevice>> m_devices;
  ProxySocketServer m_socket_server;
};

int main() {
  log("Program started");
  HIDManager manager;
  manager.run();
  log("Program ended");
  Logger::getInstance().close();
  return 0;
}