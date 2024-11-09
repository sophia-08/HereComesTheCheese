#include <iostream>
#include <string>
#include <vector>
#include <sstream>
#include <memory>
#include <array>

std::string exec(const char* cmd) {
    std::array<char, 128> buffer;
    std::string result;
    std::unique_ptr<FILE, decltype(&pclose)> pipe(popen(cmd, "r"), pclose);
    if (!pipe) {
        throw std::runtime_error("popen() failed!");
    }
    while (fgets(buffer.data(), buffer.size(), pipe.get()) != nullptr) {
        result += buffer.data();
    }
    return result;
}

std::pair<std::string, std::string> getPhoneFromContacts(const std::vector<std::string>& names) {
    std::ostringstream command;
    command << "osascript -s o get_phone_from_contacts.scpt";
    
    for (const auto& name : names) {
        command << " \"" << name << "\"";
    }
    
    std::string output = exec(command.str().c_str());
    
    // Split the output into result and logs
    size_t pos = output.find("Result:");
    std::string logs = output.substr(0, pos);
    std::string result = (pos != std::string::npos) ? output.substr(pos) : output;
    
    return {result, logs};
}

int main() {
    std::vector<std::string> testCases = {
        "Lily",
        "lily chen",
        "lily m chen",
        "Nonexistent Person"
    };

    for (const auto& testCase : testCases) {
        std::cout << "Testing: " << testCase << std::endl;
        std::istringstream iss(testCase);
        std::vector<std::string> names{std::istream_iterator<std::string>{iss},
                                       std::istream_iterator<std::string>{}};
        
        try {
            auto [result, logs] = getPhoneFromContacts(names);
            std::cout << "Logs:\n" << logs << std::endl;
            std::cout << "Result: " << result << std::endl;
        } catch (const std::exception& e) {
            std::cerr << "Error: " << e.what() << std::endl;
        }
        std::cout << "\n------------------------\n" << std::endl;
    }

    return 0;
}