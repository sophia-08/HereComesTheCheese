CXX = g++
CXXFLAGS = -std=c++17 -Wall -Wextra -pedantic
LDFLAGS =

SRCS = test_get_email.cpp test_get_phone.cpp
OBJS = $(SRCS:.cpp=.o)
TARGETS = test_get_email test_get_phone

.PHONY: all clean

all: $(TARGETS)

test_get_email: test_get_email.o
	$(CXX) $(LDFLAGS) -o $@ $^

test_get_phone: test_get_phone.o
	$(CXX) $(LDFLAGS) -o $@ $^

%.o: %.cpp
	$(CXX) $(CXXFLAGS) -c $< -o $@

clean:
	rm -f $(OBJS) $(TARGETS)