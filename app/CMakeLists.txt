cmake_minimum_required(VERSION 3.10)
project(ErgoProject)

set(CMAKE_C_COMPILER clang)
set(CMAKE_CXX_COMPILER clang++)
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Find required packages
find_package(GTest REQUIRED)
find_package(cpr REQUIRED)
find_package(nlohmann_json REQUIRED)

# Include directories
include_directories(${GTEST_INCLUDE_DIRS})
include_directories(${CMAKE_CURRENT_SOURCE_DIR}/include)
include_directories(/opt/homebrew/Cellar/cpr/1.11.0/include)
include_directories(/opt/homebrew/Cellar/nlohmann-json/3.11.3/include)

# Set compiler flags
add_compile_options(-Wall -Wextra)

# Source files for ergo_app
set(ERGO_APP_SOURCES
    src/InputHandler.cpp
    src/ExecutionEngine.cpp
    src/WhisperClient.cpp
    src/Utils.cpp    
    src/main.cpp
    src/HIDDevice.cpp
    src/OpenAIClient.cpp
    src/ProxySocketServer.cpp
    src/Logger.cpp
    src/HIDManager.cpp
    src/wave.c
    src/type_by_paste.mm
    src/ZoomScheduler.cpp
)

# Add ergo_app executable
add_executable(ergo_app ${ERGO_APP_SOURCES})

# Link libraries for ergo_app
target_link_libraries(ergo_app
    cpr::cpr
    nlohmann_json::nlohmann_json
    "-framework IOKit"
    "-framework CoreFoundation"
    "-framework Cocoa"
    ${CMAKE_CURRENT_SOURCE_DIR}/lib/liblc3.so
)

# For the main executable
set_target_properties(ergo_app PROPERTIES
    RUNTIME_OUTPUT_DIRECTORY ${CMAKE_SOURCE_DIR}/out
)

# Test executable
# add_executable(ergo_test
#     test/HIDDeviceTest.cpp
#     test/ExecutionEngineTest.cpp
#     src/HIDDevice.cpp
#     src/OpenAIClient.cpp
#     src/ProxySocketServer.cpp
#     src/Logger.cpp
#     src/HIDManager.cpp
#     src/wave.c
#     src/type_by_paste.mm
#     src/InputHandler.cpp
#     src/ExecutionEngine.cpp
#     src/WhisperClient.cpp
#     src/Utils.cpp
#     src/ZoomScheduler.cpp
# )

# # Link libraries for the test executable
# include_directories(${GTEST_INCLUDE_DIRS})
# target_link_libraries(ergo_test ${GTEST_BOTH_LIBRARIES})
# target_link_libraries(ergo_test
#     GTest::GTest
#     GTest::Main
#     /opt/homebrew/Cellar/googletest/1.15.2/lib/libgmock.a
#     /opt/homebrew/Cellar/googletest/1.15.2/lib/libgmock_main.a
#     cpr::cpr
#     nlohmann_json::nlohmann_json
#     "-framework IOKit"
#     "-framework CoreFoundation"
#     "-framework Cocoa"
#     ${CMAKE_CURRENT_SOURCE_DIR}/lib/liblc3.so
#     pthread
# )

# # Add test
# add_test(NAME ErgoTest COMMAND ergo_test)

# # Enable testing
# enable_testing()


# # For the test executable
# set_target_properties(ergo_test PROPERTIES
#     RUNTIME_OUTPUT_DIRECTORY ${CMAKE_SOURCE_DIR}/out
# )
