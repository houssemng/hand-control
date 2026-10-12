"""
UI and HUD overlay renderer for Hand Control.
Provides high-contrast, modern glassmorphic interface elements,
smooth skeleton rendering, progress indicators, and gesture notifications.
"""

import cv2
import numpy as np
import time
from typing import List, Tuple, Dict, Any, Optional

# Palette (BGR format for OpenCV)
COLOR_BG_DARK = (18, 18, 24)
COLOR_TEXT_WHITE = (245, 245, 250)
COLOR_TEXT_MUTED = (160, 165, 180)
COLOR_ACCENT_CYAN = (235, 180, 40)       # Electric cyan/sky
COLOR_ACCENT_GREEN = (60, 220, 120)     # Emerald green
COLOR_ACCENT_ORANGE = (30, 150, 255)    # Amber/orange
COLOR_ACCENT_RED = (80, 80, 245)        # Soft crimson
COLOR_ACCENT_YELLOW = (40, 220, 245)    # Gold
COLOR_SKELETON_BONE = (200, 190, 80)    # Soft cyan bone
COLOR_SKELETON_JOINT = (250, 230, 140)  # Bright joint node
COLOR_ACTIVE_PINCH = (60, 240, 180)     # Glowing mint green


# Hand landmark connections
CONNECTIONS = [
    # Thumb
    (0, 1), (1, 2), (2, 3), (3, 4),
    # Index
    (0, 5), (5, 6), (6, 7), (7, 8),
    # Middle
    (0, 9), (9, 10), (10, 11), (11, 12),
    # Ring
    (0, 13), (13, 14), (14, 15), (15, 16),
    # Pinky
    (0, 17), (17, 18), (18, 19), (19, 20),
    # Palm bridges
    (5, 9), (9, 13), (13, 17)
]


def draw_rounded_rect(img, pt1, pt2, color, thickness=-1, radius=10):
    """Draws a rectangle with rounded corners."""
    x1, y1 = pt1
    x2, y2 = pt2
    w = x2 - x1
    h = y2 - y1
    radius = min(radius, w // 2, h // 2)

    if thickness == -1:
        # Filled rounded rectangle
        cv2.rectangle(img, (x1 + radius, y1), (x2 - radius, y2), color, -1)
        cv2.rectangle(img, (x1, y1 + radius), (x2, y2 - radius), color, -1)
        cv2.circle(img, (x1 + radius, y1 + radius), radius, color, -1)
        cv2.circle(img, (x2 - radius, y1 + radius), radius, color, -1)
        cv2.circle(img, (x1 + radius, y2 - radius), radius, color, -1)
        cv2.circle(img, (x2 - radius, y2 - radius), radius, color, -1)
    else:
        # Outlined
        cv2.line(img, (x1 + radius, y1), (x2 - radius, y1), color, thickness)
        cv2.line(img, (x1 + radius, y2), (x2 - radius, y2), color, thickness)
        cv2.line(img, (x1, y1 + radius), (x1, y2 - radius), color, thickness)
        cv2.line(img, (x2, y1 + radius), (x2, y2 - radius), color, thickness)
        cv2.ellipse(img, (x1 + radius, y1 + radius), (radius, radius), 180, 0, 90, color, thickness)
        cv2.ellipse(img, (x2 - radius, y1 + radius), (radius, radius), 270, 0, 90, color, thickness)
        cv2.ellipse(img, (x1 + radius, y2 - radius), (radius, radius), 90, 0, 90, color, thickness)
        cv2.ellipse(img, (x2 - radius, y2 - radius), (radius, radius), 0, 0, 90, color, thickness)


def draw_skeleton(frame, landmarks, gesture_name: str):
    """
    Renders high-tech glowing skeleton overlay on the detected hand.
    """
    h, w, _ = frame.shape
    coords = []
    for lm in landmarks:
        cx = int(lm.x * w)
        cy = int(lm.y * h)
        coords.append((cx, cy))

    # Determine highlight color based on gesture
    bone_color = COLOR_SKELETON_BONE
    if gesture_name in ("THUMBS_UP", "THUMBS_DOWN"):
        bone_color = (100, 210, 255)
    elif gesture_name in ("POINT_RIGHT", "POINT_LEFT"):
        bone_color = (255, 180, 90)
    elif gesture_name == "PINCH":
        bone_color = COLOR_ACTIVE_PINCH

    # Draw bone connections
    for start_idx, end_idx in CONNECTIONS:
        pt1 = coords[start_idx]
        pt2 = coords[end_idx]
        # Anti-aliased lines with dual glow
        cv2.line(frame, pt1, pt2, (bone_color[0] // 3, bone_color[1] // 3, bone_color[2] // 3), 4, cv2.LINE_AA)
        cv2.line(frame, pt1, pt2, bone_color, 2, cv2.LINE_AA)

    # Draw pinch indicator if pinching
    if gesture_name == "PINCH":
        p_thumb = coords[4]
        p_index = coords[8]
        mid_x = (p_thumb[0] + p_index[0]) // 2
        mid_y = (p_thumb[1] + p_index[1]) // 2
        cv2.line(frame, p_thumb, p_index, (255, 255, 255), 3, cv2.LINE_AA)
        cv2.circle(frame, (mid_x, mid_y), 10, COLOR_ACTIVE_PINCH, -1, cv2.LINE_AA)
        cv2.circle(frame, (mid_x, mid_y), 14, (255, 255, 255), 2, cv2.LINE_AA)

    # Draw joint nodes
    for i, pt in enumerate(coords):
        radius = 4
        if i in (4, 8, 12, 16, 20):  # Fingertips
            radius = 6
            cv2.circle(frame, pt, radius + 2, (255, 255, 255), 1, cv2.LINE_AA)
        cv2.circle(frame, pt, radius, COLOR_SKELETON_JOINT, -1, cv2.LINE_AA)


def draw_hud(frame, hud_data: Dict[str, Any], is_paused: bool = False, fps: float = 0.0):
    """
    Renders top status bar, gesture indicators, progress bars, and bottom instructions.
    """
    h, w, _ = frame.shape
    overlay = frame.copy()

    # 1. Top Glassmorphic Navigation Bar
    top_bar_h = 75
    cv2.rectangle(overlay, (0, 0), (w, top_bar_h), (12, 12, 16), -1)

    # 2. Bottom Glassmorphic Reference Bar
    bot_bar_h = 55
    cv2.rectangle(overlay, (0, h - bot_bar_h), (w, h), (12, 12, 16), -1)

    # Blend top & bottom bars for transparency
    cv2.addWeighted(overlay, 0.85, frame, 0.15, 0, frame)

    # Top Bar: App Title
    cv2.putText(frame, "HAND CONTROL", (20, 32), cv2.FONT_HERSHEY_DUPLEX, 0.85, COLOR_TEXT_WHITE, 2, cv2.LINE_AA)

    # Hand Status indicator
    has_hand = hud_data.get("has_hand", False)
    if has_hand:
        cv2.circle(frame, (230, 25), 6, COLOR_ACCENT_GREEN, -1, cv2.LINE_AA)
        cv2.putText(frame, "HAND TRACKED", (245, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.45, COLOR_ACCENT_GREEN, 1, cv2.LINE_AA)
    else:
        cv2.circle(frame, (230, 25), 6, COLOR_TEXT_MUTED, -1, cv2.LINE_AA)
        cv2.putText(frame, "SEARCHING...", (245, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.45, COLOR_TEXT_MUTED, 1, cv2.LINE_AA)

    # FPS counter on top right
    if fps > 0:
        cv2.putText(frame, f"{int(fps)} FPS", (w - 85, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.45, COLOR_TEXT_MUTED, 1, cv2.LINE_AA)

    # Current Gesture & State Badge
    gesture = hud_data.get("gesture", "NONE")
    state_label = hud_data.get("state_label", "READY")
    progress = hud_data.get("progress", 0.0)

    # Format gesture display name
    gesture_labels = {
        "THUMBS_UP": "THUMBS UP -> Volume Up",
        "THUMBS_DOWN": "THUMBS DOWN -> Volume Down",
        "POINT_RIGHT": "POINT RIGHT -> Next (Right)",
        "POINT_LEFT": "POINT LEFT -> Prev (Left)",
        "PINCH": "PINCH -> Space Bar",
        "DIAGONAL_IGNORED": "DIAGONAL (Ignored)",
        "NONE": "Ready",
    }
    display_name = gesture_labels.get(gesture, gesture)

    # Badge Color
    badge_color = COLOR_TEXT_MUTED
    if gesture == "DIAGONAL_IGNORED":
        badge_color = COLOR_ACCENT_ORANGE
    elif gesture in ("THUMBS_UP", "THUMBS_DOWN"):
        badge_color = COLOR_ACCENT_CYAN if progress < 1.0 else COLOR_ACCENT_GREEN
    elif gesture in ("POINT_RIGHT", "POINT_LEFT", "PINCH"):
        badge_color = COLOR_ACCENT_YELLOW if progress < 1.0 else COLOR_ACCENT_GREEN

    # Render Current Gesture Subtitle
    cv2.putText(frame, f"Gesture: {display_name}", (20, 58), cv2.FONT_HERSHEY_SIMPLEX, 0.52, (220, 225, 230), 1, cv2.LINE_AA)

    # Render State Status Tag
    state_str = f"[{state_label}]"
    cv2.putText(frame, state_str, (w - 230, 58), cv2.FONT_HERSHEY_SIMPLEX, 0.52, badge_color, 2, cv2.LINE_AA)

    # Hold Progress Bar across top bar bottom
    bar_y = top_bar_h - 4
    cv2.line(frame, (0, bar_y), (w, bar_y), (40, 45, 55), 3)
    if progress > 0.0:
        fill_w = int(w * progress)
        p_color = COLOR_ACCENT_YELLOW if progress < 1.0 else COLOR_ACCENT_GREEN
        cv2.line(frame, (0, bar_y), (fill_w, bar_y), p_color, 4)

    # Diagonal warning notification banner
    if gesture == "DIAGONAL_IGNORED":
        card_w, card_h = 480, 36
        cx = (w - card_w) // 2
        cy = top_bar_h + 15
        overlay2 = frame.copy()
        draw_rounded_rect(overlay2, (cx, cy), (cx + card_w, cy + card_h), (25, 20, 50), -1, 6)
        cv2.addWeighted(overlay2, 0.9, frame, 0.1, 0, frame)
        draw_rounded_rect(frame, (cx, cy), (cx + card_w, cy + card_h), COLOR_ACCENT_ORANGE, 1, 6)
        cv2.putText(frame, "! Diagonal gesture ignored: Keep hand upright or level", (cx + 16, cy + 24),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.46, (240, 200, 150), 1, cv2.LINE_AA)

    # Action Triggered Pop-up Banner (centered feedback)
    if hud_data.get("banner_active", False):
        banner_text = hud_data.get("last_action_banner", "")
        if banner_text:
            b_w, b_h = 320, 56
            bx = (w - b_w) // 2
            by = h - bot_bar_h - 75

            # Glowing rounded card
            overlay_banner = frame.copy()
            draw_rounded_rect(overlay_banner, (bx, by), (bx + b_w, by + b_h), (20, 35, 25), -1, 10)
            cv2.addWeighted(overlay_banner, 0.92, frame, 0.08, 0, frame)
            draw_rounded_rect(frame, (bx, by), (bx + b_w, by + b_h), COLOR_ACCENT_GREEN, 2, 10)

            # Center text
            (tw, th), _ = cv2.getTextSize(banner_text, cv2.FONT_HERSHEY_DUPLEX, 0.75, 2)
            tx = bx + (b_w - tw) // 2
            ty = by + (b_h + th) // 2 - 2
            cv2.putText(frame, banner_text, (tx, ty), cv2.FONT_HERSHEY_DUPLEX, 0.75, COLOR_TEXT_WHITE, 2, cv2.LINE_AA)

    # Bottom Instructions Bar
    guide_text = "Thumbs: Vol +/-  |  Index: Left / Right  |  Pinch: Space"
    hotkeys_text = "[P] Pause   [Q/Esc] Quit"

    cv2.putText(frame, guide_text, (20, h - 22), cv2.FONT_HERSHEY_SIMPLEX, 0.48, (210, 215, 225), 1, cv2.LINE_AA)

    (hkw, _), _ = cv2.getTextSize(hotkeys_text, cv2.FONT_HERSHEY_SIMPLEX, 0.48, 1)
    cv2.putText(frame, hotkeys_text, (w - hkw - 20, h - 22), cv2.FONT_HERSHEY_SIMPLEX, 0.48, COLOR_TEXT_MUTED, 1, cv2.LINE_AA)

    # Paused Overlay
    if is_paused:
        pause_overlay = frame.copy()
        cv2.rectangle(pause_overlay, (0, 0), (w, h), (10, 10, 15), -1)
        cv2.addWeighted(pause_overlay, 0.75, frame, 0.25, 0, frame)

        pw, ph = 420, 160
        px1 = (w - pw) // 2
        py1 = (h - ph) // 2
        px2 = px1 + pw
        py2 = py1 + ph

        draw_rounded_rect(frame, (px1, py1), (px2, py2), (25, 25, 35), -1, 12)
        draw_rounded_rect(frame, (px1, py1), (px2, py2), COLOR_ACCENT_CYAN, 2, 12)

        p_title = "PAUSED"
        (ptw, _), _ = cv2.getTextSize(p_title, cv2.FONT_HERSHEY_DUPLEX, 1.2, 2)
        cv2.putText(frame, p_title, (px1 + (pw - ptw) // 2, py1 + 60), cv2.FONT_HERSHEY_DUPLEX, 1.2, COLOR_TEXT_WHITE, 2, cv2.LINE_AA)

        p_sub = "Press 'P' to resume Hand Control"
        (psw, _), _ = cv2.getTextSize(p_sub, cv2.FONT_HERSHEY_SIMPLEX, 0.55, 1)
        cv2.putText(frame, p_sub, (px1 + (pw - psw) // 2, py1 + 105), cv2.FONT_HERSHEY_SIMPLEX, 0.55, COLOR_TEXT_MUTED, 1, cv2.LINE_AA)

        p_sub2 = "Press 'Q' or 'Esc' to exit"
        (psw2, _), _ = cv2.getTextSize(p_sub2, cv2.FONT_HERSHEY_SIMPLEX, 0.45, 1)
        cv2.putText(frame, p_sub2, (px1 + (pw - psw2) // 2, py1 + 135), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (120, 125, 140), 1, cv2.LINE_AA)


def render_camera_error_frame(w=640, h=480) -> np.ndarray:
    """
    Renders an informative camera error screen when webcam cannot be accessed.
    """
    img = np.zeros((h, w, 3), dtype=np.uint8)
    img[:] = (18, 18, 24)

    # Error Box
    bw, bh = 560, 240
    bx1 = (w - bw) // 2
    by1 = (h - bh) // 2
    bx2 = bx1 + bw
    by2 = by1 + bh

    draw_rounded_rect(img, (bx1, by1), (bx2, by2), (30, 25, 35), -1, 12)
    draw_rounded_rect(img, (bx1, by1), (bx2, by2), COLOR_ACCENT_RED, 2, 12)

    t1 = "Cannot Open Camera"
    (tw1, _), _ = cv2.getTextSize(t1, cv2.FONT_HERSHEY_DUPLEX, 0.85, 2)
    cv2.putText(img, t1, (bx1 + (bw - tw1) // 2, by1 + 55), cv2.FONT_HERSHEY_DUPLEX, 0.85, (120, 130, 255), 2, cv2.LINE_AA)

    t2 = "Another app might be using your webcam (Zoom, Teams, Camera)."
    (tw2, _), _ = cv2.getTextSize(t2, cv2.FONT_HERSHEY_SIMPLEX, 0.48, 1)
    cv2.putText(img, t2, (bx1 + (bw - tw2) // 2, by1 + 105), cv2.FONT_HERSHEY_SIMPLEX, 0.48, COLOR_TEXT_WHITE, 1, cv2.LINE_AA)

    t3 = "Please close those apps, then press [R] to retry."
    (tw3, _), _ = cv2.getTextSize(t3, cv2.FONT_HERSHEY_SIMPLEX, 0.48, 1)
    cv2.putText(img, t3, (bx1 + (bw - tw3) // 2, by1 + 135), cv2.FONT_HERSHEY_SIMPLEX, 0.48, (200, 205, 220), 1, cv2.LINE_AA)

    t4 = "Press [Q] or [Esc] to quit."
    (tw4, _), _ = cv2.getTextSize(t4, cv2.FONT_HERSHEY_SIMPLEX, 0.45, 1)
    cv2.putText(img, t4, (bx1 + (bw - tw4) // 2, by1 + 185), cv2.FONT_HERSHEY_SIMPLEX, 0.45, COLOR_TEXT_MUTED, 1, cv2.LINE_AA)

    return img
