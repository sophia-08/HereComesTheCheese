#pragma once

#include <string>
#include <utility>
#include <ctime>
#include <sstream>
#include <iomanip>
#include <algorithm>
#include <cctype>

namespace Utils {
    std::string getCurrentTime();
    std::string trim(const std::string& str);
    std::pair<std::string, std::string> splitFirstWord(const std::string& sentence);
    void copyTextToClipboard(const std::string& text);
    void pasteText();
    std::string cleanupText(const std::string& text);
    std::string join(const std::vector<std::string>& vec, const std::string& delim);
}