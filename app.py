"""
Core Hand Control Application.
Initializes webcam, MediaPipe HandLandmarker, gesture tracking pipeline,
and runs the interactive window loop.
"""

import os
import sys
import time
import cv2
import numpy as np

import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision

from controller import ActionController
from gestures import GestureDetector, GestureStateManager
import ui


def get_asset_path(filename: str) -> str:
    """Returns absolute path to asset, handling PyInstaller packaging."""
    if getattr(sys, "frozen", False):
        base_dir = getattr(sys, "_MEIPASS", os.path.dirname(sys.executable))
    else:
        base_dir = os.path.dirname(os.path.abspath(__file__))
    return os.path.join(base_dir, filename)


class HandControlApp:
    def __init__(self):
        self.window_name = "Hand Control"
        self.model_path = get_asset_path("hand_landmarker.task")

        # Core components
        self.controller = ActionController()
        self.detector = GestureDetector()
        self.state_manager = GestureStateManager(self.controller)

        # Vision Landmarker
        self.landmarker = None
        self.init_landmarker()

        # Camera & Application State
        self.cap = None
        self.camera_index = 0
        self.is_paused = False
        self.is_running = False

    def init_landmarker(self):
        """Initializes the MediaPipe Hand Landmarker model."""
        if not os.path.exists(self.model_path):
            raise FileNotFoundError(f"Model file not found at: {self.model_path}")

        base_options = python.BaseOptions(model_asset_path=self.model_path)
        options = vision.HandLandmarkerOptions(
            base_options=base_options,
            num_hands=1,
            min_hand_detection_confidence=0.55,
            min_hand_presence_confidence=0.55,
            min_tracking_confidence=0.55,
        )
        self.landmarker = vision.HandLandmarker.create_from_options(options)

    def open_camera(self) -> bool:
        """Attempts to open default webcam or fallback."""
        if self.cap is not None:
            self.cap.release()

        # Try default index 0
        self.cap = cv2.VideoCapture(self.camera_index, cv2.CAP_DSHOW if sys.platform == "win32" else 0)
        if not self.cap.isOpened():
            # Fallback without CAP_DSHOW
            self.cap = cv2.VideoCapture(self.camera_index)

        if not self.cap.isOpened():
            # Try camera index 1
            self.cap = cv2.VideoCapture(1)

        if self.cap.isOpened():
            # Configure resolution and FPS
            self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
            self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
            self.cap.set(cv2.CAP_PROP_FPS, 30)
            return True

        return False

    def run(self):
        """Main application lifecycle loop."""
        self.is_running = True
        camera_ok = self.open_camera()

        cv2.namedWindow(self.window_name, cv2.WINDOW_AUTOSIZE)

        prev_time = time.time()
        fps = 30.0

        while self.is_running:
            # Handle camera failure gracefully
            if not camera_ok or not self.cap.isOpened():
                err_frame = ui.render_camera_error_frame(640, 480)
                cv2.imshow(self.window_name, err_frame)
                key = cv2.waitKey(100) & 0xFF
                if key in (ord("q"), ord("Q"), 27):
                    break
                elif key in (ord("r"), ord("R")):
                    camera_ok = self.open_camera()
                continue

            ret, frame = self.cap.read()
            if not ret or frame is None:
                err_frame = ui.render_camera_error_frame(640, 480)
                cv2.imshow(self.window_name, err_frame)
                key = cv2.waitKey(100) & 0xFF
                if key in (ord("q"), ord("Q"), 27):
                    break
                elif key in (ord("r"), ord("R")):
                    camera_ok = self.open_camera()
                continue

            # Mirror frame horizontally for natural user interaction
            frame = cv2.flip(frame, 1)
            h, w, _ = frame.shape

            # Calculate FPS
            curr_time = time.time()
            dt = curr_time - prev_time
            if dt > 0:
                fps = 0.9 * fps + 0.1 * (1.0 / dt)
            prev_time = curr_time

            has_hand = False
            detected_gesture = "NONE"
            debug_info = {}

            # Process hand detection if not paused
            if not self.is_paused:
                rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                mp_img = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_frame)
                result = self.landmarker.detect(mp_img)

                if result.hand_landmarks and len(result.hand_landmarks) > 0:
                    has_hand = True
                    hand_lms = result.hand_landmarks[0]

                    # Classify gesture
                    detected_gesture, debug_info = self.detector.classify_frame(hand_lms)

                    # Update state machine and dispatch actions
                    hud_data = self.state_manager.update(detected_gesture, debug_info)
                    hud_data["has_hand"] = True

                    # Render skeleton overlay
                    ui.draw_skeleton(frame, hand_lms, detected_gesture)
                else:
                    # No hand in frame
                    hud_data = self.state_manager.update("NONE", {})
                    hud_data["has_hand"] = False
            else:
                # Paused state
                hud_data = {
                    "has_hand": False,
                    "gesture": "NONE",
                    "state_label": "PAUSED",
                    "progress": 0.0,
                    "banner_active": False,
                }

            # Render Modern Glassmorphic HUD
            ui.draw_hud(frame, hud_data, is_paused=self.is_paused, fps=fps)

            cv2.imshow(self.window_name, frame)

            # Keyboard shortcuts
            key = cv2.waitKey(1) & 0xFF
            if key in (ord("q"), ord("Q"), 27):  # Q or Esc to quit
                break
            elif key in (ord("p"), ord("P")):    # P to pause/resume
                self.is_paused = not self.is_paused
                # Reset gesture states when paused
                if self.is_paused:
                    self.state_manager.update("NONE", {})

        # Clean shutdown
        self.cleanup()

    def cleanup(self):
        """Releases camera and closes UI windows."""
        self.is_running = False
        if self.cap is not None:
            self.cap.release()
            self.cap = None
        cv2.destroyAllWindows()


def run_app():
    app = HandControlApp()
    app.run()


if __name__ == "__main__":
    run_app()
