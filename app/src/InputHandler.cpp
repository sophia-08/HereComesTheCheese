#include "InputHandler.h"
#include "OpenAIClient.h" 
#include "lc3_cpp.h"
#include <iostream>
#include <fstream>
#include "wave.h"
#include <regex>
#include <nlohmann/json.hpp>
#include "Utils.h"
#include "type_by_paste.h"
#include <CoreFoundation/CoreFoundation.h> 

using json = nlohmann::json;

namespace {
    lc3::Decoder decoder(10000, 16000);
}

InputHandler::InputHandler(ProxySocketServer* server, OpenAIClient* ai_client)
    : m_server(server)
    , m_ai_client(ai_client)
    , m_whisper_client("http://localhost:8080")
{
    m_short_commands = {
        "translate", "translated", "definition", "summarize",
        "summarized", "type", "input", "click"
    };
}

InputHandler::~InputHandler() = default;

void InputHandler::handleInputReport(uint8_t* report, CFIndex reportLength)
{
    #define BUF_SIZE 170
    int16_t pcm[BUF_SIZE];
    memset(pcm, 0, BUF_SIZE * 2);

    if (report[0] == 0x02)
    {
        bool end = true;
        for (int i = 5; i < 10; i++)
        {
            if (report[i] != 'f')
            {
                end = false;
            }
        }

        if (!end)
        {
            decoder.Decode(&report[1], 20, pcm);
            for (int i = 0; i < 160; i++)
            {
                m_pcm_data.push_back(pcm[i]);
            }

            decoder.Decode(&report[21], 20, pcm);
            for (int i = 0; i < 160; i++)
            {
                m_pcm_data.push_back(pcm[i]);
            }
        }
        else
        {
            processAudioData();
        }
    }
}

void InputHandler::processAudioData()
{
    try
    {
        saveWavFile(m_pcm_data, "out.wav");
        
        std::string transcription = m_whisper_client.transcribe(m_pcm_data);
        // transcription = "Remind me at 6pm to dinner";
        // transcription = "The application due at 11/6, remind me 1 day earlier, this is very important";
        transcription = "Send email to ken and lily that we will meet tomorrow noon";
        // transcription = "schedule a meeting with lily at 2pm for a quick sync up";        
        std::cout << "Transcription: " << transcription << std::endl;
        
        auto [command, parameter] = Utils::splitFirstWord(transcription);
        std::cout << "command: " << command << ", parameter: " << parameter << std::endl;
        
        if (m_short_commands.count(command) > 0)
        {
            processShortCommand(command, parameter);
        }
        else if (transcription.size() > 10)
        {
            // Attach current time at the begin
            transcription = std::string("Current time is ") + Utils::getCurrentTime() + ", " + transcription;
            std::string response = m_ai_client->generateText(transcription);
        }
        
        m_pcm_data.clear();
    }
    catch (const std::exception& e)
    {
        std::cerr << "Error processing audio data: " << e.what() << std::endl;
    }
}

void InputHandler::processShortCommand(const std::string& command, const std::string& parameter)
{
    if (command == "type" || command == "input")
    {
        auto cleanedText = Utils::cleanupText(parameter);
        Utils::copyTextToClipboard(cleanedText);
        Utils::pasteText();
    }
    else
    {
        std::string cleanParameter = cleanupParameter(parameter);
        json j = {
            {"type", "hid_cmd"},
            {"cmd_id", command},
            {"parameter", cleanParameter}
        };
        m_server->sendToClients(j.dump());
    }
}

std::string InputHandler::cleanupParameter(const std::string& parameter)
{
    std::string cleaned = parameter;
    // Keep only alphanumeric and space
    cleaned = std::regex_replace(cleaned, std::regex("[^a-zA-Z0-9\\s]+"), " ");
    // Replace multiple spaces with single space
    cleaned = std::regex_replace(cleaned, std::regex("\\s+"), " ");
    // Trim spaces at beginning and end
    cleaned = Utils::trim(cleaned);
    return cleaned;
}

void InputHandler::saveWavFile(const std::vector<int16_t>& pcm_data, const std::string& filename)
{
    FILE* fp = fopen(filename.c_str(), "wb");
    if (!fp)
    {
        throw std::runtime_error("Cannot create WAV file");
    }
    
    wave_write_header(fp, 16, 2, 16000, 1, pcm_data.size() - 320);
    wave_write_pcm(fp, 2, pcm_data.data() + 320, 1, 0, pcm_data.size() - 320);
    fclose(fp);
}