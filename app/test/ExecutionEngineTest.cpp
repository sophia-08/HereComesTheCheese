#include <gmock/gmock.h>
#include <gtest/gtest.h>
#include "ExecutionEngine.h"

class MockExecutionEngine : public ExecutionEngine {
public:
    MOCK_METHOD(std::string, executeFunctionCall, (const std::string&, const std::vector<std::string>&), (override));
    // MOCK_METHOD(void, execute, (const std::string&), (override));
};

class ExecutionEngineTest : public ::testing::Test {
protected:
    MockExecutionEngine engine;
};

TEST_F(ExecutionEngineTest, ParseFunctionCallsTest) {
    std::string input = "1. create_reminder(\"Dinner Time\", \"2024-10-31 18:00:00\", \"\", \"\", 0, False)\n"
                        "2. join()\n"
                        "<END_OF_PLAN>";
    
    auto result = engine.parseFunctionCalls(input);
    
    ASSERT_EQ(result.size(), 3);
    EXPECT_EQ(result[0], "create_reminder(\"Dinner Time\", \"2024-10-31 18:00:00\", \"\", \"\", 0, False)");
    EXPECT_EQ(result[1], "join()");
    EXPECT_EQ(result[2], "<END_OF_PLAN>");
}

TEST_F(ExecutionEngineTest, ParseSingleFunctionCallTest) {
    std::string call = "create_reminder(\"Dinner Time\", \"2024-10-31 18:00:00\", \"\", \"\", 0, False)";
    std::string functionName;
    std::vector<std::string> params;
    
    engine.parseSingleFunctionCall(call, functionName, params);
    
    EXPECT_EQ(functionName, "create_reminder");
    ASSERT_EQ(params.size(), 6);
    EXPECT_EQ(params[0], "Dinner Time");
    EXPECT_EQ(params[1], "2024-10-31 18:00:00");
    EXPECT_EQ(params[2], "");
    EXPECT_EQ(params[3], "");
    EXPECT_EQ(params[4], "0");
    EXPECT_EQ(params[5], "False");
}

TEST_F(ExecutionEngineTest, ExecuteComplexPlanTest) {
    using ::testing::Return;
    using ::testing::_;

    std::string input = "1. get_email_address(\"Ken\")\n"
                       "2. get_email_address(\"Lily\")\n"
                       "3. compose_new_email([\"$1\", \"$2\"], [], \"Meeting Tomorrow Noon\", \"Let's meet tomorrow at noon.\", [])\n"
                       "4. join()\n"
                       "<END_OF_PLAN>";
    
    // Set up the mock expectations
    {
        testing::InSequence seq;
        EXPECT_CALL(engine, executeFunctionCall("get_email_address", std::vector<std::string>{"Ken"}))
            .WillOnce(Return("ken@example.com"));
        
        EXPECT_CALL(engine, executeFunctionCall("get_email_address", std::vector<std::string>{"Lily"}))
            .WillOnce(Return("lily@example.com"));
        
        EXPECT_CALL(engine, executeFunctionCall("compose_new_email", 
            std::vector<std::string>{"[ken@example.com, lily@example.com]", "[]", "Meeting Tomorrow Noon", "Let's meet tomorrow at noon.", "[]"}))
            .WillOnce(Return("Email composed"));
        
        EXPECT_CALL(engine, executeFunctionCall("join", std::vector<std::string>{}))
            .WillOnce(Return("Joined"));
    }

    testing::internal::CaptureStdout();
    engine.ExecutionEngine::execute(input);  // Call the base class implementation directly
    std::string output = testing::internal::GetCapturedStdout();
    
    std::cout << "Captured output:\n" << output << std::endl;

    EXPECT_TRUE(output.find("Replaced variable $1 with value: ken@example.com") != std::string::npos);
    EXPECT_TRUE(output.find("Replaced variable $2 with value: lily@example.com") != std::string::npos);
    EXPECT_TRUE(output.find("Processed array parameter: [ken@example.com, lily@example.com]") != std::string::npos);
    EXPECT_TRUE(output.find("Stored result in variable $3: Email composed") != std::string::npos);
}

int main(int argc, char **argv) {
    ::testing::InitGoogleTest(&argc, argv);
    return RUN_ALL_TESTS();
}