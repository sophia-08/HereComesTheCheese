#pragma once

#include <string>
#include <vector>
#include <map>

class ExecutionEngine {
public:
    ExecutionEngine();
    ~ExecutionEngine();

    void execute(const std::string& response);
    std::vector<std::string> parseFunctionCalls(const std::string& response);
    void parseSingleFunctionCall(const std::string& call, std::string& functionName, 
                               std::vector<std::string>& params);
    std::string executeFunctionCall(const std::string& functionName, 
                                  const std::vector<std::string>& params);

private:
    std::map<std::string, std::string> m_variables;
};