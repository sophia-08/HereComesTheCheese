#include "HIDManager.h"
#include "Logger.h"

int main() {
    log("Program started");
    HIDManager manager;
    manager.run();
    log("Program ended");
    Logger::getInstance().close();
    return 0;
}