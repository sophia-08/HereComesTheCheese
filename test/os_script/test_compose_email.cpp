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

std::pair<std::string, std::string> composeEmail(const std::vector<std::string>& recipients,
                                                 const std::string& subject,
                                                 const std::string& content,
                                                 const std::vector<std::string>& attachments,
                                                 const std::vector<std::string>& cc) {
    std::cout << "Preparing email composition..." << std::endl;

    std::ostringstream command;
    command << "osascript -s o compose_email.scpt";

    // Join recipients
    std::ostringstream recipientStr;
    for (size_t i = 0; i < recipients.size(); ++i) {
        if (i > 0) recipientStr << ",";
        recipientStr << recipients[i];
    }
    command << " \"" << recipientStr.str() << "\"";
    std::cout << "Recipients: " << recipientStr.str() << std::endl;

    // Add subject and content
    command << " \"" << subject << "\"";
    command << " \"" << content << "\"";
    std::cout << "Subject: " << subject << std::endl;
    std::cout << "Content: " << content << std::endl;

    // Join attachments
    std::ostringstream attachmentStr;
    for (size_t i = 0; i < attachments.size(); ++i) {
        if (i > 0) attachmentStr << ",";
        attachmentStr << attachments[i];
    }
    command << " \"" << attachmentStr.str() << "\"";
    std::cout << "Attachments: " << attachmentStr.str() << std::endl;

    // Join CC recipients
    std::ostringstream ccStr;
    for (size_t i = 0; i < cc.size(); ++i) {
        if (i > 0) ccStr << ",";
        ccStr << cc[i];
    }
    command << " \"" << ccStr.str() << "\"";
    std::cout << "CC Recipients: " << ccStr.str() << std::endl;

    std::cout << "Executing AppleScript command..." << std::endl;
    std::string output = exec(command.str().c_str());
    
    // Split the output into result and logs
    size_t pos = output.find("Result:");
    std::string logs = output.substr(0, pos);
    std::string result = (pos != std::string::npos) ? output.substr(pos) : output;
    
    return {result, logs};
}

int main() {
    std::vector<std::string> recipients = {"recipient1@example.com", "recipient2@example.com"};
    std::string subject = "Test Email";
    std::string content = "This is a test email sent from a C++ program.";
    std::vector<std::string> attachments = {"test_compose_email.cpp"};
    std::vector<std::string> cc = {"cc1@example.com", "cc2@example.com"};

    std::cout << "Starting email composition test..." << std::endl;

    try {
        auto [result, logs] = composeEmail(recipients, subject, content, attachments, cc);
        std::cout << "AppleScript Logs:" << std::endl;
        std::cout << logs << std::endl;
        std::cout << "Result: " << result << std::endl;
    } catch (const std::exception& e) {
        std::cerr << "Error: " << e.what() << std::endl;
    }

    std::cout << "Email composition test completed." << std::endl;

    return 0;
}