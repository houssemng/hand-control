"""
Gesture recognition and state management for Hand Control.
Implements geometric landmark analysis, angle thresholding,
hold-confirmation timing, and single-press vs continuous repeat logic.
"""

import math
import time
from typing import List, Optional, Tuple, Dict, Any


class LandmarkPoint:
    def __init__(self, x: float, y: float, z: float = 0.0):
        self.x = x
        self.y = y
        self.z = z


def distance(p1, p2) -> float:
    return math.hypot(p1.x - p2.x, p1.y - p2.y)


class GestureDetector:
    """
    Classifies 21 MediaPipe hand landmarks into user gestures:
    - THUMBS_UP (Volume Up)
    - THUMBS_DOWN (Volume Down)
    - POINT_RIGHT (Right Arrow)
    - POINT_LEFT (Left Arrow)
    - PINCH (Space Bar)
    - NONE / DIAGONAL_IGNORED
    """

    # Maximum tangent for horizontal or vertical alignment:
    # tan(32 degrees) ~ 0.625. If ratio exceeds this, it's diagonal.
    MAX_DIAGONAL_RATIO = 0.62

    def __init__(self):
        pass

    def is_finger_folded(self, landmarks, tip_idx: int, pip_idx: int, mcp_idx: int, palm_scale: float) -> bool:
        tip = landmarks[tip_idx]
        pip = landmarks[pip_idx]
        mcp = landmarks[mcp_idx]
        wrist = landmarks[0]

        d_tip_mcp = distance(tip, mcp)
        d_pip_mcp = distance(pip, mcp)
        d_tip_wrist = distance(tip, wrist)
        d_pip_wrist = distance(pip, wrist)

        # A finger is folded if tip is curled back toward palm/wrist
        if d_tip_wrist < d_pip_wrist * 1.05:
            return True
        if d_tip_mcp < d_pip_mcp * 1.15:
            return True
        return False

    def is_finger_extended(self, landmarks, tip_idx: int, pip_idx: int, mcp_idx: int, palm_scale: float) -> bool:
        tip = landmarks[tip_idx]
        pip = landmarks[pip_idx]
        mcp = landmarks[mcp_idx]
        wrist = landmarks[0]

        d_tip_mcp = distance(tip, mcp)
        d_pip_mcp = distance(pip, mcp)
        d_tip_wrist = distance(tip, wrist)
        d_pip_wrist = distance(pip, wrist)

        return (d_tip_mcp > d_pip_mcp * 1.35) and (d_tip_wrist > d_pip_wrist * 1.15) and (d_tip_mcp > 0.65 * palm_scale)

    def classify_frame(self, landmarks) -> Tuple[str, Dict[str, Any]]:
        """
        Classifies landmarks in a horizontally-flipped frame.
        Returns (gesture_name, debug_info).
        """
        if not landmarks or len(landmarks) < 21:
            return "NONE", {}

        wrist = landmarks[0]
        middle_mcp = landmarks[9]
        palm_scale = distance(wrist, middle_mcp)

        if palm_scale < 0.05:
            return "NONE", {"reason": "hand_too_small"}

        # Finger folded / extended states
        index_ext = self.is_finger_extended(landmarks, 8, 6, 5, palm_scale)
        middle_ext = self.is_finger_extended(landmarks, 12, 10, 9, palm_scale)
        ring_ext = self.is_finger_extended(landmarks, 16, 14, 13, palm_scale)
        pinky_ext = self.is_finger_extended(landmarks, 20, 18, 17, palm_scale)

        index_fold = self.is_finger_folded(landmarks, 8, 6, 5, palm_scale)
        middle_fold = self.is_finger_folded(landmarks, 12, 10, 9, palm_scale)
        ring_fold = self.is_finger_folded(landmarks, 16, 14, 13, palm_scale)
        pinky_fold = self.is_finger_folded(landmarks, 20, 18, 17, palm_scale)

        # Pinch detection (Thumb Tip 4 and Index Tip 8)
        pinch_dist = distance(landmarks[4], landmarks[8]) / palm_scale

        debug_info = {
            "palm_scale": palm_scale,
            "pinch_dist": pinch_dist,
            "index_ext": index_ext,
            "middle_ext": middle_ext,
            "ring_ext": ring_ext,
            "pinky_ext": pinky_ext,
        }

        # 1. PINCH GESTURE
        # Thumb tip and index tip close together
        if pinch_dist < 0.32:
            return "PINCH", debug_info

        # Other 3 fingers (middle, ring, pinky) must be curled for thumbs or pointing
        other_fingers_folded = middle_fold and ring_fold and pinky_fold

        # 2. THUMBS UP / THUMBS DOWN
        # For thumbs up/down, index must also be folded (tight fist with thumb out)
        if other_fingers_folded and index_fold:
            thumb_mcp = landmarks[2]
            thumb_tip = landmarks[4]
            dx = thumb_tip.x - thumb_mcp.x
            dy = thumb_tip.y - thumb_mcp.y

            thumb_len = math.hypot(dx, dy)
            if thumb_len > 0.35 * palm_scale:
                abs_dx = abs(dx)
                abs_dy = abs(dy)

                # Upright constraint: must be predominantly vertical
                if abs_dy > 0:
                    tilt_ratio = abs_dx / abs_dy
                    debug_info["tilt_ratio"] = tilt_ratio

                    # Diagonal check
                    if tilt_ratio > self.MAX_DIAGONAL_RATIO:
                        return "DIAGONAL_IGNORED", debug_info

                    # Thumbs UP (dy < 0 in screen coords)
                    if dy < 0 and thumb_tip.y < wrist.y - 0.2 * palm_scale:
                        return "THUMBS_UP", debug_info

                    # Thumbs DOWN (dy > 0 in screen coords)
                    if dy > 0 and thumb_tip.y > wrist.y + 0.1 * palm_scale:
                        return "THUMBS_DOWN", debug_info

        # 3. POINT RIGHT / POINT LEFT
        # Index extended, middle/ring/pinky folded
        if index_ext and other_fingers_folded and pinch_dist > 0.38:
            index_mcp = landmarks[5]
            index_tip = landmarks[8]
            dx = index_tip.x - index_mcp.x
            dy = index_tip.y - index_mcp.y

            abs_dx = abs(dx)
            abs_dy = abs(dy)

            if abs_dx > 0.40 * palm_scale:
                tilt_ratio = abs_dy / abs_dx
                debug_info["tilt_ratio"] = tilt_ratio

                # Level constraint: must be predominantly horizontal
                if tilt_ratio > self.MAX_DIAGONAL_RATIO:
                    return "DIAGONAL_IGNORED", debug_info

                # Point RIGHT (dx > 0 in mirrored frame)
                if dx > 0:
                    return "POINT_RIGHT", debug_info

                # Point LEFT (dx < 0 in mirrored frame)
                if dx < 0:
                    return "POINT_LEFT", debug_info

        return "NONE", debug_info


class GestureStateManager:
    """
    Manages hold-time confirmation, state transitions, visual progress calculation,
    single-press firing (Arrows, Space) and continuous repeat (Volume).
    """

    HOLD_TIME_STANDARD = 0.38   # Hold threshold before firing
    HOLD_TIME_PINCH = 0.15      # Pinch fires swiftly once pressed
    VOLUME_REPEAT_INTERVAL = 0.16 # Interval between continuous volume clicks

    def __init__(self, action_controller):
        self.controller = action_controller

        self.current_candidate = "NONE"
        self.hold_start_time = 0.0
        self.current_hold_duration = 0.0

        # State tracking
        self.has_fired_single = False
        self.is_pinch_active = False
        self.last_continuous_fire_time = 0.0

        # Recent UI feedback
        self.last_action_banner = ""
        self.last_action_banner_time = 0.0

    def update(self, detected_gesture: str, debug_info: Dict[str, Any]) -> Dict[str, Any]:
        """
        Updates gesture timer and triggers controller actions.
        Returns status dictionary for HUD rendering.
        """
        now = time.time()

        # Handle pinch release hysteresis
        pinch_dist = debug_info.get("pinch_dist", 1.0)
        if self.is_pinch_active and pinch_dist > 0.45:
            self.is_pinch_active = False

        # Ignore diagonal and none for triggering
        is_actionable = detected_gesture in ("THUMBS_UP", "THUMBS_DOWN", "POINT_RIGHT", "POINT_LEFT", "PINCH")

        if is_actionable:
            if detected_gesture == self.current_candidate:
                self.current_hold_duration = now - self.hold_start_time
            else:
                self.current_candidate = detected_gesture
                self.hold_start_time = now
                self.current_hold_duration = 0.0
                self.has_fired_single = False
        else:
            self.current_candidate = detected_gesture
            self.current_hold_duration = 0.0
            self.has_fired_single = False

        required_hold = self.HOLD_TIME_PINCH if detected_gesture == "PINCH" else self.HOLD_TIME_STANDARD
        progress = 0.0
        if is_actionable and required_hold > 0:
            progress = min(1.0, self.current_hold_duration / required_hold)

        # Trigger logic
        action_triggered = None

        if is_actionable and progress >= 1.0:
            if detected_gesture == "THUMBS_UP":
                # Continuous repeat while held
                if now - self.last_continuous_fire_time >= self.VOLUME_REPEAT_INTERVAL:
                    self.controller.trigger_volume_up()
                    self.last_continuous_fire_time = now
                    action_triggered = "VOLUME_UP"
                    self.last_action_banner = "🔊 Volume Up"
                    self.last_action_banner_time = now

            elif detected_gesture == "THUMBS_DOWN":
                # Continuous repeat while held
                if now - self.last_continuous_fire_time >= self.VOLUME_REPEAT_INTERVAL:
                    self.controller.trigger_volume_down()
                    self.last_continuous_fire_time = now
                    action_triggered = "VOLUME_DOWN"
                    self.last_action_banner = "🔉 Volume Down"
                    self.last_action_banner_time = now

            elif detected_gesture == "POINT_RIGHT":
                # One press per hold
                if not self.has_fired_single:
                    self.controller.trigger_arrow_right()
                    self.has_fired_single = True
                    action_triggered = "POINT_RIGHT"
                    self.last_action_banner = "➡️ Right Arrow"
                    self.last_action_banner_time = now

            elif detected_gesture == "POINT_LEFT":
                # One press per hold
                if not self.has_fired_single:
                    self.controller.trigger_arrow_left()
                    self.has_fired_single = True
                    action_triggered = "POINT_LEFT"
                    self.last_action_banner = "⬅️ Left Arrow"
                    self.last_action_banner_time = now

            elif detected_gesture == "PINCH":
                # One press per pinch
                if not self.is_pinch_active and not self.has_fired_single:
                    self.controller.trigger_space()
                    self.has_fired_single = True
                    self.is_pinch_active = True
                    action_triggered = "PINCH"
                    self.last_action_banner = "⏯️ Space Bar"
                    self.last_action_banner_time = now

        # Compute status for UI
        state_label = "READY"
        if detected_gesture == "DIAGONAL_IGNORED":
            state_label = "DIAGONAL IGNORED"
        elif is_actionable:
            if progress < 1.0:
                state_label = f"HOLDING ({int(progress * 100)}%)"
            else:
                if detected_gesture in ("THUMBS_UP", "THUMBS_DOWN"):
                    state_label = "ACTIVE"
                else:
                    state_label = "TRIGGERED"

        return {
            "gesture": detected_gesture,
            "progress": progress,
            "state_label": state_label,
            "has_fired_single": self.has_fired_single,
            "action_triggered": action_triggered,
            "last_action_banner": self.last_action_banner,
            "banner_active": (now - self.last_action_banner_time < 0.9),
        }
