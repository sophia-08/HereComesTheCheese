import os
from typing import List, Tuple, Any, Dict
from langchain_openai import ChatOpenAI
from langchain.prompts import ChatPromptTemplate
from langchain.tools import StructuredTool
from langchain.agents import AgentExecutor, create_react_agent
from langchain_core.messages import AIMessage, HumanMessage
from pydantic import BaseModel, Field
import subprocess
import openai

def check_api_key():
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        raise ValueError("OPENAI_API_KEY environment variable is not set. Please set it with your OpenAI API key.")
    return api_key

def execute_shell_command(command: str) -> str:
    """Execute a shell command and return its output"""
    try:
        result = subprocess.run(command, shell=True, check=True, text=True, capture_output=True)
        return result.stdout
    except subprocess.CalledProcessError as e:
        return f"Error executing command: {e}"

shell_command_tool = StructuredTool.from_function(
    func=execute_shell_command,
    name="shell_command",
    description="Execute a shell command and return its output"
)

prompt = ChatPromptTemplate.from_messages([
    ("system", "You are an AI assistant that helps users execute shell commands. "
               "Your task is to interpret user requests and suggest appropriate shell commands. "
               "Be cautious and always prioritize system safety. "
               "You have access to the following tools:\n\n{tools}\n\n"
               "To use a tool, please use the following format:\n"
               "Action: the action to take, should be one of {tool_names}\n"
               "Action Input: the input to the action\n"
               "Observation: the result of the action\n"
               "... (this Observation/Action/Action Input can repeat N times)\n"
               "Thought: I now know the final answer\n"
               "Final Answer: the final answer to the original input question"),
    ("human", "{input}"),
    ("ai", "{agent_scratchpad}"),
])

def setup_agent():
    api_key = check_api_key()
    llm = ChatOpenAI(temperature=0, api_key=api_key)
    tools = [shell_command_tool]
    agent = create_react_agent(llm, tools, prompt)
    return AgentExecutor(agent=agent, tools=tools, verbose=True)

def main():
    print("Welcome to the LangChain Shell Command Application!")
    print("Enter your request, and the AI will interpret it and suggest an appropriate command.")
    print("Type 'exit' to quit.")

    try:
        agent_executor = setup_agent()
    except ValueError as e:
        print(f"Error: {e}")
        print("Please set the OPENAI_API_KEY environment variable and try again.")
        return
    except openai.AuthenticationError as e:
        print(f"Authentication Error: {e}")
        print("Please check your OpenAI API key and ensure it's correct.")
        return

    while True:
        user_input = input("\nEnter your request: ")
        
        if user_input.lower() == 'exit':
            print("Goodbye!")
            break

        try:
            result = agent_executor.invoke({"input": user_input})
            print("\nAI Response:")
            print(result['output'])
        except openai.AuthenticationError as e:
            print(f"Authentication Error: {e}")
            print("Please check your OpenAI API key and ensure it's correct.")
            break
        except Exception as e:
            print(f"An error occurred: {e}")
            print("Please try again or type 'exit' to quit.")

if __name__ == "__main__":
    main()