#include "HIDDevice.h"
#include "OpenAIClient.h"
#include "Logger.h"
#include <sstream>
#include <iostream>
#include <regex>
#include "prompt.h"
#include "lc3_cpp.h"
#include "type_by_paste.h"
#include "wave.h"
#include <cpr/cpr.h>
#include <nlohmann/json.hpp>

using json = nlohmann::json;

// Global variables and constants
lc3::Decoder decoder(10000, 16000);
std::vector<int16_t> pcm_data;

struct WAVHeader
{
    char riff[4] = {'R', 'I', 'F', 'F'};
    uint32_t fileSize;
    char wave[4] = {'W', 'A', 'V', 'E'};
    char fmt[4] = {'f', 'm', 't', ' '};
    uint32_t fmtSize = 16;
    uint16_t audioFormat = 1; // PCM
    uint16_t numChannels = 1; // Mono
    uint32_t sampleRate = 16000;
    uint32_t byteRate = 32000; // sampleRate * numChannels * bitsPerSample/8
    uint16_t blockAlign = 2;   // numChannels * bitsPerSample/8
    uint16_t bitsPerSample = 16;
    char data[4] = {'d', 'a', 't', 'a'};
    uint32_t dataSize;
};
std::unordered_set<std::string> shortCommands = {
    "translate", "translated", "definition", "summarize",
    "summarized", "type", "input", "click"};
std::string trim(const std::string &str)
{
    const std::string whitespace = " \t\n\r\f\v";
    std::size_t first = str.find_first_not_of(whitespace);
    if (first == std::string::npos)
        return "";
    std::size_t last = str.find_last_not_of(whitespace);
    return str.substr(first, last - first + 1);
}

std::pair<std::string, std::string>
splitFirstWord(const std::string &sentence)
{
    std::string trimmed = trim(sentence);
    std::size_t spacePos = trimmed.find(' ');

    // If no space found, return the whole string as first word and empty string
    std::string firstWord;
    std::string remainder;

    if (spacePos == std::string::npos)
    {
        firstWord = trimmed;
        remainder = "";
    }
    else
    {
        // Split into first word and remainder
        firstWord = trimmed.substr(0, spacePos);
        remainder = trim(trimmed.substr(spacePos + 1));
    }

    // Transform first word to lowercase
    std::transform(firstWord.begin(), firstWord.end(), firstWord.begin(),
                   ::tolower);

    // Remove punctuation from first word
    firstWord.erase(std::remove_if(firstWord.begin(), firstWord.end(), ::ispunct),
                    firstWord.end());

    std::cout << "split: " << firstWord << ", " << remainder << std::endl;

    return std::make_pair(trim(firstWord), remainder);
}

class WhisperClient
{
public:
    WhisperClient(const std::string &serverUrl) : baseUrl(serverUrl) {}

    std::string transcribe(const std::vector<int16_t> &pcmData)
    {
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

        if (response.status_code != 200)
        {
            throw std::runtime_error("Server error: " + response.text);
        }

        return response.text;
    }

private:
    std::string baseUrl;
};

HIDDevice::HIDDevice(IOHIDDeviceRef device, ProxySocketServer *server)
    : m_device(device), m_server(server), m_connected(true)
{

    IOHIDDeviceOpen(m_device, kIOHIDOptionsTypeNone);
    m_ai_client = std::make_unique<OpenAIClient>(this, system_message);
    log("HIDDevice created");
}

HIDDevice::~HIDDevice()
{
    if (m_connected)
    {
        IOHIDDeviceClose(m_device, kIOHIDOptionsTypeNone);
    }
    log("HIDDevice destroyed");
}

// #include <algorithm>
// #include <cctype>

// // Helper function to trim whitespace from both ends of a string
// std::string trim(const std::string &s)
// {
//     auto wsfront = std::find_if_not(s.begin(), s.end(), [](int c){ return std::isspace(c); });
//     auto wsback = std::find_if_not(s.rbegin(), s.rend(), [](int c){ return std::isspace(c); }).base();
//     return (wsback <= wsfront ? std::string() : std::string(wsfront, wsback));
// }

void HIDDevice::execute(const std::string &response)
{
    std::cout << "execute: Starting execution with response:\n" << response << std::endl;
    std::vector<std::string> functionCalls = parseFunctionCalls(response);
    std::map<std::string, std::string> variables;

    std::cout << "execute: Parsed " << functionCalls.size() << " function calls." << std::endl;

    for (size_t i = 0; i < functionCalls.size(); ++i)
    {
        const auto &call = functionCalls[i];
        std::cout << "execute: Processing function call " << i + 1 << ": " << call << std::endl;

        if (call == "<END_OF_PLAN>")
        {
            std::cout << "execute: Reached END_OF_PLAN, stopping execution." << std::endl;
            break;
        }

        std::string functionName;
        std::vector<std::string> params;
        parseSingleFunctionCall(call, functionName, params);

        std::cout << "execute: Parsed function name: " << functionName << std::endl;
        std::cout << "execute: Parsed parameters:" << std::endl;
        for (size_t j = 0; j < params.size(); ++j)
        {
            std::cout << "  Param " << j + 1 << ": " << params[j] << std::endl;
        }

        // Replace $n variables with their values
        for (auto &param : params)
        {
            std::cout << "execute: Processing param: " << param << std::endl;
            if (param.length() >= 3 && param[0] == '[' && param[param.length() - 1] == ']' && param[1] == '$')
            {
                // Handle array parameter with variable
                std::string innerParam = param.substr(1, param.length() - 2);
                std::cout << "execute: Found array parameter with variable: " << innerParam << std::endl;
                if (variables.find(innerParam) != variables.end())
                {
                    param = variables[innerParam];
                    std::cout << "execute: Replaced array parameter with: " << param << std::endl;
                }
                else
                {
                    std::cout << "execute: Variable " << innerParam << " not found in map!" << std::endl;
                }
            }
            else if (param[0] == '$')
            {
                std::cout << "execute: Replacing variable " << param;
                if (variables.find(param) != variables.end())
                {
                    param = variables[param];
                    std::cout << " with value: " << param << std::endl;
                }
                else
                {
                    std::cout << " - Variable not found in map!" << std::endl;
                }
            }
        }

        std::cout << "execute: Calling executeFunctionCall with:" << std::endl;
        std::cout << "  Function: " << functionName << std::endl;
        std::cout << "  Parameters:" << std::endl;
        for (size_t j = 0; j < params.size(); ++j)
        {
            std::cout << "    Param " << j + 1 << ": " << params[j] << std::endl;
        }

        std::string result = executeFunctionCall(functionName, params);
        result = trim(result);  // Trim the result

        std::cout << "execute: Function call result (after trimming): " << result << std::endl;

        // Store result for potential future use
        std::string variableName = "$" + std::to_string(variables.size() + 1);
        variables[variableName] = result;
        std::cout << "execute: Stored result in variable " << variableName << std::endl;

        std::cout << "execute: Current variables map:" << std::endl;
        for (const auto &var : variables)
        {
            std::cout << "  " << var.first << " = " << var.second << std::endl;
        }
    }

    std::cout << "execute: Finished execution." << std::endl;
}

void HIDDevice::sendReport(const std::vector<uint8_t> &report)
{
    IOHIDDeviceSetReport(m_device, kIOHIDReportTypeOutput, 0, report.data(),
                         report.size());
    log("Report sent to HID device");
}

void HIDDevice::inputReportCallback(void *context, IOReturn result,
                                    void *sender, IOHIDReportType type,
                                    uint32_t reportID, uint8_t *report,
                                    CFIndex reportLength)
{
    (void)result;
    (void)type;
    (void)sender;
    (void)reportID;

    auto *device = static_cast<HIDDevice *>(context);
    std::cout << "inputReportCallback id: " << reportID
              << ",len: " << reportLength << std::endl;
    device->handleInputReport(report, reportLength);
}

void HIDDevice::handleInputReport(uint8_t *report, CFIndex reportLength)
{
    std::stringstream ss;
#define BUF_SIZE 170
    int16_t pcm[BUF_SIZE];
    memset(pcm, 0, BUF_SIZE * 2);

    if (report[0] == 0x02)
    {
        // Cutsomer report
        bool end = true;
        for (int i = 5; i < 10; i++)
        {
            if (report[i] != 'f')
            {
                end = false;
            }
        }
        if (end == false)
        {
            decoder.Decode(&report[1], 20, pcm);
            for (int i = 0; i < 160; i++)
            {
                pcm_data.push_back(pcm[i]);
            }

            decoder.Decode(&report[21], 20, pcm);
            for (int i = 0; i < 160; i++)
            {
                pcm_data.push_back(pcm[i]);
            }
            // std::cout << std::hex << std::setfill('0');
            // for (int i=0; i<BUF_SIZE; i++) {
            //   std::cout << std::setw(4) << static_cast<uint16_t>( pcm[i]) << " ";
            // }
            // std::cout << std::endl  << std::dec;
        }
        else
        {

#if 0
      // OpenAIClient ai_client(this, "system_message");
      // std::string ss = "{\"command\":\"launch "
      //                  "browser\",\"parameter\":\"https://www.youtube.com/"
      //                  "results?search_query=purple+rain\"}";

      // std::string ss =
      // "{\"command\":\"definition\",\"parameter\":\"https://www.youtube.com/"
      //            "results?search_query=purple+rain\"}";

      // std::string ss =
      // "{\"command\":\"summarize\",\"parameter\":\"https://www.youtube.com/"
      //             "results?search_query=purple+rain\"}";

      std::string ss = "{\"command\":\"click\",\"parameter\":\"Harris\"}";

      // json response_json = json::parse(ss);
      m_ai_client->processResponse(ss);
      return;

#else
            FILE *fp;
            std::cout << "Save file " << pcm_data.size() << std::endl;
            if ((fp = fopen("out.wav", "wb")) == NULL)
            {
                std::cerr << "Cannot create file";
                return;
            }
            wave_write_header(fp, 16, 2, 16000, 1, pcm_data.size() - 320);

            wave_write_pcm(fp, 2, pcm_data.data() + 320, 1, 0, pcm_data.size() - 320);
            fclose(fp);

            try
            {
                // Your PCM data
                // std::vector<int16_t> audioData; // Your 16-bit PCM samples

                WhisperClient whisper_client("http://localhost:8080");
                std::string transcription = whisper_client.transcribe(pcm_data);

                // transcription = "Remind me at 6pm to dinner";
                // transcription = "Send email to ken and lily that we will meet tomorrow noon";
                transcription = "schedule a meeting with lily at 2pm for a quick sync up";

                std::cout << "Transcription: " << transcription << std::endl;

                auto cmd = splitFirstWord(transcription);
                std::cout << "cmd: " << cmd.first << " len=" << cmd.first.size()
                          << std::endl;
                if (shortCommands.count(cmd.first.c_str()) > 0)
                {
                    if ((cmd.first.compare("type") == 0) ||
                        (cmd.first.compare("input") == 0))
                    {
                        std::cout << "Type: " << cmd.second << std::endl;

                        auto str1 = std::regex_replace(cmd.second,
                                                       std::regex("\\[BLANK_AUDIO\\]"), "");
                        std::cout << "Type after clean up: " << str1 << std::endl;

                        copyTextToClipboard(str1);
                        std::cout << "Simulating paste of: " << str1 << std::endl;
                        pasteText();
                    }
                    else
                    {
                        std::cout << "Short command: " << cmd.first << ", " << cmd.second
                                  << std::endl;

                        std::string param = cmd.second;
                        // Keep only alphanumeric and space, replace everything else with
                        // space
                        param =
                            std::regex_replace(param, std::regex("[^a-zA-Z0-9\\s]+"), " ");
                        // Replace all whitespace (including newlines) with single space
                        param = std::regex_replace(param, std::regex("\\s+"), " ");
                        // Trim spaces at beginning and end
                        param = std::regex_replace(param, std::regex("^\\s+|\\s+$"), "");

                        std::string cmd_id = cmd.first;
                        // Keep only alphanumeric and space, replace everything else with
                        // space
                        cmd_id =
                            std::regex_replace(cmd_id, std::regex("[^a-zA-Z0-9\\s]+"), " ");
                        // Replace all whitespace (including newlines) with single space
                        cmd_id = std::regex_replace(cmd_id, std::regex("\\s+"), " ");
                        // Trim spaces at beginning and end
                        cmd_id = std::regex_replace(cmd_id, std::regex("^\\s+|\\s+$"), "");

                        json j = {
                            {"type", "hid_cmd"}, {"cmd_id", cmd_id}, {"parameter", param}};
                        std::string jsonReport = j.dump();
                        m_server->sendToClients(jsonReport);

                        log("Sent short command to clients: " + jsonReport);
                    }
                }
                else if (transcription.size() > 10)
                {

#if 1

                    std::string response = m_ai_client->generateText(transcription);
                    // m_ai_client->processResponse(response);
#endif
                }
                else
                {
                    std::cout << "Transcription: " << transcription << ", ignored"
                              << std::endl;
                }
            }
            catch (const std::exception &e)
            {
                std::cerr << "Error: " << e.what() << std::endl;
            }
#endif

            pcm_data.clear();
        }
    } // if (report[0] == 0x02)

#if 0
    ss << std::hex << std::setfill('0');
    for (CFIndex i = 0; i < reportLength; i++) {
      ss << std::setw(2) << static_cast<int>(report[i]);
    }

    std::string jsonReport =
        JSON::makeObject({{"type", "hid_report"}, {"data", ss.str()}});

    m_server->sendToClients(jsonReport);
    log("Input report received and sent to clients. Length: " +
        std::to_string(reportLength) + ": " + jsonReport);
#endif
}

void HIDDevice::registerInputReportCallback()
{
    IOHIDDeviceRegisterInputReportCallback(m_device, m_report, sizeof(m_report),
                                           inputReportCallback, this);
    log("Input report callback registered");
}

void HIDDevice::disconnect()
{
    if (m_connected)
    {
        IOHIDDeviceClose(m_device, kIOHIDOptionsTypeNone);
        m_connected = false;
        log("HIDDevice disconnected");
    }
}

bool HIDDevice::isConnected() const
{
    return m_connected;
}

IOHIDDeviceRef HIDDevice::getDevice() const
{
    return m_device;
}

std::vector<std::string> HIDDevice::parseFunctionCalls(const std::string &response)
{
    std::cout << "parseFunctionCalls: Starting to parse response" << std::endl;
    std::cout << "parseFunctionCalls: Full response:\n" << response << std::endl;

    std::vector<std::string> calls;
    std::istringstream iss(response);
    std::string line;
    int lineNumber = 0;

    while (std::getline(iss, line))
    {
        lineNumber++;
        std::cout << "parseFunctionCalls: Processing line " << lineNumber << ": " << line << std::endl;

        size_t dotPos = line.find(". ");
        if (dotPos != std::string::npos)
        {
            std::string functionCall = line.substr(dotPos + 2);
            size_t endPlanPos = functionCall.find("<END_OF_PLAN>");
            if (endPlanPos != std::string::npos)
            {
                // Remove <END_OF_PLAN> from the function call
                functionCall = functionCall.substr(0, endPlanPos);
                std::cout << "parseFunctionCalls: Found function call (with end marker): " << functionCall << std::endl;
                calls.push_back(functionCall);
                std::cout << "parseFunctionCalls: Found end of plan marker" << std::endl;
                break; // Exit the loop as we've reached the end of the plan
            }
            else
            {
                std::cout << "parseFunctionCalls: Found function call: " << functionCall << std::endl;
                calls.push_back(functionCall);
            }
        }
        else if (line == "<END_OF_PLAN>")
        {
            std::cout << "parseFunctionCalls: Found standalone end of plan marker" << std::endl;
            break; // Exit the loop as we've reached the end of the plan
        }
        else
        {
            std::cout << "parseFunctionCalls: Line doesn't contain a function call or end marker, skipping" << std::endl;
        }
    }

    std::cout << "parseFunctionCalls: Finished parsing. Found " << calls.size() << " function calls" << std::endl;
    std::cout << "parseFunctionCalls: Parsed function calls:" << std::endl;
    for (size_t i = 0; i < calls.size(); ++i)
    {
        std::cout << "  " << i + 1 << ": " << calls[i] << std::endl;
    }

    return calls;
}

void HIDDevice::parseSingleFunctionCall(const std::string &call, std::string &functionName, std::vector<std::string> &params)
{
    size_t openParen = call.find('(');
    size_t closeParen = call.rfind(')');

    if (openParen != std::string::npos && closeParen != std::string::npos)
    {
        functionName = call.substr(0, openParen);
        std::string paramsStr = call.substr(openParen + 1, closeParen - openParen - 1);

        // Simple parsing, assumes parameters are comma-separated
        std::istringstream iss(paramsStr);
        std::string param;
        while (std::getline(iss, param, ','))
        {
            // Trim whitespace and remove quotes
            param = std::regex_replace(param, std::regex("^\\s+|\\s+$|\""), "");
            params.push_back(param);
        }
    }
}

#include <cstdlib>
#include <sstream>
#include <unistd.h>
#include <limits.h>
#include <libgen.h>

std::string HIDDevice::executeFunctionCall(const std::string &functionName, const std::vector<std::string> &params)
{
    // Construct the path to the script
    std::string scriptPath = functionName + ".scpt";

    // Construct the osascript command
    std::stringstream command;
    command << "osascript \"" << scriptPath << "\"";

    // Add parameters
    for (const auto &param : params)
    {
        command << " \"" << param << "\"";
    }

    std::cout << "Executing command: " << command.str() << std::endl;

    std::string result;
    FILE *pipe = popen(command.str().c_str(), "r");
    if (pipe)
    {
        char buffer[128];
        while (!feof(pipe))
        {
            if (fgets(buffer, 128, pipe) != NULL)
                result += buffer;
        }
        pclose(pipe);
    }
    else
    {
        std::cerr << "Failed to execute command: " << command.str() << std::endl;
    }

    std::cout << "Command result: " << result << std::endl;

    return result;
}