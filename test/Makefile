CXX = g++
CXXFLAGS = -std=c++17 -Wall -Wextra
LDFLAGS = -framework IOKit -framework CoreFoundation

all: socket_test mac_report

socket_test: socket_test.cpp
	$(CXX) $(CXXFLAGS) -o $@ $<

mac_report: mac_report.cpp
	$(CXX) $(CXXFLAGS) $(LDFLAGS) -o $@ $<

clean:
	rm -f socket_test mac_report

.PHONY: all clean