#include <cpr/cpr.h>
#include <cstdlib>
#include <iostream>
#include <nlohmann/json.hpp>
#include <string>

using json = nlohmann::json;

class OpenAIClient {
private:
  std::string api_key;
  std::string system_role;

public:
  OpenAIClient(const std::string &system_message = "") {
    const char *env_key = std::getenv("OPENAI_API_KEY");
    if (!env_key) {
      throw std::runtime_error("OPENAI_API_KEY environment variable not set");
    }
    api_key = env_key;
    system_role = system_message;
  }

  std::string generateText(const std::string &prompt) {
    json messages = json::array();

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
      return response_json["choices"][0]["message"]["content"];
    } catch (json::exception &e) {
      return "JSON parsing error: " + std::string(e.what());
    }
  }
};

int main() {
  try {
    std::string system_message =
        "You are a helpful AI assistant. Be concise "
        "and clear in your responses.You will be given one short sentense, "
        "your response will be mapped to a list of commands. The list are "
        "['translate', 'definition', 'launch broswer', 'summarize', "
        "'unknown']. Your resposne must in JSON,  with only two attributes, "
        "'command' and 'parameter'. 'command' must in the commnd list, if you "
        "do not know, use 'unknown'. 'parameter' is optional, for example, for "
        "'launch browser', parameter may be the URL of a website ";
    OpenAIClient client(system_message);
    std::string question;

    std::cout << "Enter your question (Ctrl+D to exit): ";
    while (std::getline(std::cin, question)) {
      if (question.empty())
        continue;

      std::string response = client.generateText(question);
      std::cout << "\nResponse: " << response << "\n\n";
      std::cout << "Enter your question (Ctrl+D to exit): ";
    }
  } catch (const std::exception &e) {
    std::cerr << "Error: " << e.what() << std::endl;
    return 1;
  }

  return 0;
}