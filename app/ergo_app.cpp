#include <IOKit/hid/IOHIDManager.h>
#include <atomic>
#include <chrono>
#include <cpr/cpr.h>
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
#include <nlohmann/json.hpp>
#include <regex>

#include "lc3_cpp.h"
#include "type_by_paste.h"
#include "wave.h"

using json = nlohmann::json;
class OpenAIClient;
class ProxySocketServer;
class HIDDevice {
public:
  HIDDevice(IOHIDDeviceRef device, ProxySocketServer *server);
  ~HIDDevice();

  void execute(const json &response);
  void sendReport(const std::vector<uint8_t> &report);
  static void inputReportCallback(void *context, IOReturn result, void *sender,
                                  IOHIDReportType type, uint32_t reportID,
                                  uint8_t *report, CFIndex reportLength);
  void handleInputReport(uint8_t *report, CFIndex reportLength);
  void registerInputReportCallback();
  void disconnect();
  bool isConnected() const;
  IOHIDDeviceRef getDevice() const;

private:
  IOHIDDeviceRef m_device;
  ProxySocketServer *m_server;
  uint8_t m_report[256];
  bool m_connected;
  std::unique_ptr<OpenAIClient> m_ai_client; // Store OpenAIClient as a member
};

class OpenAIClient {
private:
  std::string api_key;
  std::string system_role;
  HIDDevice *_device;

public:
  OpenAIClient(HIDDevice *device, const std::string &system_message = "")
      : system_role(system_message), _device(device) {
    const char *env_key = std::getenv("OPENAI_API_KEY");
    if (!env_key) {
      throw std::runtime_error("OPENAI_API_KEY environment variable not set");
    }
    api_key = env_key;
  }

  void processResponse(const std::string &text) {
    try {
      json response = json::parse(text);
      std::cout << "\nOpenAIClient::processResponse Response: " << text
                << "\n\n";
      if (_device) {
        _device->execute(response);
      }
    } catch (const json::exception &e) {
      std::cout << "\nOpenAIClient::processResponse except, Response: " << text
                << "\n\n";
    }
  }

  std::string generateText(const std::string &prompt) {
    json messages = json::array();
    std::cout << "generateText: " << prompt << std::endl;

    if (!system_role.empty()) {
      messages.push_back({{"role", "system"}, {"content", system_role}});
    }

    messages.push_back({{"role", "user"}, {"content", prompt}});

    json request_data = {{"model", "gpt-3.5-turbo"}, {"messages", messages}};

    auto response =
        cpr::Post(cpr::Url{"https://api.openai.com/v1/chat/completions"},
                  cpr::Header{{"Content-Type", "application/json"},
                              {"Authorization", "Bearer " + api_key}},
                  cpr::Body{request_data.dump()});

    if (response.status_code != 200) {
      return "Error: " + std::to_string(response.status_code) + " - " +
             response.text;
    }

    try {
      json response_json = json::parse(response.text);
      processResponse(response_json["choices"][0]["message"]["content"]);
    } catch (json::exception &e) {
      return "JSON parsing error: " + std::string(e.what());
    }
    return "";
  }
};

lc3::Decoder decoder(10000, 16000);
std::vector<int16_t> pcm_data;

struct WAVHeader {
  char riff[4] = {'R', 'I', 'F', 'F'};
  uint32_t fileSize;
  char wave[4] = {'W', 'A', 'V', 'E'};
  char fmt[4] = {'f', 'm', 't', ' '};
  uint32_t fmtSize = 16;
  uint16_t audioFormat = 1; // PCM
  uint16_t numChannels = 1; // Mono
  uint32_t sampleRate = 16000;
  uint32_t byteRate = 32000; // sampleRate * numChannels * bitsPerSample/8
  uint16_t blockAlign = 2;   // numChannels * bitsPerSample/8
  uint16_t bitsPerSample = 16;
  char data[4] = {'d', 'a', 't', 'a'};
  uint32_t dataSize;
};

class WhisperClient {
public:
  WhisperClient(const std::string &serverUrl) : baseUrl(serverUrl) {}

  std::string transcribe(const std::vector<int16_t> &pcmData) {
    // Create WAV header
    WAVHeader header;
    header.dataSize = pcmData.size() * sizeof(int16_t);
    header.fileSize =
        header.dataSize + sizeof(WAVHeader) - 8; // -8 for RIFF header

    // Combine header and PCM data
    std::vector<char> wavFile(sizeof(WAVHeader) + header.dataSize);
    std::memcpy(wavFile.data(), &header, sizeof(WAVHeader));
    std::memcpy(wavFile.data() + sizeof(WAVHeader), pcmData.data(),
                header.dataSize);

    cpr::Multipart multipart{
        {"file", cpr::Buffer{wavFile.begin(), wavFile.end(), "audio.wav"}},
        {"response_format", "text"}};

    auto response = cpr::Post(cpr::Url{baseUrl + "/inference"}, multipart);

    if (response.status_code != 200) {
      throw std::runtime_error("Server error: " + response.text);
    }

    return response.text;
  }

private:
  std::string baseUrl;
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

HIDDevice::HIDDevice(IOHIDDeviceRef device, ProxySocketServer *server)
    : m_device(device), m_server(server), m_connected(true) {
  std::string system_message =
      "You are a helpful AI assistant. Be concise and clear in your "
      "responses.You will be given one short sentense, your response "
      "will be mapped to a list of commands. The list are "
      "['translate', 'definition', 'launch browser', 'summarize', "
      "'unknown']. Your resposne must in JSON,  with only two "
      "attributes, 'command' and 'parameter'. 'command' must in the "
      "commnd list, if you do not know, use 'unknown'. 'parameter' is "
      "optional, for example, for 'launch browser', parameter may be "
      "the URL of a website";
  IOHIDDeviceOpen(m_device, kIOHIDOptionsTypeNone);
  m_ai_client = std::make_unique<OpenAIClient>(this, system_message);
  log("HIDDevice created");
}
HIDDevice::~HIDDevice() {
  if (m_connected) {
    IOHIDDeviceClose(m_device, kIOHIDOptionsTypeNone);
  }
  log("HIDDevice destroyed");
}

void HIDDevice::sendReport(const std::vector<uint8_t> &report) {
  IOHIDDeviceSetReport(m_device, kIOHIDReportTypeOutput, 0, report.data(),
                       report.size());
  log("Report sent to HID device");
}

void HIDDevice::inputReportCallback(void *context, IOReturn result,
                                    void *sender, IOHIDReportType type,
                                    uint32_t reportID, uint8_t *report,
                                    CFIndex reportLength) {
  (void)result;
  (void)type;
  (void)sender;
  (void)reportID;

  auto *device = static_cast<HIDDevice *>(context);
  std::cout << "inputReportCallback id: " << reportID
            << ",len: " << reportLength << std::endl;
  device->handleInputReport(report, reportLength);
}

void HIDDevice::execute(const json &response) {
  std::cout << "execute: " << response << std::endl;
  try {
    if (!response.contains("command")) {
      std::cout << "No command in resp: " << response << std::endl;
      return;
    }

    std::string command = response["command"];
    if (command == "launch browser") {
      if (!response.contains("parameter")) {
        std::cout << "No parameter in resp: " << response << std::endl;
        return;
      }
      std::string parameter = response["parameter"];
#ifdef __APPLE__
      std::string cmd = "open -a \"Google Chrome\" " + parameter;
#else
      std::string cmd = "google-chrome " + parameter;
#endif
      std::cout << "run: " << cmd << std::endl;
      system(cmd.c_str());
    // } else if (command == "youtube") {
    //   std::string cmd = "open -a \"YouTube\"";
    //   system(cmd.c_str());

    } 
    else if (command == "translate") {

    } else if (command == "definition") {
      json j = {{"type", "hid_cmd"}, {"cmd_id", "definition"}};
      std::string jsonReport = j.dump();
      m_server->sendToClients(jsonReport);
      log("Input report received and sent to clients: " + jsonReport);
    } else if (command == "summarize") {
      json j = {{"type", "hid_cmd"}, {"cmd_id", "summarize"}};
      std::string jsonReport = j.dump();
      m_server->sendToClients(jsonReport);
      log("Input report received and sent to clients: " + jsonReport);
    } 
    // else if (command == "click") {
    //   std::string param = response["parameter"].get<std::string>();

    //   // Keep only alphanumeric and space, replace everything else with space
    //   param = std::regex_replace(param, std::regex("[^a-zA-Z0-9\\s]+"), " ");
    //   // Replace all whitespace (including newlines) with single space
    //   param = std::regex_replace(param, std::regex("\\s+"), " ");
    //   // Trim spaces at beginning and end
    //   param = std::regex_replace(param, std::regex("^\\s+|\\s+$"), "");
    //   json j = {{"type", "hid_cmd"}, {"cmd_id", "click"}, {"parameter", param}};
    //   std::string jsonReport = j.dump();
    //   m_server->sendToClients(jsonReport);
    //   log("Input report received and sent to clients: " + jsonReport);
    
    // }
     else if (command == "unknown") {
    }
  } catch (const json::exception &e) {
    std::cerr << "Error processing command: " << e.what() << std::endl;
  }
}

std::unordered_set<std::string> shortCommands = {
    "translate",  "translated", "definition", "summarize",
    "summarized", "type",       "input",      "click"};
std::string trim(const std::string &str) {
  const std::string whitespace = " \t\n\r\f\v";
  std::size_t first = str.find_first_not_of(whitespace);
  if (first == std::string::npos)
    return "";
  std::size_t last = str.find_last_not_of(whitespace);
  return str.substr(first, last - first + 1);
}

std::pair<std::string, std::string>
splitFirstWord(const std::string &sentence) {
  std::string trimmed = trim(sentence);
  std::size_t spacePos = trimmed.find(' ');

  // If no space found, return the whole string as first word and empty string
std::string firstWord;
std::string remainder;

  if (spacePos == std::string::npos) {
    firstWord = trimmed;
    remainder = "";
  } else{
      // Split into first word and remainder
  firstWord = trimmed.substr(0, spacePos);
  remainder = trim(trimmed.substr(spacePos + 1));
  }



  // Transform first word to lowercase
  std::transform(firstWord.begin(), firstWord.end(), firstWord.begin(),
                 ::tolower);

  // Remove punctuation from first word
  firstWord.erase(std::remove_if(firstWord.begin(), firstWord.end(), ::ispunct),
                  firstWord.end());

  std::cout <<"split: " << firstWord << ", " << remainder << std::endl;

  return std::make_pair(to_lowercase(trim(firstWord)), remainder);
}
#define BUF_SIZE 170
void HIDDevice::handleInputReport(uint8_t *report, CFIndex reportLength) {
  std::stringstream ss;

  int16_t pcm[BUF_SIZE];
  memset(pcm, 0, BUF_SIZE * 2);

  if (report[0] == 0x02) {
    // Cutsomer report
    bool end = true;
    for (int i = 5; i < 10; i++) {
      if (report[i] != 'f') {
        end = false;
      }
    }
    if (end == false) {
      decoder.Decode(&report[1], 20, pcm);
      for (int i = 0; i < 160; i++) {
        pcm_data.push_back(pcm[i]);
      }

      decoder.Decode(&report[21], 20, pcm);
      for (int i = 0; i < 160; i++) {
        pcm_data.push_back(pcm[i]);
      }
      // std::cout << std::hex << std::setfill('0');
      // for (int i=0; i<BUF_SIZE; i++) {
      //   std::cout << std::setw(4) << static_cast<uint16_t>( pcm[i]) << " ";
      // }
      // std::cout << std::endl  << std::dec;
    } else {

#if 0
      // OpenAIClient ai_client(this, "system_message");
      // std::string ss = "{\"command\":\"launch "
      //                  "browser\",\"parameter\":\"https://www.youtube.com/"
      //                  "results?search_query=purple+rain\"}";

      // std::string ss =
      // "{\"command\":\"definition\",\"parameter\":\"https://www.youtube.com/"
      //            "results?search_query=purple+rain\"}";

      // std::string ss =
      // "{\"command\":\"summarize\",\"parameter\":\"https://www.youtube.com/"
      //             "results?search_query=purple+rain\"}";

      std::string ss = "{\"command\":\"click\",\"parameter\":\"Harris\"}";

      // json response_json = json::parse(ss);
      m_ai_client->processResponse(ss);
      return;

#else
      FILE *fp;
      std::cout << "Save file " << pcm_data.size() << std::endl;
      if ((fp = fopen("out.wav", "wb")) == NULL) {
        std::cerr << "Cannot create file";
        return;
      }
      wave_write_header(fp, 16, 2, 16000, 1, pcm_data.size() - 320);

      wave_write_pcm(fp, 2, pcm_data.data() + 320, 1, 0, pcm_data.size() - 320);
      fclose(fp);

      try {
        // Your PCM data
        // std::vector<int16_t> audioData; // Your 16-bit PCM samples

        WhisperClient whisper_client("http://localhost:8080");
        std::string transcription = whisper_client.transcribe(pcm_data);
        std::cout << "Transcription: " << transcription << std::endl;

        auto cmd = splitFirstWord(transcription);
        std::cout << "cmd: " << cmd.first << " len=" << cmd.first.size()
                  << std::endl;
        if (shortCommands.count(cmd.first.c_str()) > 0) {
          if ((cmd.first.compare("type") == 0) ||
              (cmd.first.compare("input") == 0)) {
            std::cout << "Type: " << cmd.second << std::endl;

            auto str1 = std::regex_replace(cmd.second, std::regex("\\[BLANK_AUDIO\\]"), "");
            std::cout << "Type after clean up: " << str1 << std::endl;

            copyTextToClipboard(str1);
            std::cout << "Simulating paste of: " << str1 << std::endl;
            pasteText();
          } else {
            std::cout << "Short command: " << cmd.first << ", " << cmd.second << std::endl;

            std::string param = cmd.second;
            // Keep only alphanumeric and space, replace everything else with
            // space
            param =
                std::regex_replace(param, std::regex("[^a-zA-Z0-9\\s]+"), " ");
            // Replace all whitespace (including newlines) with single space
            param = std::regex_replace(param, std::regex("\\s+"), " ");
            // Trim spaces at beginning and end
            param = std::regex_replace(param, std::regex("^\\s+|\\s+$"), "");

            std::string cmd_id = cmd.first;
            // Keep only alphanumeric and space, replace everything else with
            // space
            cmd_id =
                std::regex_replace(cmd_id, std::regex("[^a-zA-Z0-9\\s]+"), " ");
            // Replace all whitespace (including newlines) with single space
            cmd_id = std::regex_replace(cmd_id, std::regex("\\s+"), " ");
            // Trim spaces at beginning and end
            cmd_id = std::regex_replace(cmd_id, std::regex("^\\s+|\\s+$"), "");

            json j = {
                {"type", "hid_cmd"}, {"cmd_id", cmd_id}, {"parameter", param}};
            std::string jsonReport = j.dump();
            m_server->sendToClients(jsonReport);

            log("Sent short command to clients: " + jsonReport);
          }

        } else if (transcription.size() > 10) {

#if 1

          std::string response = m_ai_client->generateText(transcription);
          // m_ai_client->processResponse(response);
#endif
        } else {
          std::cout << "Transcription: " << transcription << ", ignored"
                    << std::endl;
        }
      } catch (const std::exception &e) {
        std::cerr << "Error: " << e.what() << std::endl;
      }
#endif

      pcm_data.clear();
    }
  } // if (report[0] == 0x02)

#if 0
    ss << std::hex << std::setfill('0');
    for (CFIndex i = 0; i < reportLength; i++) {
      ss << std::setw(2) << static_cast<int>(report[i]);
    }

    std::string jsonReport =
        JSON::makeObject({{"type", "hid_report"}, {"data", ss.str()}});

    m_server->sendToClients(jsonReport);
    log("Input report received and sent to clients. Length: " +
        std::to_string(reportLength) + ": " + jsonReport);
#endif
}

void HIDDevice::registerInputReportCallback() {
  IOHIDDeviceRegisterInputReportCallback(m_device, m_report, sizeof(m_report),
                                         inputReportCallback, this);
  log("Input report callback registered");
}

void HIDDevice::disconnect() {
  if (m_connected) {
    IOHIDDeviceClose(m_device, kIOHIDOptionsTypeNone);
    m_connected = false;
    log("HIDDevice disconnected");
  }
}

bool HIDDevice::isConnected() const { return m_connected; }

IOHIDDeviceRef HIDDevice::getDevice() const { return m_device; }

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
    json j = {{"type", "device_added"},
              {"message", "New HID device connected"}};
    m_socket_server.sendToClients(j.dump());
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
      json j = {{"type", "device_removed"},
                {"message", "HID device disconnected"}};
      m_socket_server.sendToClients(j.dump());
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

#if 0
{
  "command": "launch browser",
  "parameter": "https://en.wikipedia.org/wiki/Progressive_web_application"
}
"{\"command\":\"launch browser\",\"parameter\":\"https://en.wikipedia.org/wiki/Progressive_web_application\"}"
open -a "Google Chrome" https://en.wikipedia.org/wiki/Progressive_web_application

{
  "command": "launch browser",
  "parameter": "https://www.youtube.com/results?search_query=purple+rain"
}
"{\"command\":\"launch browser\",\"parameter\":\"https://www.youtube.com/results?search_query=purple+rain\"}"
open -a "Google Chrome" https://www.youtube.com/results?search_query=purple+rain

{
        "command": "launch browser",
        "parameter": "https://www.youtube.com/watch?v=TvnYmWpD_T8"
}

" {\"command\":\"launch browser\",\"parameter\":\"https://www.youtube.com/watch?v=TvnYmWpD_T8\"}"
#endif