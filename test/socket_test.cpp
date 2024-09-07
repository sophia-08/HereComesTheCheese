#include <iostream>
#include <string>
#include <sys/socket.h>
#include <sys/un.h>
#include <unistd.h>
#include <cstring>
#include <poll.h>
#include <vector>
#include <algorithm>

const std::string SOCKET_PATH = "/tmp/hid_device_socket";

int create_and_connect_socket() {
    int sock = socket(AF_UNIX, SOCK_STREAM, 0);
    if (sock == -1) {
        std::cerr << "Error creating socket" << std::endl;
        return -1;
    }

    struct sockaddr_un server_addr;
    memset(&server_addr, 0, sizeof(server_addr));
    server_addr.sun_family = AF_UNIX;
    strncpy(server_addr.sun_path, SOCKET_PATH.c_str(), sizeof(server_addr.sun_path) - 1);

    if (connect(sock, (struct sockaddr*)&server_addr, sizeof(server_addr)) == -1) {
        std::cerr << "Error connecting to socket" << std::endl;
        close(sock);
        return -1;
    }

    return sock;
}

void handle_communication(int sock) {
    std::vector<pollfd> fds = {
        {STDIN_FILENO, POLLIN, 0},
        {sock, POLLIN, 0}
    };

    char buffer[1024];

    while (true) {
        int ret = poll(fds.data(), fds.size(), -1);
        if (ret == -1) {
            std::cerr << "Error in poll" << std::endl;
            break;
        }

        for (size_t i = 0; i < fds.size(); ++i) {
            if (fds[i].revents & POLLIN) {
                ssize_t bytes_read = read(fds[i].fd, buffer, sizeof(buffer) - 1);
                if (bytes_read <= 0) {
                    if (fds[i].fd == sock) {
                        std::cout << "Socket closed. Exiting." << std::endl;
                    }
                    return;
                }

                buffer[bytes_read] = '\0';

                if (fds[i].fd == STDIN_FILENO) {
                    // Send data from stdin to socket
                    send(sock, buffer, bytes_read, 0);
                } else {
                    // Send data from socket to stdout
                    std::cout << buffer;
                    std::cout.flush();
                }
            }
        }
    }
}

int main() {
    int sock = create_and_connect_socket();
    if (sock == -1) {
        return 1;
    }

    std::cout << "Connected to " << SOCKET_PATH << std::endl;
    std::cout << "Type your messages. Press Ctrl+D to exit." << std::endl;

    handle_communication(sock);

    close(sock);
    return 0;
}