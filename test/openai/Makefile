CXX = g++
CXXFLAGS = -std=c++17 -Wall -Wextra 
LDFLAGS = -lcpr

TARGET = openai_client
SRCS = openai_test.cpp
OBJS = $(SRCS:.cpp=.o)

all: $(TARGET)

$(TARGET): $(OBJS)
	$(CXX) $(OBJS) -o $(TARGET) $(LDFLAGS)

%.o: %.cpp
	$(CXX) $(CXXFLAGS) -c $< -o $@

clean:
	rm -f $(OBJS) $(TARGET)

.PHONY: all clean