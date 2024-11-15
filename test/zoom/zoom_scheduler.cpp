#include <iostream>
#include <cpr/cpr.h>
#include <nlohmann/json.hpp>
#include <ctime>
#include <iomanip>
#include <cstdlib>
#include <optional>

using json = nlohmann::json;

std::string getEnvVar(const std::string& key) {
    char* val = getenv(key.c_str());
    return val == nullptr ? std::string() : std::string(val);
}

std::string getAccessToken() {
    std::string accountId = getEnvVar("ZOOM_ACCOUNT_ID");
    std::string clientId = getEnvVar("ZOOM_CLIENT_ID");
    std::string clientSecret = getEnvVar("ZOOM_CLIENT_SECRET");

    if (accountId.empty() || clientId.empty() || clientSecret.empty()) {
        throw std::runtime_error("Missing required Zoom credentials in environment variables. "
                                 "Please set ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, and ZOOM_CLIENT_SECRET.");
    }

    std::string url = "https://zoom.us/oauth/token?grant_type=account_credentials&account_id=" + accountId;

    auto response = cpr::Post(cpr::Url{url},
                              cpr::Authentication{clientId, clientSecret, cpr::AuthMode::BASIC},
                              cpr::Header{{"Content-Type", "application/json"}});

    if (response.status_code == 200) {
        json responseJson = json::parse(response.text);
        return responseJson["access_token"];
    } else {
        throw std::runtime_error("Failed to get access token: " + response.text);
    }
}

std::optional<std::string> scheduleMeeting(const std::string& topic, const std::string& startTime, int duration) {
    std::string accessToken = getAccessToken();
    std::string baseUrl = "https://api.zoom.us/v2";

    json data = {
        {"topic", topic},
        {"type", 2},  // Scheduled meeting
        {"start_time", startTime},
        {"duration", duration},
        {"timezone", "America/Los_Angeles"},
        {"settings", {
            {"host_video", true},
            {"participant_video", true},
            {"join_before_host", false},
            {"mute_upon_entry", false},
            {"watermark", false},
            {"use_pmi", false},
            {"approval_type", 0},
            {"audio", "both"},
            {"auto_recording", "none"}
        }}
    };

    auto response = cpr::Post(cpr::Url{baseUrl + "/users/me/meetings"},
                              cpr::Header{{"Authorization", "Bearer " + accessToken},
                                          {"Content-Type", "application/json"}},
                              cpr::Body{data.dump()});

    if (response.status_code == 201) {
        json meetingInfo = json::parse(response.text);
        return meetingInfo["join_url"].get<std::string>();
    } else {
        std::cerr << "Failed to schedule meeting. Status code: " << response.status_code << std::endl;
        std::cerr << "Response: " << response.text << std::endl;
        return std::nullopt;
    }
}

int main() {
    std::string topic = "My Scheduled Zoom Meeting";
    
    // Get tomorrow's date
    std::time_t now = std::time(nullptr);
    std::tm* tomorrow = std::localtime(&now);
    tomorrow->tm_mday += 1;
    mktime(tomorrow);

    // Format the date string
    std::ostringstream oss;
    oss << std::put_time(tomorrow, "%Y-%m-%d %H:%M:%S");
    std::string startTime = oss.str();

    int duration = 60;  // minutes
    std::cout << "StartTime: " << startTime << ", Duration: " << duration << std::endl;

    try {
        auto joinUrl = scheduleMeeting(topic, startTime, duration);
        if (joinUrl) {
            std::cout << "Meeting scheduled successfully!" << std::endl;
            std::cout << "Join URL: " << *joinUrl << std::endl;
        } else {
            std::cout << "Failed to schedule the meeting." << std::endl;
        }
    } catch (const std::exception& e) {
        std::cerr << "Error: " << e.what() << std::endl;
        return 1;
    }

    return 0;
}