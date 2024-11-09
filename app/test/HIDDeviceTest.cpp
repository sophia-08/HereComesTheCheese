#include <gtest/gtest.h>
#include <gmock/gmock.h>
#include "HIDDevice.h"
#include "ProxySocketServer.h"

// Mock ProxySocketServer
class MockProxySocketServer : public ProxySocketServer {
public:
    MockProxySocketServer() : ProxySocketServer("") {}
    MOCK_METHOD(void, sendToClients, (const std::string&), (override));
};

// Mock HIDDevice
class MockHIDDevice : public HIDDevice {
public:
    MockHIDDevice(IOHIDDeviceRef device, MockProxySocketServer* server) 
        : HIDDevice(device, server) {}
    
    MOCK_METHOD(std::string, executeFunctionCall, (const std::string&, const std::vector<std::string>&), (override));
    
    // Make protected methods public for testing
    using HIDDevice::parseFunctionCalls;
    using HIDDevice::parseSingleFunctionCall;
};

class HIDDeviceTest : public ::testing::Test {
protected:
    void SetUp() override {
        server = new MockProxySocketServer();
        device = new MockHIDDevice(nullptr, server);
    }

    void TearDown() override {
        delete device;
        delete server;
    }

    MockHIDDevice* device;
    MockProxySocketServer* server;
};

TEST_F(HIDDeviceTest, ParseFunctionCallsTest) {
    std::string response = 
        "1. get_email_address(\"John\")\n"
        "2. get_email_address(\"Sarah\")\n"
        "3. create_calendar_event(\"Meeting\", \"2023-06-01 14:00:00\", \"2023-06-01 15:00:00\", \"Conference Room\", [\"$1\", \"$2\"], \"Team sync-up\", 15)\n"
        "4. join()<END_OF_PLAN>";

    auto calls = device->parseFunctionCalls(response);

    ASSERT_EQ(calls.size(), 4);
    EXPECT_EQ(calls[0], "get_email_address(\"John\")");
    EXPECT_EQ(calls[1], "get_email_address(\"Sarah\")");
    EXPECT_EQ(calls[2], "create_calendar_event(\"Meeting\", \"2023-06-01 14:00:00\", \"2023-06-01 15:00:00\", \"Conference Room\", [\"$1\", \"$2\"], \"Team sync-up\", 15)");
    EXPECT_EQ(calls[3], "<END_OF_PLAN>");
}

TEST_F(HIDDeviceTest, ParseSingleFunctionCallTest) {
    std::string call = "get_email_address(\"John Doe\")";
    std::string functionName;
    std::vector<std::string> params;

    device->parseSingleFunctionCall(call, functionName, params);

    EXPECT_EQ(functionName, "get_email_address");
    ASSERT_EQ(params.size(), 1);
    EXPECT_EQ(params[0], "John Doe");
}

TEST_F(HIDDeviceTest, ParseComplexFunctionCallTest) {
    std::string call = "create_calendar_event(\"Team Meeting\", \"2023-06-01 10:00:00\", \"2023-06-01 11:00:00\", \"Conference Room A\", [\"john@example.com\", \"sarah@example.com\"], \"Monthly sync-up\", 15)";
    std::string functionName;
    std::vector<std::string> params;

    device->parseSingleFunctionCall(call, functionName, params);

    EXPECT_EQ(functionName, "create_calendar_event");
    ASSERT_EQ(params.size(), 7);
    EXPECT_EQ(params[0], "Team Meeting");
    EXPECT_EQ(params[1], "2023-06-01 10:00:00");
    EXPECT_EQ(params[2], "2023-06-01 11:00:00");
    EXPECT_EQ(params[3], "Conference Room A");
    EXPECT_EQ(params[4], "[john@example.com, sarah@example.com]");
    EXPECT_EQ(params[5], "Monthly sync-up");
    EXPECT_EQ(params[6], "15");
}

TEST_F(HIDDeviceTest, ExecuteWithVariableReplacementTest) {
    using ::testing::Return;
    
    EXPECT_CALL(*device, executeFunctionCall("get_email_address", std::vector<std::string>{"John"}))
        .WillOnce(Return("john@example.com"));
    EXPECT_CALL(*device, executeFunctionCall("get_email_address", std::vector<std::string>{"Sarah"}))
        .WillOnce(Return("sarah@example.com"));
    EXPECT_CALL(*device, executeFunctionCall("create_calendar_event", 
        std::vector<std::string>{"Meeting", "2023-06-01 14:00:00", "2023-06-01 15:00:00", "Conference Room", "[john@example.com, sarah@example.com]", "Team sync-up", "15"}))
        .WillOnce(Return("Event created"));

    std::string response = 
        "1. get_email_address(\"John\")\n"
        "2. get_email_address(\"Sarah\")\n"
        "3. create_calendar_event(\"Meeting\", \"2023-06-01 14:00:00\", \"2023-06-01 15:00:00\", \"Conference Room\", [\"$1\", \"$2\"], \"Team sync-up\", 15)\n"
        "4. join()<END_OF_PLAN>";

    device->execute(response);

    // The expectations set with EXPECT_CALL above serve as the assertions for this test
}

int main(int argc, char **argv) {
    ::testing::InitGoogleTest(&argc, argv);
    return RUN_ALL_TESTS();
}