CXX = c++
CC = cc
CXXFLAGS = -std=c++17 -Wall -Wextra -I/opt/homebrew/Cellar/cpr/1.11.0/include -I/opt/homebrew/Cellar/nlohmann-json/3.11.3/include
LDFLAGS = -framework IOKit -framework CoreFoundation -framework Cocoa  -L lib -llc3 -lcpr -L /opt/homebrew/Cellar/cpr/1.11.0/lib 

OUTDIR = out

all: $(OUTDIR) $(OUTDIR)/ergo_proxy $(OUTDIR)/ergo_app

$(OUTDIR):
	mkdir -p $(OUTDIR)

$(OUTDIR)/ergo_proxy: ergo_proxy.cpp
	$(CXX) $(CXXFLAGS) -o $@ $<

$(OUTDIR)/wave.o: wave.c
	$(CC) -c -o $@ $<

$(OUTDIR)/ergo_app: ergo_app.cpp $(OUTDIR)/wave.o type_by_paste.mm
	$(CXX) $(CXXFLAGS) $(LDFLAGS) -o $@ $^

clean:
	rm -rf $(OUTDIR)

.PHONY: all clean