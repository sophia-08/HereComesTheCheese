#include "ExecutionEngine.h"
#include "Utils.h"
#include "ZoomScheduler.h"
#include <cstdlib>
#include <iostream>
#include <regex>
#include <sstream>

ExecutionEngine::ExecutionEngine()
    : m_zoomScheduler(std::make_unique<ZoomScheduler>()) {}
ExecutionEngine::~ExecutionEngine() = default;

void ExecutionEngine::execute(const std::string &response) {
  std::cout << "execute: Starting execution with response:\n"
            << response << std::endl;
  std::vector<std::string> functionCalls = parseFunctionCalls(response);

  std::cout << "execute: Parsed " << functionCalls.size() << " function calls."
            << std::endl;

  for (size_t i = 0; i < functionCalls.size(); ++i) {
    const auto &call = functionCalls[i];
    std::cout << "execute: Processing function call " << i + 1 << ": " << call
              << std::endl;

    if (call == "<END_OF_PLAN>") {
      std::cout << "execute: Reached END_OF_PLAN, stopping execution."
                << std::endl;
      break;
    }

    std::string functionName;
    std::vector<std::string> params;
    parseSingleFunctionCall(call, functionName, params);

    std::cout << "execute: Parsed function name: " << functionName << std::endl;
    std::cout << "execute: Parsed parameters:" << std::endl;
    for (size_t j = 0; j < params.size(); ++j) {
      std::cout << "  Param " << j + 1 << ": " << params[j] << std::endl;
    }

    // Replace variables in parameters
    for (auto &param : params) {
      std::cout << "execute: Processing param: " << param << std::endl;
      if (param.length() >= 2 && param[0] == '[' &&
          param[param.length() - 1] == ']') {
        // This is an array parameter
        std::vector<std::string> innerParams;
        std::string innerParamsStr = param.substr(1, param.length() - 2);
        std::string currentInnerParam;
        bool inQuotes = false;

        for (size_t j = 0; j < innerParamsStr.length(); ++j) {
          char c = innerParamsStr[j];
          if (c == '"') {
            inQuotes = !inQuotes;
          } else if (c == ',' && !inQuotes) {
            std::string processedParam = Utils::trim(currentInnerParam);
            // Remove quotes if present
            if (processedParam.length() >= 2 && processedParam[0] == '"' &&
                processedParam[processedParam.length() - 1] == '"') {
              processedParam =
                  processedParam.substr(1, processedParam.length() - 2);
            }

            if (processedParam[0] == '$') {
              int varIndex = std::stoi(processedParam.substr(1)) - 1;
              if (varIndex >= 0 && varIndex < static_cast<int>(i)) {
                std::string varName = "$" + std::to_string(varIndex + 1);
                if (m_variables.find(varName) != m_variables.end()) {
                  processedParam = m_variables[varName];
                  std::cout << "execute: Replaced variable " << varName
                            << " with value: " << processedParam << std::endl;
                }
              }
            }
            innerParams.push_back(processedParam);
            currentInnerParam.clear();
          } else {
            currentInnerParam += c;
          }
        }

        // Process the last parameter
        if (!currentInnerParam.empty()) {
          std::string processedParam = Utils::trim(currentInnerParam);
          if (processedParam.length() >= 2 && processedParam[0] == '"' &&
              processedParam[processedParam.length() - 1] == '"') {
            processedParam =
                processedParam.substr(1, processedParam.length() - 2);
          }

          if (processedParam[0] == '$') {
            int varIndex = std::stoi(processedParam.substr(1)) - 1;
            if (varIndex >= 0 && varIndex < static_cast<int>(i)) {
              std::string varName = "$" + std::to_string(varIndex + 1);
              if (m_variables.find(varName) != m_variables.end()) {
                processedParam = m_variables[varName];
                std::cout << "execute: Replaced variable " << varName
                          << " with value: " << processedParam << std::endl;
              }
            }
          }
          innerParams.push_back(processedParam);
        }

        // Reconstruct the array parameter
        param = "[" + Utils::join(innerParams, ", ") + "]";
        std::cout << "execute: Processed array parameter: " << param
                  << std::endl;
      } else if (param[0] == '$') {
        int varIndex = std::stoi(param.substr(1)) - 1;
        if (varIndex >= 0 && varIndex < static_cast<int>(i)) {
          std::string varName = "$" + std::to_string(varIndex + 1);
          if (m_variables.find(varName) != m_variables.end()) {
            param = m_variables[varName];
            std::cout << "execute: Replaced variable " << varName
                      << " with value: " << param << std::endl;
          }
        }
      } else {
        // Handle variables within strings
        size_t pos = 0;
        while ((pos = param.find('$', pos)) != std::string::npos) {
          // Find the end of the variable number
          size_t endPos = pos + 1;
          while (endPos < param.length() && std::isdigit(param[endPos])) {
            endPos++;
          }

          if (endPos > pos + 1) {
            std::string varNum = param.substr(pos + 1, endPos - pos - 1);
            int varIndex = std::stoi(varNum) - 1;
            if (varIndex >= 0 && varIndex < static_cast<int>(i)) {
              std::string varName = "$" + varNum;
              if (m_variables.find(varName) != m_variables.end()) {
                std::string replacement = m_variables[varName];
                param.replace(pos, endPos - pos, replacement);
                std::cout << "execute: Replaced variable " << varName
                          << " in string with value: " << replacement
                          << std::endl;
                pos += replacement.length();
              }
            }
          } else {
            pos++;
          }
        }
      }
    }

    std::cout << "execute: Calling executeFunctionCall with:" << std::endl;
    std::cout << "  Function name: " << functionName << std::endl;
    std::cout << "  Parameters:" << std::endl;
    for (const auto &p : params) {
      std::cout << "    " << p << std::endl;
    }

    std::string result = executeFunctionCall(functionName, params);
    result = Utils::trim(result);

    // Store result in variables
    std::string variableName = "$" + std::to_string(i + 1);
    m_variables[variableName] = result;

    std::cout << "execute: Stored result in variable " << variableName << ": "
              << result << std::endl;
  }

  std::cout << "execute: Finished execution." << std::endl;
}

std::vector<std::string>
ExecutionEngine::parseFunctionCalls(const std::string &response) {
  std::cout << "parseFunctionCalls: Starting to parse response" << std::endl;
  std::vector<std::string> calls;
  std::istringstream iss(response);
  std::string line;
  int lineNumber = 0;

  while (std::getline(iss, line)) {
    lineNumber++;
    std::cout << "parseFunctionCalls: Processing line " << lineNumber << ": "
              << line << std::endl;

    size_t dotPos = line.find(". ");
    if (dotPos != std::string::npos) {
      std::string functionCall = line.substr(dotPos + 2);
      size_t endPlanPos = functionCall.find("<END_OF_PLAN>");
      if (endPlanPos != std::string::npos) {
        functionCall = functionCall.substr(0, endPlanPos);
        calls.push_back(functionCall);
        calls.push_back("<END_OF_PLAN>");
        break;
      } else {
        calls.push_back(functionCall);
      }
    } else if (line == "<END_OF_PLAN>") {
      calls.push_back("<END_OF_PLAN>");
      break;
    }
  }

  return calls;
}

void ExecutionEngine::parseSingleFunctionCall(
    const std::string &call, std::string &functionName,
    std::vector<std::string> &params) {
  size_t openParen = call.find('(');
  size_t closeParen = call.rfind(')');

  if (openParen != std::string::npos && closeParen != std::string::npos) {
    functionName = Utils::trim(call.substr(0, openParen));
    std::string paramsStr =
        call.substr(openParen + 1, closeParen - openParen - 1);

    std::vector<std::string> tempParams;
    std::string currentParam;
    int bracketCount = 0;
    bool inQuotes = false;

    for (char c : paramsStr) {
      if (c == '"' && bracketCount == 0) {
        inQuotes = !inQuotes;
        if (!inQuotes && !currentParam.empty()) {
          tempParams.push_back(Utils::trim(currentParam));
          currentParam.clear();
        }
      } else if (c == '[') {
        bracketCount++;
        currentParam += c;
      } else if (c == ']') {
        bracketCount--;
        currentParam += c;
      } else if (c == ',' && bracketCount == 0 && !inQuotes) {
        if (!currentParam.empty()) {
          tempParams.push_back(Utils::trim(currentParam));
          currentParam.clear();
        }
      } else {
        currentParam += c;
      }
    }

    if (!currentParam.empty()) {
      tempParams.push_back(Utils::trim(currentParam));
    }

    params = tempParams;
  }
}

std::string
ExecutionEngine::executeFunctionCall(const std::string &functionName,
                                     const std::vector<std::string> &params) {
  if (functionName == "create_zoom_meeting") {
    if (params.size() < 3) {
      return "Error: create_zoom_meeting requires 3 parameters (topic, "
             "start_time, duration)";
    }

    std::string topic = params[0];
    std::string startTime = params[1];

    // Convert datetime format from "YYYY-MM-DD HH:MM:SS" to
    // "YYYY-MM-DDTHH:MM:SS"
    size_t spacePos = startTime.find(' ');
    if (spacePos != std::string::npos) {
      startTime.replace(spacePos, 1, "T");
    }

    int duration;
    try {
      duration = std::stoi(params[2]);
    } catch (const std::exception &e) {
      return "Error: Invalid duration parameter. Must be an integer.";
    }

    try {
      auto joinUrl =
          m_zoomScheduler->scheduleMeeting(topic, startTime, duration);
      if (joinUrl) {
        return *joinUrl;
      } else {
        return "Error: Failed to schedule the meeting.";
      }
    } catch (const std::exception &e) {
      return std::string("Error: ") + e.what();
    }
  } else {
    std::string scriptPath = functionName + ".scpt";
    std::stringstream command;
    command << "osascript \"" << scriptPath << "\"";

    for (const auto &param : params) {
      command << " \"" << param << "\"";
    }

    std::cout << "Executing command: " << command.str() << std::endl;

    std::string result;
    FILE *pipe = popen(command.str().c_str(), "r");
    if (pipe) {
      char buffer[128];
      while (!feof(pipe)) {
        if (fgets(buffer, 128, pipe) != NULL)
          result += buffer;
      }
      pclose(pipe);
    } else {
      std::cerr << "Failed to execute command: " << command.str() << std::endl;
    }

    return result;
  }
}