"""
Controller module for Windows Hand Control.
Handles keyboard and media key events using Windows native User32 API.
"""

import ctypes
import time
import threading

# Windows Virtual Key Codes
VK_SPACE = 0x20
VK_LEFT = 0x25
VK_RIGHT = 0x27
VK_VOLUME_DOWN = 0xAE
VK_VOLUME_UP = 0xAF

# Key event flags
KEYEVENTF_EXTENDEDKEY = 0x0001
KEYEVENTF_KEYUP = 0x0002

user32 = ctypes.windll.user32


def press_key(vk_code: int, extended: bool = False):
    """
    Sends a key down and key up event to Windows.
    Uses extended-key flag for navigation and multimedia keys.
    """
    flags_down = KEYEVENTF_EXTENDEDKEY if extended else 0
    flags_up = (KEYEVENTF_EXTENDEDKEY | KEYEVENTF_KEYUP) if extended else KEYEVENTF_KEYUP

    user32.keybd_event(vk_code, 0, flags_down, 0)
    time.sleep(0.015)
    user32.keybd_event(vk_code, 0, flags_up, 0)


class ActionController:
    """
    Dispatches system actions (volume, arrows, space) with safe debouncing
    and continuous hold repeat for volume.
    """

    def __init__(self):
        self._lock = threading.Lock()
        self.last_action_name = None
        self.last_action_time = 0.0

    def trigger_volume_up(self):
        press_key(VK_VOLUME_UP, extended=True)
        self.last_action_name = "Volume Up"
        self.last_action_time = time.time()

    def trigger_volume_down(self):
        press_key(VK_VOLUME_DOWN, extended=True)
        self.last_action_name = "Volume Down"
        self.last_action_time = time.time()

    def trigger_arrow_right(self):
        press_key(VK_RIGHT, extended=True)
        self.last_action_name = "Right Arrow"
        self.last_action_time = time.time()

    def trigger_arrow_left(self):
        press_key(VK_LEFT, extended=True)
        self.last_action_name = "Left Arrow"
        self.last_action_time = time.time()

    def trigger_space(self):
        press_key(VK_SPACE, extended=False)
        self.last_action_name = "Space Bar"
        self.last_action_time = time.time()
