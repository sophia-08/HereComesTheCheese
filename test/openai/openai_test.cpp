#include <cpr/cpr.h>
#include <nlohmann/json.hpp>
#include <iostream>
#include <string>

using json = nlohmann::json;

class OpenAIClient {
private:
    std::string api_key;

public:
    OpenAIClient(const std::string& key) : api_key(key) {}

    std::string generateText(const std::string& prompt) {
        json request_data = {
            {"model", "gpt-3.5-turbo"},
            {"messages", {{
                {"role", "user"},
                {"content", prompt}
            }}}
        };

        auto response = cpr::Post(
            cpr::Url{"https://api.openai.com/v1/chat/completions"},
            cpr::Header{
                {"Content-Type", "application/json"},
                {"Authorization", "Bearer " + api_key}
            },
            cpr::Body{request_data.dump()}
        );

        if (response.status_code != 200) {
            return "Error: " + std::to_string(response.status_code) + " - " + response.text;
        }

        try {
            json response_json = json::parse(response.text);
            return response_json["choices"][0]["message"]["content"];
        } catch (json::exception& e) {
            return "JSON parsing error: " + std::string(e.what());
        }
    }
};

int main() {
    std::string api_key = ""  ;
    OpenAIClient client(api_key);
    
    std::string response = client.generateText("Hello, how are you?");
    std::cout << "Response: " << response << std::endl;
    
    return 0;
}