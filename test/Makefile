CXX = g++
CXXFLAGS = -std=c++17 -Wall -Wextra
LDFLAGS = -framework IOKit -framework CoreFoundation

OUTDIR = out

all: $(OUTDIR) $(OUTDIR)/socket_test $(OUTDIR)/mac_report

$(OUTDIR):
	mkdir -p $(OUTDIR)

$(OUTDIR)/socket_test: socket_test.cpp
	$(CXX) $(CXXFLAGS) -o $@ $<

$(OUTDIR)/mac_report: mac_report.cpp
	$(CXX) $(CXXFLAGS) $(LDFLAGS) -o $@ $<

clean:
	rm -rf $(OUTDIR)

.PHONY: all clean