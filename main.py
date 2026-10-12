"""
Main Entry Point for Hand Control.
Run directly with Python:
    python main.py
Or build standalone executable:
    python build_exe.py
"""

import sys
from app import run_app

if __name__ == "__main__":
    try:
        run_app()
    except KeyboardInterrupt:
        sys.exit(0)
