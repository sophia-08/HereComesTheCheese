#pragma once

#include <string>
#include <optional>
#include <nlohmann/json.hpp>

class ZoomScheduler {
private:
    std::string m_accountId;
    std::string m_clientId;
    std::string m_clientSecret;

    std::string getEnvVar(const std::string& key) const;
    std::string getAccessToken() const;

public:
    ZoomScheduler();

    std::optional<std::string> scheduleMeeting(const std::string& topic, const std::string& startTime, int duration) const;
};