#include <iostream>
#include <string>
#include <vector>
#include <cstdlib>
#include <array>
#include <memory>

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

int main() {
    std::cout << "Preparing event details..." << std::endl;

    std::string title = "Team Meeting";
    std::string start_date = "2024-10-30 14:00:00";
    std::string end_date = "2024-10-30 15:00:00";
    std::string location = "Conference Room A";
    std::vector<std::string> invitees = {"john@example.com", "jane@example.com"};
    std::string notes = "Discuss project progress";

    std::cout << "Event details:" << std::endl;
    std::cout << "Title: " << title << std::endl;
    std::cout << "Start date: " << start_date << std::endl;
    std::cout << "End date: " << end_date << std::endl;
    std::cout << "Location: " << location << std::endl;
    std::cout << "Invitees: ";
    for (const auto& invitee : invitees) {
        std::cout << invitee << " ";
    }
    std::cout << std::endl;
    std::cout << "Notes: " << notes << std::endl;

    // Construct the command to run the AppleScript
    std::cout << "Constructing AppleScript command..." << std::endl;
    std::string command = "osascript create_event.scpt ";
    command += "\"" + title + "\" ";
    command += "\"" + start_date + "\" ";
    command += "\"" + end_date + "\" ";
    command += "\"" + location + "\" ";
    
    // Join invitees with commas
    std::string invitees_str;
    for (size_t i = 0; i < invitees.size(); ++i) {
        if (i > 0) invitees_str += ",";
        invitees_str += invitees[i];
    }
    command += "\"" + invitees_str + "\" ";
    
    command += "\"" + notes + "\"";

    std::cout << "Command: " << command << std::endl;

    // Execute the command and capture the output
    std::cout << "Executing AppleScript..." << std::endl;
    try {
        std::string result = exec(command.c_str());
        std::cout << "AppleScript output:" << std::endl;
        std::cout << result << std::endl;
    } catch (const std::runtime_error& e) {
        std::cerr << "Error executing AppleScript: " << e.what() << std::endl;
    }

    std::cout << "Process completed." << std::endl;
    return 0;
}