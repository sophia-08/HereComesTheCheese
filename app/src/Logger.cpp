#include "Logger.h"
#include <chrono>
#include <iomanip>
#include <iostream>

Logger &Logger::getInstance() {
  static Logger instance;
  return instance;
}

void Logger::log(const std::string &message) {
  auto now = std::chrono::system_clock::now();
  auto now_c = std::chrono::system_clock::to_time_t(now);
  m_logFile << std::put_time(std::localtime(&now_c), "%F %T") << " - "
            << message << std::endl;
  std::cout << message << std::endl; // Also print to console
}

void Logger::close() {
  if (m_logFile.is_open()) {
    m_logFile.close();
  }
}

Logger::Logger() : m_logFile("ergo_app.log", std::ios::app) {}

Logger::~Logger() { close(); }

void log(const std::string &message) { Logger::getInstance().log(message); }