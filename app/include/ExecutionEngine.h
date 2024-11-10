#pragma once

#include <string>
#include <vector>
#include <map>
#include <memory>

class ZoomScheduler;

class ExecutionEngine {
public:
    ExecutionEngine();
    virtual ~ExecutionEngine();

    virtual void execute(const std::string& response);
    std::vector<std::string> parseFunctionCalls(const std::string& response);
    void parseSingleFunctionCall(const std::string& call, std::string& functionName, 
                               std::vector<std::string>& params);
    virtual std::string executeFunctionCall(const std::string& functionName, 
                                  const std::vector<std::string>& params);

protected:
    std::map<std::string, std::string> m_variables;
    std::unique_ptr<ZoomScheduler> m_zoomScheduler;
};