#pragma once

#include <IOKit/hid/IOHIDManager.h>
#include <string>
#include <vector>
#include <map>
#include "ProxySocketServer.h"
#include <iomanip>
#include <sstream>
#include <cstdio>

class OpenAIClient;

class HIDDevice {
public:
    HIDDevice(IOHIDDeviceRef device, ProxySocketServer *server);
    virtual ~HIDDevice();

    void execute(const std::string &response);
    void sendReport(const std::vector<uint8_t> &report);
    static void inputReportCallback(void *context, IOReturn result, void *sender,
                                    IOHIDReportType type, uint32_t reportID,
                                    uint8_t *report, CFIndex reportLength);
    void handleInputReport(uint8_t *report, CFIndex reportLength);
    void registerInputReportCallback();
    void disconnect();
    bool isConnected() const;
    IOHIDDeviceRef getDevice() const;
    std::vector<std::string> parseFunctionCalls(const std::string &response);
    void parseSingleFunctionCall(const std::string &call, std::string &functionName, std::vector<std::string> &params);
    virtual std::string executeFunctionCall(const std::string &functionName, const std::vector<std::string> &params);

private:
    IOHIDDeviceRef m_device;
    ProxySocketServer *m_server;
    uint8_t m_report[256];
    bool m_connected;
    std::unique_ptr<OpenAIClient> m_ai_client;

};