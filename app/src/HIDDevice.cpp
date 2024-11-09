#include "HIDDevice.h"
#include "OpenAIClient.h"
#include "Logger.h"
#include <sstream>
#include <iostream>
#include <regex>
#include "prompt.h"

HIDDevice::HIDDevice(IOHIDDeviceRef device, ProxySocketServer *server)
    : m_device(device), m_server(server), m_connected(true) {

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

void HIDDevice::execute(const std::string &response) {
    std::vector<std::string> functionCalls = parseFunctionCalls(response);
    std::map<std::string, std::string> variables;

    for (const auto &call : functionCalls) {
        if (call == "<END_OF_PLAN>") break;

        std::string functionName;
        std::vector<std::string> params;
        parseSingleFunctionCall(call, functionName, params);

        // Replace $n variables with their values
        for (auto &param : params) {
            if (param[0] == '$') {
                param = variables[param];
            }
        }

        std::string result = executeFunctionCall(functionName, params);
        
        // Store result for potential future use
        variables["$" + std::to_string(variables.size() + 1)] = result;
    }
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

void HIDDevice::handleInputReport(uint8_t *report, CFIndex reportLength) {
    // Implementation depends on your specific HID device protocol
    // This is a placeholder implementation
    std::stringstream ss;
    ss << std::hex << std::setfill('0');
    for (CFIndex i = 0; i < reportLength; i++) {
        ss << std::setw(2) << static_cast<int>(report[i]);
    }

    std::string jsonReport = "{\"type\": \"hid_report\", \"data\": \"" + ss.str() + "\"}";

    m_server->sendToClients(jsonReport);
    log("Input report received and sent to clients. Length: " +
        std::to_string(reportLength) + ": " + jsonReport);
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

bool HIDDevice::isConnected() const {
    return m_connected;
}

IOHIDDeviceRef HIDDevice::getDevice() const {
    return m_device;
}

std::vector<std::string> HIDDevice::parseFunctionCalls(const std::string &response) {
    std::vector<std::string> calls;
    std::istringstream iss(response);
    std::string line;
    while (std::getline(iss, line)) {
        if (line.find(". ") != std::string::npos) {
            calls.push_back(line.substr(line.find(". ") + 2));
        } else if (line == "<END_OF_PLAN>") {
            calls.push_back(line);
        }
    }
    return calls;
}

void HIDDevice::parseSingleFunctionCall(const std::string &call, std::string &functionName, std::vector<std::string> &params) {
    size_t openParen = call.find('(');
    size_t closeParen = call.rfind(')');
    
    if (openParen != std::string::npos && closeParen != std::string::npos) {
        functionName = call.substr(0, openParen);
        std::string paramsStr = call.substr(openParen + 1, closeParen - openParen - 1);
        
        // Simple parsing, assumes parameters are comma-separated
        std::istringstream iss(paramsStr);
        std::string param;
        while (std::getline(iss, param, ',')) {
            // Trim whitespace and remove quotes
            param = std::regex_replace(param, std::regex("^\\s+|\\s+$|\""), "");
            params.push_back(param);
        }
    }
}

std::string HIDDevice::executeFunctionCall(const std::string &functionName, const std::vector<std::string> &params) {
    std::string command = functionName + " ";
    for (const auto &param : params) {
        command += "\"" + param + "\" ";
    }
    
    std::string result;
    FILE* pipe = popen(command.c_str(), "r");
    if (pipe) {
        char buffer[128];
        while (!feof(pipe)) {
            if (fgets(buffer, 128, pipe) != NULL)
                result += buffer;
        }
        pclose(pipe);
    }
    
    return result;
}