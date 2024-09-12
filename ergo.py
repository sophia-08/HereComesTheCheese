import sys

def read_message():
    raw_length = sys.stdin.buffer.read(4)
    if not raw_length:
        return None
    message_length = int.from_bytes(raw_length, byteorder='big')
    message = sys.stdin.buffer.read(message_length).decode('utf-8')
    return message

while True:
    message = read_message()
    if message is not None:
        print(f"Received message: {message}")
    else:
        print("No message received.")
