CXX = g++
CXXFLAGS = -std=c++17 -Wall -Wextra
LDFLAGS = -framework IOKit -framework CoreFoundation

OUTDIR = out

all: $(OUTDIR) $(OUTDIR)/ergo_proxy $(OUTDIR)/mac_report

$(OUTDIR):
	mkdir -p $(OUTDIR)

$(OUTDIR)/ergo_proxy: ergo_proxy.cpp
	$(CXX) $(CXXFLAGS) -o $@ $<

$(OUTDIR)/mac_report: mac_report.cpp
	$(CXX) $(CXXFLAGS) $(LDFLAGS) -o $@ $<

clean:
	rm -rf $(OUTDIR)

.PHONY: all clean