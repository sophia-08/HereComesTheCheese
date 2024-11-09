#pragma once

#include <string>
#include <vector>
#include <thread>
#include <atomic>
#include <mutex>
#include <thread>
#include <chrono>

class ProxySocketServer {
public:
    ProxySocketServer(const std::string &socket_path);
    virtual ~ProxySocketServer();

    void start();
    void stop();
    virtual void sendToClients(const std::string &message);

private:
    void run();
    void handleClient(int client_fd);
    std::string processCommand(const std::string &command);

    std::string m_socket_path;
    std::atomic<bool> m_running;
    std::thread m_thread;
    int m_server_fd;
    std::vector<int> m_clients;
    std::mutex m_clients_mutex;
};