#include <arpa/inet.h>
#include <atomic>
#include <chrono>
#include <ctime>
#include <fstream>
#include <hidapi/hidapi.h>
#include <iomanip>
#include <iostream>
#include <pthread.h>
#include <sstream>
#include <string>
#include <unistd.h>
#include <wchar.h>

#define MAX_STR 2550

std::atomic<bool> running(true);
pthread_mutex_t print_mutex = PTHREAD_MUTEX_INITIALIZER;
pthread_mutex_t log_mutex = PTHREAD_MUTEX_INITIALIZER;
std::ofstream log_file;
#define LOG_FILENAME "log.txt"

// void safe_print(const std::string &message) {
//   pthread_mutex_lock(&print_mutex);
// //   std::cout << message << std::flush;
//   pthread_mutex_unlock(&print_mutex);
// }

void log_to_file(const std::string &message) {
  if (!log_file.is_open())
    return;

  auto now = std::chrono::system_clock::now();
  auto in_time_t = std::chrono::system_clock::to_time_t(now);

  pthread_mutex_lock(&log_mutex);
  log_file << std::put_time(std::localtime(&in_time_t), "[%Y-%m-%d %H:%M:%S] ")
           << message << std::endl
           << std::flush;
  pthread_mutex_unlock(&log_mutex);
}

// void write_formatted_string(const std::string &str) {
//   // Calculate the total length including \r\n
//   uint32_t total_length = str.length() + 2;  // +2 for \r\n
//   uint32_t net_length = htonl(total_length); // Convert to network byte order

//   // Write length as binary (4 bytes)
//   std::cout.write(reinterpret_cast<const char *>(&net_length),
//                   sizeof(net_length));

//   // Write the string in text format
//   std::cout << str;

//   // Write \r\n
//   std::cout << "\r\n";

//   // Flush the output
//   std::cout.flush();

//   // Log the operation
//   std::stringstream ss;
//   ss << "Wrote formatted string (length: " << total_length << "): " << str
//      << "\\r\\n\n";
//   log_to_file(ss.str());
// }

void* hid_read_thread(void* arg) {
    hid_device* device = static_cast<hid_device*>(arg);
    unsigned char buffer[65];

    while (running) {
        int res = hid_read(device, buffer, sizeof(buffer));
        if (res > 0) {
            std::stringstream ss;
            ss << "Read " << res << " bytes from HID:\n";
            for (int i = 0; i < res; i++) {
                ss << std::hex << std::setw(2) << std::setfill('0') <<
                static_cast<int>(buffer[i]) << " ";
            }
            ss << "\n";
            log_to_file(ss.str());
            // safe_print(ss.str());
        } else if (res < 0) {
            // safe_print("Error reading from HID device.\n");
        }
    }

    return nullptr;
}

void *stdin_read_thread(void *arg) {
  char stdin_buffer[MAX_STR];
  int len;

  while (running) {
    len = fread(stdin_buffer, 1, 4, stdin);
    if (len == 4) {
      int x = *(int *)stdin_buffer;
      std::stringstream ss;
      ss << "Read packet from stdin (length: " << x << "): ";
      //   for (uint32_t i = 0; i < len; i++) {
      //     ss << std::hex << std::setw(2) << std::setfill('0')
      //        << static_cast<int>(static_cast<unsigned char>(stdin_buffer[i]))
      //        << " ";
      //   }
      //   ss << "\n";
      // safe_print(ss.str());
      //   log_to_file(ss.str());

      len = fread(&stdin_buffer[4], 1, x, stdin);
      char *s = &stdin_buffer[4];
      ss << std::string(s);
      log_to_file(ss.str());
      // std::cerr << ss.str() << std::endl;
      // Define our message
      // char message[] = "{\"text\": \"This is a response message\"}";
      // // Collect the length of the message
      // unsigned int len = strlen(message);
      // // We need to send the 4 bytes of length information
      // printf("%c%c%c%c", (char) (len & 0xff),
      //                    (char) ((len>>8) & 0xFF),
      //                    (char) ((len>>16) & 0xFF),
      //                    (char) ((len>>24) & 0xFF));
      // // Now we can output our message
      // printf("%s", message);

        std::cerr.write(stdin_buffer, x+4);
      //     write_formatted_string("test");

      std::string message = "{\"text\": \"This is a response message\"}";
      // Collect the length of the message
      unsigned int len = message.length();
      // We need to send the 4 bytes of length information
      std::cout << char(((len >> 0) & 0xFF)) << char(((len >> 8) & 0xFF))
                << char(((len >> 16) & 0xFF)) << char(((len >> 24) & 0xFF));
      // Now we can output our message
      std::cout << message << std::flush;

    }

    // log_to_file("Read from stdin: %s", &stdin_buffer[0]);
    //   if (strncmp(stdin_buffer, "quit", 4) == 0) {
    //     safe_print("Quitting...\n");
    //     running = false;
    //     break;
    //   }
  }

  return NULL;
}

int main(int argc, char *argv[]) {
    if (hid_init()) {
  //     printf("Failed to initialize HIDAPI.\n");
  //     return -1;
    }

  // Open log file
    log_file.open(LOG_FILENAME, std::ios::app);
    if (!log_file.is_open()) {
      std::cerr << "Failed to open log file.\n";
      return -1;
    }

  // Replace with your device's Vendor ID and Product ID
    // hid_device *device = hid_open(13107, 30806, NULL);
    // if (!device) {
    //   std::cerr << "Unable to open device.\n";
    //   log_file.close();
    //   return -1;
    // }

  pthread_t hid_thread, stdin_thread;

  //   std::cout << "Reading concurrently from HID device and stdin (packet "
  //                "format). Send 'quit' to exit.\n";
    log_to_file("Started reading from HID device and stdin.\n");

    // if (pthread_create(&hid_thread, NULL, hid_read_thread, device) != 0) {
    //   std::cerr << "Failed to create HID thread.\n";
    //   log_file.close();
    //   return -1;
    // }

  if (pthread_create(&stdin_thread, NULL, stdin_read_thread, NULL) != 0) {
    // std::cerr << "Failed to create stdin thread.\n";
    // log_file.close();
    // return -1;
  }

  while (1)
    ;
  pthread_join(stdin_thread, NULL);
  pthread_join(hid_thread, NULL);

  //   hid_close(device);
  //   hid_exit();

  log_file.close();
  return 0;
}
