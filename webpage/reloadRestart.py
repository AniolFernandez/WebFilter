#!/bin/python3
import os
import sys

if __name__ == "__main__":
    if len(sys.argv) <= 1:
        print(f"Usage: {sys.argv[0]} <[reload/restart]>")
        sys.exit(1)
    if sys.argv[1].lower() == "restart":
        os.system("service squid restart")
    else:
        os.system("service squid reload")