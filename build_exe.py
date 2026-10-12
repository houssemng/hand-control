"""
Build script to package Hand Control into a standalone HandControl.exe.
"""

import os
import subprocess
import sys
import shutil


def build():
    print("=== Building HandControl.exe ===")
    base_dir = os.path.dirname(os.path.abspath(__file__))
    model_file = os.path.join(base_dir, "hand_landmarker.task")

    if not os.path.exists(model_file):
        print(f"Error: {model_file} not found!")
        sys.exit(1)

    pyinstaller_cmd = [
        sys.executable,
        "-m",
        "PyInstaller",
        "--noconfirm",
        "--clean",
        "--onefile",
        "--name",
        "HandControl",
        f"--add-data={model_file};.",
        "--collect-all",
        "mediapipe",
        "main.py",
    ]

    print("Running command:", " ".join(pyinstaller_cmd))
    result = subprocess.run(pyinstaller_cmd, cwd=base_dir)

    if result.returncode == 0:
        dist_exe = os.path.join(base_dir, "dist", "HandControl.exe")
        target_exe = os.path.join(base_dir, "HandControl.exe")
        if os.path.exists(dist_exe):
            shutil.copy2(dist_exe, target_exe)
            print(f"\nSUCCESS! Standalone HandControl.exe created at: {target_exe}")
            print(f"Size: {os.path.getsize(target_exe) / (1024 * 1024):.1f} MB")
        else:
            print(f"Warning: dist/HandControl.exe not found.")
    else:
        print(f"Build failed with exit code {result.returncode}")
        sys.exit(result.returncode)


if __name__ == "__main__":
    build()
