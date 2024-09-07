import socket

def send_command(command):
    sock = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
    server_address = '/tmp/hid_device_socket'
    sock.connect(server_address)
    sock.sendall(command.encode())
    response = sock.recv(1024).decode()
    sock.close()
    return response

print(send_command('status'))
print(send_command('send 010203'))  # Example of sending a report