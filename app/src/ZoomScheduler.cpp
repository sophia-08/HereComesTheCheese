#include "ZoomScheduler.h"
#include <iostream>
#include <cpr/cpr.h>
#include <cstdlib>
#include <stdexcept>
using json = nlohmann::json;

ZoomScheduler::ZoomScheduler() {
    m_accountId = getEnvVar("ZOOM_ACCOUNT_ID");
    m_clientId = getEnvVar("ZOOM_CLIENT_ID");
    m_clientSecret = getEnvVar("ZOOM_CLIENT_SECRET");
}

std::string ZoomScheduler::getEnvVar(const std::string& key) const {
    char* val = getenv(key.c_str());
    return val == nullptr ? std::string() : std::string(val);
}

std::string ZoomScheduler::getAccessToken() const {
    if (m_accountId.empty() || m_clientId.empty() || m_clientSecret.empty()) {
        throw std::runtime_error("Missing required Zoom credentials in environment variables. "
                                 "Please set ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, and ZOOM_CLIENT_SECRET.");
    }

    std::string url = "https://zoom.us/oauth/token?grant_type=account_credentials&account_id=" + m_accountId;

    auto response = cpr::Post(cpr::Url{url},
                              cpr::Authentication{m_clientId, m_clientSecret, cpr::AuthMode::BASIC},
                              cpr::Header{{"Content-Type", "application/json"}});

    if (response.status_code == 200) {
        json responseJson = json::parse(response.text);
        return responseJson["access_token"];
    } else {
        throw std::runtime_error("Failed to get access token: " + response.text);
    }
}

std::optional<std::string> ZoomScheduler::scheduleMeeting(const std::string& topic, 
                                                        const std::string& startTime, 
                                                        int duration) const {
    std::string accessToken = getAccessToken();
    std::string baseUrl = "https://api.zoom.us/v2";

    std::cout << "Zoom startTime: " << startTime << std::endl;
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
        std::cout << "Zoom meeting: " << meetingInfo << std::endl;
        return meetingInfo["join_url"].get<std::string>();
    } else {
        std::cerr << "Failed to schedule meeting. Status code: " << response.status_code << std::endl;
        std::cerr << "Response: " << response.text << std::endl;
        return std::nullopt;
    }
}