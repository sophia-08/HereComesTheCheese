#include "Utils.h"
#include <algorithm>
#include <regex>

namespace Utils {

std::string getCurrentTime() 
{
    std::time_t now = std::time(nullptr);
    std::tm* localTime = std::localtime(&now);
    std::stringstream ss;
    ss << std::put_time(localTime, "%Y-%m-%d %H:%M:%S");
    return ss.str();
}

std::string trim(const std::string& str) 
{
    const std::string whitespace = " \t\n\r\f\v";
    std::size_t first = str.find_first_not_of(whitespace);
    if (first == std::string::npos)
        return "";
    std::size_t last = str.find_last_not_of(whitespace);
    return str.substr(first, last - first + 1);
}

std::pair<std::string, std::string> splitFirstWord(const std::string& sentence) 
{
    std::string trimmed = trim(sentence);
    std::size_t spacePos = trimmed.find(' ');

    std::string firstWord;
    std::string remainder;

    if (spacePos == std::string::npos)
    {
        firstWord = trimmed;
        remainder = "";
    }
    else
    {
        firstWord = trimmed.substr(0, spacePos);
        remainder = trim(trimmed.substr(spacePos + 1));
    }

    std::transform(firstWord.begin(), firstWord.end(), firstWord.begin(), ::tolower);
    firstWord.erase(
        std::remove_if(firstWord.begin(), firstWord.end(), ::ispunct),
        firstWord.end()
    );

    return std::make_pair(firstWord, remainder);
}

void copyTextToClipboard(const std::string& text) 
{
    // Implementation depends on platform
    #ifdef __APPLE__
    std::string cmd = "echo '" + text + "' | pbcopy";
    system(cmd.c_str());
    #endif
}

void pasteText() 
{
    // Implementation depends on platform
    #ifdef __APPLE__
    system("osascript -e 'tell application \"System Events\" to keystroke \"v\" using command down'");
    #endif
}

std::string cleanupText(const std::string& text) 
{
    std::string cleaned = text;
    // Remove [BLANK_AUDIO] markers
    cleaned = std::regex_replace(cleaned, std::regex("\\[BLANK_AUDIO\\]"), "");
    // Remove any other unwanted patterns
    cleaned = std::regex_replace(cleaned, std::regex("[^a-zA-Z0-9\\s.,!?-]"), "");
    return trim(cleaned);
}

} // namespace Utils