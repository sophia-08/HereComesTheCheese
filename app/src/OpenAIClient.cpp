#include "OpenAIClient.h"
#include "HIDDevice.h"  
#include <cpr/cpr.h>
#include <nlohmann/json.hpp>
#include <iostream>
#include "Logger.h"
using json = nlohmann::json;

OpenAIClient::OpenAIClient(ExecutionEngine* engine, const std::string &system_message)
    : system_role(system_message),  m_execution_engine(engine){
    const char *env_key = std::getenv("OPENAI_API_KEY");
    if (!env_key) {
        throw std::runtime_error("OPENAI_API_KEY environment variable not set");
    }
    api_key = env_key;
}

void OpenAIClient::processResponse(const std::string &text) {
    m_execution_engine->execute(text);
}

std::string OpenAIClient::generateText(const std::string &prompt) {
    json messages = json::array();
    log("Prompt: " + prompt);

    if (!system_role.empty()) {
        messages.push_back({{"role", "system"}, {"content", system_role}});
    }

    messages.push_back({{"role", "user"}, {"content", prompt}});

    json request_data = {{"model", "gpt-4o"}, {"messages", messages}};

    auto response =
        cpr::Post(cpr::Url{"https://api.openai.com/v1/chat/completions"},
                  cpr::Header{{"Content-Type", "application/json"},
                              {"Authorization", "Bearer " + api_key}},
                  cpr::Body{request_data.dump()});

    if (response.status_code != 200) {
        return "Error: " + std::to_string(response.status_code) + " - " +
               response.text;
    }

    std::cout << "LLM response: " << response.text << std::endl;

    try {
        json response_json = json::parse(response.text);
        std::string content = response_json["choices"][0]["message"]["content"];
        processResponse(content);
        return content;
    } catch (json::exception &e) {
        return "JSON parsing error: " + std::string(e.what());
    }
}