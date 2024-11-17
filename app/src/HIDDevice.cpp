#include "HIDDevice.h"
#include "InputHandler.h"
#include "Logger.h"
#include "OpenAIClient.h"
#include "lc3_cpp.h"
#include "prompt.h"
#include "type_by_paste.h"
#include "wave.h"
#include <cpr/cpr.h>
#include <iostream>
#include <nlohmann/json.hpp>
#include <regex>
#include <sstream>

using json = nlohmann::json;

HIDDevice::HIDDevice(IOHIDDeviceRef device, ProxySocketServer *server)
    : m_device(device), m_server(server), m_connected(true),
      m_execution_engine(
          std::make_unique<ExecutionEngine>()) // Initialize first
{
  IOHIDDeviceOpen(m_device, kIOHIDOptionsTypeNone);
  m_ai_client =
      std::make_unique<OpenAIClient>(m_execution_engine.get(), system_message);
  m_input_handler = std::make_unique<InputHandler>(server, m_ai_client.get());
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
            << ", len: " << reportLength << std::endl;
  device->handleInputReport(report, reportLength);
}

void HIDDevice::handleInputReport(uint8_t *report, CFIndex reportLength) {
  if (m_input_handler) {
    m_input_handler->handleInputReport(report, reportLength);
  }
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