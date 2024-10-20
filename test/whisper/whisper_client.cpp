#include <cpr/cpr.h>
#include <fstream>
#include <vector>
#include <iostream>

class WhisperClient {
public:
    WhisperClient(const std::string& serverUrl) : baseUrl(serverUrl) {}

    std::string transcribe(const std::string& audioFilePath) {
        // Read audio file as binary
        std::ifstream file(audioFilePath, std::ios::binary);
        if (!file) {
            throw std::runtime_error("Failed to open audio file");
        }

        std::vector<char> buffer(std::istreambuf_iterator<char>(file), {});
        
        // Prepare multipart form data
        cpr::Multipart multipart{
            {"file", cpr::Buffer{buffer.begin(), buffer.end(), "audio.wav"}},
            {"response_format", "text"}
        };

        // Send POST request
        auto response = cpr::Post(
            cpr::Url{baseUrl + "/inference"},
            multipart
        );

        if (response.status_code != 200) {
            throw std::runtime_error("Server error: " + response.text);
        }

        return response.text;
    }

private:
    std::string baseUrl;
};

int main(int argc, char* argv[]) {
    if (argc != 2) {
        std::cerr << "Usage: " << argv[0] << " <audio_file_path>" << std::endl;
        return 1;
    }

    try {
        WhisperClient client("http://localhost:8080");
        std::string transcription = client.transcribe(argv[1]);
        std::cout << "Transcription: " << transcription << std::endl;
    } catch (const std::exception& e) {
        std::cerr << "Error: " << e.what() << std::endl;
        return 1;
    }
    return 0;
}