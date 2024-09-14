CXX = g++
CXXFLAGS = -std=c++17 -Wall -Wextra
LDFLAGS = -framework IOKit -framework CoreFoundation

OUTDIR = out

all: $(OUTDIR) $(OUTDIR)/ergo_proxy $(OUTDIR)/ergo_app

$(OUTDIR):
	mkdir -p $(OUTDIR)

$(OUTDIR)/ergo_proxy: ergo_proxy.cpp
	$(CXX) $(CXXFLAGS) -o $@ $<

$(OUTDIR)/ergo_app: ergo_app.cpp
	$(CXX) $(CXXFLAGS) $(LDFLAGS) -o $@ $<

clean:
	rm -rf $(OUTDIR)

.PHONY: all clean