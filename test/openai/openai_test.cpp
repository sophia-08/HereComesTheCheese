#include <cpr/cpr.h>
#include <cstdlib>
#include <iostream>
#include <nlohmann/json.hpp>
#include <string>

using json = nlohmann::json;

class CommandExecutor {
public:
    static void execute(const json& response) {
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
            }else if (command == "translate") {

            }
            else if (command == "definition") {

            }
            else if (command == "summarize") {

            }
            else if (command == "unknown") {
            }
        } catch (const json::exception& e) {
            std::cerr << "Error processing command: " << e.what() << std::endl;
        }
    }
};

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

  void processResponse(const std::string &text) {
    try {
      json response = json::parse(text);
      std::cout << "\nOpenAIClient::processResponse Response: " << text << "\n\n";
      CommandExecutor::execute(response);
    } catch (const json::exception &e) {
      std::cout << "\nOpenAIClient::processResponse except, Response: " << text << "\n\n";
    }
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
      processResponse(response_json["choices"][0]["message"]["content"]);
    } catch (json::exception &e) {
      return "JSON parsing error: " + std::string(e.what());
    }
    return "";
  }
};

class LLMClient {
private:
  std::string server_url;
  std::string system_role;

public:
  LLMClient(const std::string &system_message = "")
      : server_url("http://localhost:8080/completion"),
        system_role(system_message) {}

  void processResponse(const std::string &text) {
    try {
      json response = json::parse(text);
      std::cout << "\nprocessResponse Response: " << text << "\n\n";
      CommandExecutor::execute(response);
    } catch (const json::exception &e) {
      std::cout << "\nResponse: " << text << "\n\n";
    }
  }

  std::string generateText(const std::string &prompt) {
    std::string full_prompt =
        system_role.empty()
            ? prompt
            : system_role + "\n\nUser: " + prompt + "\nAssistant: ";

    json request_data = {{"prompt", full_prompt},
                         {"temperature", 0.7},
                         {"max_tokens", 2000},
                         {"stop", json::array({"User:", "\n"})}};

    auto response = cpr::Post(cpr::Url{server_url},
                              cpr::Header{{"Content-Type", "application/json"}},
                              cpr::Body{request_data.dump()});

    if (response.status_code != 200) {
      return "Error: " + std::to_string(response.status_code) + " - " +
             response.text;
    }

    try {
      json response_json = json::parse(response.text);
      processResponse(response_json["content"]);
    } catch (json::exception &e) {
      return "JSON parsing error: " + std::string(e.what());
    }
    return "";
  }
};

int main() {
  try {
    std::string system_message =
        "You are a helpful AI assistant. Be concise "
        "and clear in your responses.You will be given one short sentense, "
        "your response will be mapped to a list of commands. The list are "
        "['translate', 'definition', 'launch browser', 'summarize', "
        "'unknown']. Your resposne must in JSON,  with only two attributes, "
        "'command' and 'parameter'. 'command' must in the commnd list, if you "
        "do not know, use 'unknown'. 'parameter' is optional, for example, for "
        "'launch browser', parameter may be the URL of a website";
    OpenAIClient client(system_message);
    // LLMClient client(system_message);
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