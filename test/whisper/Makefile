CXX = g++
CXXFLAGS = -std=c++17 -Wall -Wextra
INCLUDES = -I/usr/local/include
LDFLAGS = -L/usr/local/lib
LIBS = -lcpr

TARGET = whisper_client
SRC = whisper_client.cpp

all: $(TARGET)

$(TARGET): $(SRC)
	$(CXX) $(CXXFLAGS) $(INCLUDES) $^ -o $@ $(LDFLAGS) $(LIBS)

clean:
	rm -f $(TARGET)

.PHONY: all clean