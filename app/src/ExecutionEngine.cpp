#include "ExecutionEngine.h"
#include <iostream>
#include <sstream>
#include <regex>
#include <cstdlib>
#include "Utils.h"

ExecutionEngine::ExecutionEngine() = default;
ExecutionEngine::~ExecutionEngine() = default;

void ExecutionEngine::execute(const std::string& response)
{
    std::cout << "execute: Starting execution with response:\n" << response << std::endl;
    std::vector<std::string> functionCalls = parseFunctionCalls(response);

    std::cout << "execute: Parsed " << functionCalls.size() << " function calls." << std::endl;

    for (size_t i = 0; i < functionCalls.size(); ++i)
    {
        const auto& call = functionCalls[i];
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

        // Replace variables in parameters
        for (auto& param : params)
        {
            std::cout << "execute: Processing param: " << param << std::endl;
            if (param.length() >= 3 && param[0] == '[' && param[param.length() - 1] == ']' && param[1] == '$')
            {
                std::string innerParam = param.substr(1, param.length() - 2);
                std::cout << "execute: Found array parameter with variable: " << innerParam << std::endl;
                if (m_variables.find(innerParam) != m_variables.end())
                {
                    param = m_variables[innerParam];
                    std::cout << "execute: Replaced array parameter with: " << param << std::endl;
                }
            }
            else if (param[0] == '$')
            {
                if (m_variables.find(param) != m_variables.end())
                {
                    param = m_variables[param];
                    std::cout << "execute: Replaced variable " << param << " with value: " << param << std::endl;
                }
            }
        }

        std::string result = executeFunctionCall(functionName, params);
        result = Utils::trim(result);

        // Store result in variables
        std::string variableName = "$" + std::to_string(m_variables.size() + 1);
        m_variables[variableName] = result;
        
        std::cout << "execute: Stored result in variable " << variableName << std::endl;
    }

    std::cout << "execute: Finished execution." << std::endl;
}

std::vector<std::string> ExecutionEngine::parseFunctionCalls(const std::string& response)
{
    std::cout << "parseFunctionCalls: Starting to parse response" << std::endl;
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
                functionCall = functionCall.substr(0, endPlanPos);
                calls.push_back(functionCall);
                calls.push_back("<END_OF_PLAN>");
                break;
            }
            else
            {
                calls.push_back(functionCall);
            }
        }
        else if (line == "<END_OF_PLAN>")
        {
            calls.push_back("<END_OF_PLAN>");
            break;
        }
    }

    return calls;
}

void ExecutionEngine::parseSingleFunctionCall(const std::string& call, 
                                            std::string& functionName, 
                                            std::vector<std::string>& params)
{
    size_t openParen = call.find('(');
    size_t closeParen = call.rfind(')');

    if (openParen != std::string::npos && closeParen != std::string::npos)
    {
        functionName = Utils::trim(call.substr(0, openParen));
        std::string paramsStr = call.substr(openParen + 1, closeParen - openParen - 1);

        std::istringstream iss(paramsStr);
        std::string param;
        while (std::getline(iss, param, ','))
        {
            param = std::regex_replace(param, std::regex("^\\s+|\\s+$|\""), "");
            params.push_back(param);
        }
    }
}

std::string ExecutionEngine::executeFunctionCall(const std::string& functionName, 
                                               const std::vector<std::string>& params)
{
    std::string scriptPath = functionName + ".scpt";
    std::stringstream command;
    command << "osascript \"" << scriptPath << "\"";

    for (const auto& param : params)
    {
        command << " \"" << param << "\"";
    }

    std::cout << "Executing command: " << command.str() << std::endl;

    std::string result;
    FILE* pipe = popen(command.str().c_str(), "r");
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

    return result;
}