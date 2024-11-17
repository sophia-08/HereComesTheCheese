#include "ProxySocketServer.h"
#include "Logger.h"
#include <algorithm>
#include <sys/socket.h>
#include <sys/un.h>
#include <unistd.h>

ProxySocketServer::ProxySocketServer(const std::string &socket_path)
    : m_socket_path(socket_path), m_running(false), m_server_fd(-1) {
  log("ProxySocketServer created with socket path: " + socket_path);
}

ProxySocketServer::~ProxySocketServer() {
  stop();
  log("ProxySocketServer destroyed");
}

void ProxySocketServer::start() {
  m_running = true;
  m_thread = std::thread(&ProxySocketServer::run, this);
  log("ProxySocketServer started");
}

void ProxySocketServer::stop() {
  m_running = false;
  if (m_thread.joinable()) {
    m_thread.join();
  }
  if (m_server_fd >= 0) {
    close(m_server_fd);
  }
  unlink(m_socket_path.c_str());
  log("ProxySocketServer stopped");
}

void ProxySocketServer::sendToClients(const std::string &message) {
  std::lock_guard<std::mutex> lock(m_clients_mutex);
  for (int client_fd : m_clients) {
    write(client_fd, message.c_str(), message.length());
  }
  log("Message sent to " + std::to_string(m_clients.size()) + " clients");
}

void ProxySocketServer::run() {
  m_server_fd = socket(AF_UNIX, SOCK_STREAM, 0);
  if (m_server_fd < 0) {
    log("Error creating socket");
    return;
  }

  struct sockaddr_un server_addr;
  memset(&server_addr, 0, sizeof(server_addr));
  server_addr.sun_family = AF_UNIX;
  strncpy(server_addr.sun_path, m_socket_path.c_str(),
          sizeof(server_addr.sun_path) - 1);

  unlink(m_socket_path.c_str());
  if (bind(m_server_fd, (struct sockaddr *)&server_addr, sizeof(server_addr)) <
      0) {
    log("Error binding socket");
    return;
  }

  if (listen(m_server_fd, 5) < 0) {
    log("Error listening on socket");
    return;
  }

  log("Unix Domain Socket server listening on " + m_socket_path);

  while (m_running) {
    int client_fd = accept(m_server_fd, nullptr, nullptr);
    if (client_fd < 0) {
      if (m_running) {
        log("Error accepting connection");
      }
      continue;
    }

    {
      std::lock_guard<std::mutex> lock(m_clients_mutex);
      m_clients.push_back(client_fd);
      log("New client connected. Total clients: " +
          std::to_string(m_clients.size()));
    }

    std::thread client_thread(&ProxySocketServer::handleClient, this,
                              client_fd);
    client_thread.detach();
  }
}

void ProxySocketServer::handleClient(int client_fd) {
  char buffer[1024];
  while (m_running) {
    ssize_t bytes_read = read(client_fd, buffer, sizeof(buffer) - 1);
    if (bytes_read <= 0) {
      break;
    }
    buffer[bytes_read] = '\0';
    std::string response = processCommand(buffer);
    write(client_fd, response.c_str(), response.length());
    log("Processed command from client: " + std::string(buffer));
  }

  {
    std::lock_guard<std::mutex> lock(m_clients_mutex);
    m_clients.erase(std::remove(m_clients.begin(), m_clients.end(), client_fd),
                    m_clients.end());
    log("Client disconnected. Total clients: " +
        std::to_string(m_clients.size()));
  }
  close(client_fd);
}

std::string ProxySocketServer::processCommand(const std::string &command) {
  if (command == "status") {
    return "HID Device is connected";
  } else if (command.substr(0, 4) == "send") {
    // Example: send a report to the HID device
    return "Report sent to HID device";
  } else {
    return "Unknown command";
  }
}