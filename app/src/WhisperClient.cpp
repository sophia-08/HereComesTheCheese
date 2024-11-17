#include "WhisperClient.h"
#include <cpr/cpr.h>
#include <cstring>
#include <stdexcept>

WhisperClient::WhisperClient(const std::string &serverUrl)
    : baseUrl(serverUrl) {}

WhisperClient::~WhisperClient() = default;

std::string WhisperClient::transcribe(const std::vector<int16_t> &pcmData) {
  // Create WAV header
  WAVHeader header;
  header.dataSize = pcmData.size() * sizeof(int16_t);
  header.fileSize =
      header.dataSize + sizeof(WAVHeader) - 8; // -8 for RIFF header

  // Combine header and PCM data
  std::vector<char> wavFile(sizeof(WAVHeader) + header.dataSize);
  std::memcpy(wavFile.data(), &header, sizeof(WAVHeader));
  std::memcpy(wavFile.data() + sizeof(WAVHeader), pcmData.data(),
              header.dataSize);

  cpr::Multipart multipart{
      {"file", cpr::Buffer{wavFile.begin(), wavFile.end(), "audio.wav"}},
      {"response_format", "text"}};

  auto response = cpr::Post(cpr::Url{baseUrl + "/inference"}, multipart);

  if (response.status_code != 200) {
    throw std::runtime_error("Server error: " + response.text);
  }

  return response.text;
}