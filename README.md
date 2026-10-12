# ✋ Hand Control

Control your laptop with hand gestures, using your webcam.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Platform: Windows](https://img.shields.io/badge/Platform-Windows%2010%20%7C%2011-0078D6.svg)](https://microsoft.com/windows)
[![Python: 3.11](https://img.shields.io/badge/Python-3.11-3776AB.svg)](https://python.org)

---

## 🚀 Quick Start (No Python Required)

1. **Download `HandControl.exe`** from the [Latest GitHub Release](https://github.com/houssemng/hand-control/releases).
2. **Double-click `HandControl.exe`**. A window opens showing your webcam with the hand skeleton tracked in real time.
3. The first time, Windows may show *"Windows protected your PC"*.  
   Click **"More info"**, then **"Run anyway"**. *(The app is not signed by a certificate authority, so Windows does not recognize it yet).*

---

## 🖐️ Gestures & Controls

| Gesture | Laptop Action | Trigger Behavior |
| :--- | :--- | :--- |
| **👍 Thumbs up** | 🔊 **Volume Up** | Keeps increasing while held |
| **👎 Thumbs down** | 🔉 **Volume Down** | Keeps decreasing while held |
| **👉 Point right (index)** | ➡️ **Right Arrow** | Next slide / page (1 press per gesture hold) |
| **👈 Point left (index)** | ⬅️ **Left Arrow** | Previous slide / page (1 press per gesture hold) |
| **👌 Pinch (thumb + index)** | ⏯️ **Space Bar** | Play/Pause / Space (1 press per pinch) |

> **Gesture Guidelines:**
> - **Hold a gesture for a moment before it fires**: A real-time progress gauge confirms your intent.
> - **Keep your hand upright or level**: Diagonal gestures are ignored on purpose to prevent accidental triggers.

---

## 💡 Good To Know
- **Arrow keys and Space go to the window you clicked last**. Click your slides (PowerPoint / Google Slides), video (YouTube / VLC), or document once after launching Hand Control.
- **In-App Controls**:
  - `P`: **Pause / Resume** tracking.
  - `Q` or `Esc`: **Quit** Hand Control.
- **Camera Error?**: If the app cannot open the camera, close other programs using the webcam (*Zoom, Teams, Camera app*), then press `R` to retry.
- **Lighting**: Good lighting ensures the best landmark tracking accuracy. Keep your whole hand within the camera frame.

---

## 🔒 Privacy
The camera feed is processed **locally on your computer only**.  
No video or images are recorded, stored, or transmitted anywhere, and the app requires **no internet connection** to operate.

---

## 💻 Developer / Source Setup

If you prefer to run from source code:

1. **Clone the repository:**
   ```bash
   git clone https://github.com/houssemng/hand-control.git
   cd hand-control
   ```

2. **Create and activate a virtual environment:**
   ```powershell
   python -m venv venv
   .\venv\Scripts\Activate.ps1
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Run the app:**
   ```bash
   python main.py
   ```

5. **Run automated test suite:**
   ```bash
   python test_logic.py
   ```

6. **Build standalone executable:**
   ```bash
   python build_exe.py
   ```

---

## 📄 License
This project is licensed under the [MIT License](LICENSE) - see the LICENSE file for details.
