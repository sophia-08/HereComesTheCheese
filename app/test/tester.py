import socket
import os
import select
import sys
import json

SOCKET_PATH = "/tmp/hid_device_socket"

def create_json_message(user_input):
    parts = user_input.split(maxsplit=1)
    cmd_id = parts[0]
    parameter = parts[1] if len(parts) > 1 else ""
    
    return json.dumps({
        "cmd_id": cmd_id,
        "parameter": parameter,
        "type": "hid_cmd"
    })

def main():
    # Remove the socket file if it already exists
    try:
        os.unlink(SOCKET_PATH)
    except OSError:
        if os.path.exists(SOCKET_PATH):
            raise

    # Create a Unix domain socket
    sock = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
    sock.bind(SOCKET_PATH)
    sock.listen(1)

    print(f"Listening on {SOCKET_PATH}")
    print("Waiting for a connection...")

    connection, client_address = sock.accept()
    print("Connected by", client_address)

    inputs = [connection, sys.stdin]

    try:
        while True:
            readable, _, _ = select.select(inputs, [], [])

            for s in readable:
                if s is connection:
                    # Read from socket
                    data = connection.recv(1024)
                    if data:
                        print(f"Received: {data.decode('utf-8').strip()}")
                    else:
                        print("Connection closed by client")
                        return

                elif s is sys.stdin:
                    # Read from stdin
                    user_input = input("Enter command (or 'quit' to exit): ").strip()
                    if user_input.lower() == 'quit':
                        print("Quitting...")
                        return
                    
                    # Create JSON message
                    json_message = create_json_message(user_input)
                    
                    # Send JSON message
                    connection.sendall(json_message.encode('utf-8'))
                    print(f"Sent: {json_message}")

    finally:
        connection.close()
        sock.close()
        os.unlink(SOCKET_PATH)

if __name__ == "__main__":
    main()