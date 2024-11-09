#pragma once

#include <vector>
#include <cstdint>
#include <string>
#include <unordered_set>
#include "WhisperClient.h"
#include "ProxySocketServer.h"
#include <CoreFoundation/CoreFoundation.h> 
class OpenAIClient;

class InputHandler {
public:
    InputHandler(ProxySocketServer* server, OpenAIClient* ai_client);
    ~InputHandler();

    void handleInputReport(uint8_t* report, CFIndex reportLength);

private:
    void processAudioData();
    void processShortCommand(const std::string& command, const std::string& parameter);
    std::string cleanupParameter(const std::string& parameter);
    void saveWavFile(const std::vector<int16_t>& pcm_data, const std::string& filename);

    ProxySocketServer* m_server;
    OpenAIClient* m_ai_client;
    WhisperClient m_whisper_client;
    std::vector<int16_t> m_pcm_data;
    std::unordered_set<std::string> m_short_commands;
};