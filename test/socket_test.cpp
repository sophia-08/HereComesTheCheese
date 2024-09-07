#include <iostream>
#include <fstream>
#include <sstream>
#include <string>
#include <sys/socket.h>
#include <sys/un.h>
#include <unistd.h>
#include <cstring>
#include <poll.h>
#include <vector>
#include <chrono>
#include <iomanip>

const std::string SOCKET_PATH = "/tmp/hid_device_socket";
const std::string LOG_FILE = "socket_communication.log";

std::ofstream log_file;

std::string get_current_time() {
    auto now = std::chrono::system_clock::now();
    auto now_c = std::chrono::system_clock::to_time_t(now);
    std::stringstream ss;
    ss << std::put_time(std::localtime(&now_c), "%Y-%m-%d %H:%M:%S");
    return ss.str();
}

void log_message(const std::string& direction, const std::string& message) {
    log_file << get_current_time() << " [" << direction << "] " << message << std::endl;
    log_file.flush();
}

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
            log_message("ERROR", "Error in poll");
            break;
        }

        for (size_t i = 0; i < fds.size(); ++i) {
            if (fds[i].revents & POLLIN) {
                ssize_t bytes_read = read(fds[i].fd, buffer, sizeof(buffer) - 1);
                if (bytes_read <= 0) {
                    if (fds[i].fd == sock) {
                        std::cout << "Socket closed. Exiting." << std::endl;
                        log_message("INFO", "Socket closed. Exiting.");
                    }
                    return;
                }

                buffer[bytes_read] = '\0';
                std::string message(buffer);

                if (fds[i].fd == STDIN_FILENO) {
                    // Send data from stdin to socket
                    send(sock, buffer, bytes_read, 0);
                    log_message("STDIN -> SOCKET", message);
                    std::cout << "Sent to socket: " << message;
                } else {
                    // Send data from socket to stdout
                    std::cout << "Received from socket: " << message;
                    log_message("SOCKET -> STDOUT", message);
                }
                std::cout.flush();
            }
        }
    }
}

int main() {
    log_file.open(LOG_FILE, std::ios::app);
    if (!log_file.is_open()) {
        std::cerr << "Failed to open log file" << std::endl;
        return 1;
    }

    log_message("INFO", "Program started");

    int sock = create_and_connect_socket();
    if (sock == -1) {
        log_message("ERROR", "Failed to create and connect socket");
        return 1;
    }

    log_message("INFO", "Connected to " + SOCKET_PATH);

    std::cout << "Connected to " << SOCKET_PATH << std::endl;
    std::cout << "Type your messages. Press Ctrl+D to exit." << std::endl;

    handle_communication(sock);

    close(sock);
    log_message("INFO", "Program ended");
    log_file.close();

    return 0;
}