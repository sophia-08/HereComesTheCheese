#include <iostream>
#include <string>
#include <sys/socket.h>
#include <sys/un.h>
#include <unistd.h>
#include <cstring>
#include <nlohmann/json.hpp>

using json = nlohmann::json;

void connect_and_receive() {
    int sock = socket(AF_UNIX, SOCK_STREAM, 0);
    if (sock == -1) {
        std::cerr << "Error creating socket" << std::endl;
        return;
    }

    struct sockaddr_un server_addr;
    memset(&server_addr, 0, sizeof(server_addr));
    server_addr.sun_family = AF_UNIX;
    strncpy(server_addr.sun_path, "/tmp/hid_device_socket", sizeof(server_addr.sun_path) - 1);

    if (connect(sock, (struct sockaddr*)&server_addr, sizeof(server_addr)) == -1) {
        std::cerr << "Error connecting to socket" << std::endl;
        close(sock);
        return;
    }

    try {
        char buffer[1024];
        while (true) {
            ssize_t bytes_received = recv(sock, buffer, sizeof(buffer) - 1, 0);
            if (bytes_received <= 0) {
                break;
            }
            buffer[bytes_received] = '\0';

            try {
                json json_data = json::parse(buffer);
                std::cout << "Received HID report: " << json_data.dump(2) << std::endl;
            } catch (const json::parse_error& e) {
                std::cout << "Received non-JSON data: " << buffer << std::endl;
            }
        }
    } catch (const std::exception& e) {
        std::cerr << "Error: " << e.what() << std::endl;
    }

    close(sock);
}

int main() {
    connect_and_receive();
    return 0;
}