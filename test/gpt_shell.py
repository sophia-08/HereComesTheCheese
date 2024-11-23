import subprocess
from openai import OpenAI


import os

# Get the API key from the environment variable
api_key = os.environ.get('GPT_APIKEY')
client = OpenAI(api_key=api_key)
if not api_key:
    raise ValueError("Please set the GPT_APIKEY environment variable with your OpenAI API key.")


def query_chatgpt(prompt):
    try:
        response = client.chat.completions.create(model="gpt-3.5-turbo",  # You can change this to "gpt-4" if you have access
        messages=[
            {"role": "system", "content": "You are a helpful assistant that converts user requests into shell commands on Mac OS. Only return the shell command, nothing else."},
            {"role": "user", "content": prompt}
        ])
        return response.choices[0].message.content.strip()
    except Exception as e:
        return f"Error querying ChatGPT: {str(e)}"

def execute_command(command):
    try:
        result = subprocess.run(command, shell=True, check=True, text=True, capture_output=True)
        return result.stdout
    except subprocess.CalledProcessError as e:
        return f"Error executing command: {e}"

def main():
    print("Welcome to the ChatGPT Shell Command Application!")
    print("Enter your request, and ChatGPT will interpret it and suggest an appropriate command.")
    print("Type 'exit' to quit.")

    while True:
        user_input = input("\nEnter your request: ")

        if user_input.lower() == 'exit':
            print("Goodbye!")
            break

        # Query ChatGPT to interpret the user's request
        chatgpt_response = query_chatgpt(f"Convert the following user request into a shell command: '{user_input}'")

        print(f"\nSuggested command: {chatgpt_response}")

        # Confirm with the user before executing the command
        confirm = input("Do you want to execute this command? (y/n): ")

        if confirm.lower() == 'y':
            result = execute_command(chatgpt_response)
            print("\nCommand output:")
            print(result)
        else:
            print("Command execution cancelled.")

if __name__ == "__main__":
    main()