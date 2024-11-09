#pragma once

#include <string>
#include "HIDDevice.h"

class OpenAIClient {
public:
    OpenAIClient(HIDDevice *device, const std::string &system_message = "");
    void processResponse(const std::string &text);
    std::string generateText(const std::string &prompt);

private:
    std::string api_key;
    std::string system_role;
    HIDDevice *_device;
};