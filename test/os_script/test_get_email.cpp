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

std::string getEmailFromContacts(const std::vector<std::string>& names) {
    std::ostringstream command;
    command << "osascript get_email_from_contacts.scpt";
    
    for (const auto& name : names) {
        command << " \"" << name << "\"";
    }
    
    return exec(command.str().c_str());
}

int main() {
    std::vector<std::string> testCases = {
        "lily",
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
            std::string result = getEmailFromContacts(names);
            std::cout << "Result: " << result << std::endl;
        } catch (const std::exception& e) {
            std::cerr << "Error: " << e.what() << std::endl;
        }
        std::cout << std::endl;
    }

    return 0;
}