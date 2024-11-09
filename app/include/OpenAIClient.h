#pragma once

#include <string>
#include "ExecutionEngine.h"
class HIDDevice;

class OpenAIClient {
public:
    OpenAIClient(ExecutionEngine* engine, const std::string &system_message = "");
    void processResponse(const std::string &text);
    std::string generateText(const std::string &prompt);

private:
    std::string api_key;
    std::string system_role;
    ExecutionEngine* m_execution_engine;
};