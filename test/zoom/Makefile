CXX = g++
CXXFLAGS = -std=c++17 -Wall -Wextra -pedantic
LDFLAGS = -lcpr

# CPR include and lib directories
CPR_INCLUDE = -I/opt/homebrew/Cellar/cpr/1.11.0/include
CPR_LIB = -L/opt/homebrew/Cellar/cpr/1.11.0/lib

# nlohmann/json is typically a header-only library, but let's include its path just in case
JSON_INCLUDE = -I/opt/homebrew/include

INCLUDE = $(CPR_INCLUDE) $(JSON_INCLUDE)
LIBDIR = $(CPR_LIB)

SRCS = zoom_scheduler.cpp
OBJS = $(SRCS:.cpp=.o)
TARGET = zoom_scheduler

.PHONY: all clean

all: $(TARGET)

$(TARGET): $(OBJS)
	$(CXX) $(CXXFLAGS) $(OBJS) -o $(TARGET) $(LIBDIR) $(LDFLAGS)

%.o: %.cpp
	$(CXX) $(CXXFLAGS) $(INCLUDE) -c $< -o $@

clean:
	rm -f $(OBJS) $(TARGET)

run: $(TARGET)
	./$(TARGET)