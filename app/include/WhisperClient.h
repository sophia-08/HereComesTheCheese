#pragma once

#include <string>
#include <vector>
#include <cstdint>

struct WAVHeader {
    char riff[4] = {'R', 'I', 'F', 'F'};
    uint32_t fileSize;
    char wave[4] = {'W', 'A', 'V', 'E'};
    char fmt[4] = {'f', 'm', 't', ' '};
    uint32_t fmtSize = 16;
    uint16_t audioFormat = 1;    // PCM
    uint16_t numChannels = 1;    // Mono
    uint32_t sampleRate = 16000;
    uint32_t byteRate = 32000;   // sampleRate * numChannels * bitsPerSample/8
    uint16_t blockAlign = 2;     // numChannels * bitsPerSample/8
    uint16_t bitsPerSample = 16;
    char data[4] = {'d', 'a', 't', 'a'};
    uint32_t dataSize;
};

class WhisperClient {
public:
    WhisperClient(const std::string& serverUrl);
    ~WhisperClient();

    std::string transcribe(const std::vector<int16_t>& pcmData);

private:
    std::string baseUrl;
};