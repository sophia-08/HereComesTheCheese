#include <iostream>
#include <string>
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
    try {
        // Test parameters
        std::string name = "Project Deadline";
        std::string due_date = "2024-10-30 14:00:00";
        std::string notes = "Complete project documentation";
        std::string list_name = "Work";
        std::string priority = "1";  // 1=High, 5=Medium, 9=Low, 0=None
        std::string all_day = "false";  // Note: passing as string "true" or "false"

        // Print parameters for verification
        std::cout << "Creating reminder with parameters:" << std::endl;
        std::cout << "Name: " << name << std::endl;
        std::cout << "Due date: " << due_date << std::endl;
        std::cout << "Notes: " << notes << std::endl;
        std::cout << "List: " << list_name << std::endl;
        std::cout << "Priority: " << priority << std::endl;
        std::cout << "All-day: " << all_day << std::endl;

        // Construct the command
        std::string command = "osascript create_reminder.scpt ";
        command += "\"" + name + "\" ";
        command += "\"" + due_date + "\" ";
        command += "\"" + notes + "\" ";
        command += "\"" + list_name + "\" ";
        command += priority + " ";  // Note: no quotes for number
        command += all_day;         // Note: no quotes for boolean

        std::cout << "\nExecuting command..." << std::endl;
        std::cout << "Command: " << command << std::endl;

        // Execute the command
        std::string result = exec(command.c_str());
        std::cout << "Result: " << result << std::endl;

    } catch (const std::exception& e) {
        std::cerr << "Error: " << e.what() << std::endl;
        return 1;
    }

    return 0;
}