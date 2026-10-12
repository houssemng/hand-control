"""
Unit tests for Hand Control gestures and state machine logic.
"""

import unittest
import time
from gestures import GestureDetector, GestureStateManager, LandmarkPoint
from controller import ActionController


def create_mock_hand(orientation: str) -> list:
    """
    Constructs 21 synthetic landmark points approximating specific hand poses:
    - thumbs_up
    - thumbs_down
    - thumbs_diagonal
    - point_right
    - point_left
    - point_diagonal
    - pinch
    - neutral_open
    """
    wrist = LandmarkPoint(0.5, 0.7)
    # Palm scale ~ 0.25 (dist between 0 and 9)
    # Default base landmarks for palm
    lms = [wrist]

    if orientation == "thumbs_up":
        # Thumb extended straight UP (dy < 0)
        lms.append(LandmarkPoint(0.5, 0.65)) # 1 CMC
        lms.append(LandmarkPoint(0.48, 0.55)) # 2 MCP
        lms.append(LandmarkPoint(0.48, 0.45)) # 3 IP
        lms.append(LandmarkPoint(0.48, 0.30)) # 4 TIP (straight up, dx near 0, dy = -0.25)
        # Index folded
        lms.append(LandmarkPoint(0.45, 0.50)) # 5 MCP
        lms.append(LandmarkPoint(0.45, 0.58)) # 6 PIP
        lms.append(LandmarkPoint(0.45, 0.62)) # 7 DIP
        lms.append(LandmarkPoint(0.45, 0.60)) # 8 TIP (folded near palm)
        # Middle folded
        lms.append(LandmarkPoint(0.50, 0.48)) # 9 MCP
        lms.append(LandmarkPoint(0.50, 0.56)) # 10 PIP
        lms.append(LandmarkPoint(0.50, 0.61)) # 11 DIP
        lms.append(LandmarkPoint(0.50, 0.59)) # 12 TIP
        # Ring folded
        lms.append(LandmarkPoint(0.55, 0.50)) # 13 MCP
        lms.append(LandmarkPoint(0.55, 0.57)) # 14 PIP
        lms.append(LandmarkPoint(0.55, 0.61)) # 15 DIP
        lms.append(LandmarkPoint(0.55, 0.59)) # 16 TIP
        # Pinky folded
        lms.append(LandmarkPoint(0.60, 0.52)) # 17 MCP
        lms.append(LandmarkPoint(0.60, 0.58)) # 18 PIP
        lms.append(LandmarkPoint(0.60, 0.62)) # 19 DIP
        lms.append(LandmarkPoint(0.60, 0.60)) # 20 TIP

    elif orientation == "thumbs_down":
        # Wrist at top (0.5, 0.3)
        lms[0] = LandmarkPoint(0.5, 0.3)
        # Thumb pointing straight down
        lms.append(LandmarkPoint(0.5, 0.35)) # 1 CMC
        lms.append(LandmarkPoint(0.48, 0.45)) # 2 MCP
        lms.append(LandmarkPoint(0.48, 0.55)) # 3 IP
        lms.append(LandmarkPoint(0.48, 0.70)) # 4 TIP (dy > 0, straight down)
        # Index folded
        lms.append(LandmarkPoint(0.45, 0.48)) # 5 MCP
        lms.append(LandmarkPoint(0.45, 0.42)) # 6 PIP
        lms.append(LandmarkPoint(0.45, 0.38)) # 7 DIP
        lms.append(LandmarkPoint(0.45, 0.39)) # 8 TIP
        # Middle folded
        lms.append(LandmarkPoint(0.50, 0.50)) # 9 MCP
        lms.append(LandmarkPoint(0.50, 0.43)) # 10 PIP
        lms.append(LandmarkPoint(0.50, 0.39)) # 11 DIP
        lms.append(LandmarkPoint(0.50, 0.40)) # 12 TIP
        # Ring folded
        lms.append(LandmarkPoint(0.55, 0.48)) # 13 MCP
        lms.append(LandmarkPoint(0.55, 0.42)) # 14 PIP
        lms.append(LandmarkPoint(0.55, 0.39)) # 15 DIP
        lms.append(LandmarkPoint(0.55, 0.40)) # 16 TIP
        # Pinky folded
        lms.append(LandmarkPoint(0.60, 0.46)) # 17 MCP
        lms.append(LandmarkPoint(0.60, 0.41)) # 18 PIP
        lms.append(LandmarkPoint(0.60, 0.38)) # 19 DIP
        lms.append(LandmarkPoint(0.60, 0.39)) # 20 TIP

    elif orientation == "thumbs_diagonal":
        # Thumb tilted 45 degrees
        lms.append(LandmarkPoint(0.5, 0.65)) # 1 CMC
        lms.append(LandmarkPoint(0.48, 0.55)) # 2 MCP
        lms.append(LandmarkPoint(0.60, 0.43)) # 3 IP
        lms.append(LandmarkPoint(0.70, 0.33)) # 4 TIP (dx=0.22, dy=-0.22 -> ratio = 1.0)
        # Folded fingers
        for i in range(5, 21):
            lms.append(LandmarkPoint(0.45, 0.60))

    elif orientation == "point_right":
        # Thumb tucked
        lms.append(LandmarkPoint(0.46, 0.62)) # 1
        lms.append(LandmarkPoint(0.46, 0.58)) # 2
        lms.append(LandmarkPoint(0.46, 0.55)) # 3
        lms.append(LandmarkPoint(0.46, 0.52)) # 4
        # Index extended to the right (dx > 0, dy ~ 0)
        lms.append(LandmarkPoint(0.45, 0.50)) # 5 MCP
        lms.append(LandmarkPoint(0.55, 0.50)) # 6 PIP
        lms.append(LandmarkPoint(0.65, 0.50)) # 7 DIP
        lms.append(LandmarkPoint(0.75, 0.50)) # 8 TIP (extended right)
        # Middle, ring, pinky folded
        lms.append(LandmarkPoint(0.45, 0.52)) # 9 MCP
        lms.append(LandmarkPoint(0.45, 0.58)) # 10
        lms.append(LandmarkPoint(0.45, 0.62)) # 11
        lms.append(LandmarkPoint(0.45, 0.60)) # 12 TIP
        lms.append(LandmarkPoint(0.45, 0.54)) # 13 MCP
        lms.append(LandmarkPoint(0.45, 0.59)) # 14
        lms.append(LandmarkPoint(0.45, 0.63)) # 15
        lms.append(LandmarkPoint(0.45, 0.61)) # 16 TIP
        lms.append(LandmarkPoint(0.45, 0.56)) # 17 MCP
        lms.append(LandmarkPoint(0.45, 0.60)) # 18
        lms.append(LandmarkPoint(0.45, 0.64)) # 19
        lms.append(LandmarkPoint(0.45, 0.62)) # 20 TIP

    elif orientation == "point_left":
        # Thumb tucked
        lms.append(LandmarkPoint(0.54, 0.62)) # 1
        lms.append(LandmarkPoint(0.54, 0.58)) # 2
        lms.append(LandmarkPoint(0.54, 0.55)) # 3
        lms.append(LandmarkPoint(0.54, 0.52)) # 4
        # Index extended to the left (dx < 0, dy ~ 0)
        lms.append(LandmarkPoint(0.55, 0.50)) # 5 MCP
        lms.append(LandmarkPoint(0.45, 0.50)) # 6 PIP
        lms.append(LandmarkPoint(0.35, 0.50)) # 7 DIP
        lms.append(LandmarkPoint(0.25, 0.50)) # 8 TIP (extended left)
        # Middle, ring, pinky folded
        lms.append(LandmarkPoint(0.55, 0.52)) # 9 MCP
        lms.append(LandmarkPoint(0.55, 0.58)) # 10
        lms.append(LandmarkPoint(0.55, 0.62)) # 11
        lms.append(LandmarkPoint(0.55, 0.60)) # 12 TIP
        lms.append(LandmarkPoint(0.55, 0.54)) # 13 MCP
        lms.append(LandmarkPoint(0.55, 0.59)) # 14
        lms.append(LandmarkPoint(0.55, 0.63)) # 15
        lms.append(LandmarkPoint(0.55, 0.61)) # 16 TIP
        lms.append(LandmarkPoint(0.55, 0.56)) # 17 MCP
        lms.append(LandmarkPoint(0.55, 0.60)) # 18
        lms.append(LandmarkPoint(0.55, 0.64)) # 19
        lms.append(LandmarkPoint(0.55, 0.62)) # 20 TIP

    elif orientation == "pinch":
        # Thumb tip (4) and Index tip (8) very close
        lms.append(LandmarkPoint(0.48, 0.60)) # 1
        lms.append(LandmarkPoint(0.48, 0.56)) # 2
        lms.append(LandmarkPoint(0.48, 0.52)) # 3
        lms.append(LandmarkPoint(0.50, 0.48)) # 4 TIP
        lms.append(LandmarkPoint(0.50, 0.58)) # 5 MCP
        lms.append(LandmarkPoint(0.50, 0.54)) # 6 PIP
        lms.append(LandmarkPoint(0.50, 0.50)) # 7 DIP
        lms.append(LandmarkPoint(0.51, 0.48)) # 8 TIP (distance to 4 is ~0.01)
        # Other fingers
        for i in range(9, 21):
            lms.append(LandmarkPoint(0.55, 0.55))

    return lms


class MockActionController:
    def __init__(self):
        self.calls = []

    def trigger_volume_up(self):
        self.calls.append("VOLUME_UP")

    def trigger_volume_down(self):
        self.calls.append("VOLUME_DOWN")

    def trigger_arrow_right(self):
        self.calls.append("RIGHT_ARROW")

    def trigger_arrow_left(self):
        self.calls.append("LEFT_ARROW")

    def trigger_space(self):
        self.calls.append("SPACE")


class TestHandControl(unittest.TestCase):
    def setUp(self):
        self.detector = GestureDetector()

    def test_thumbs_up_classification(self):
        lms = create_mock_hand("thumbs_up")
        gesture, _ = self.detector.classify_frame(lms)
        self.assertEqual(gesture, "THUMBS_UP")

    def test_thumbs_down_classification(self):
        lms = create_mock_hand("thumbs_down")
        gesture, _ = self.detector.classify_frame(lms)
        self.assertEqual(gesture, "THUMBS_DOWN")

    def test_diagonal_ignored(self):
        lms = create_mock_hand("thumbs_diagonal")
        gesture, _ = self.detector.classify_frame(lms)
        self.assertEqual(gesture, "DIAGONAL_IGNORED")

    def test_point_right_classification(self):
        lms = create_mock_hand("point_right")
        gesture, _ = self.detector.classify_frame(lms)
        self.assertEqual(gesture, "POINT_RIGHT")

    def test_point_left_classification(self):
        lms = create_mock_hand("point_left")
        gesture, _ = self.detector.classify_frame(lms)
        self.assertEqual(gesture, "POINT_LEFT")

    def test_pinch_classification(self):
        lms = create_mock_hand("pinch")
        gesture, _ = self.detector.classify_frame(lms)
        self.assertEqual(gesture, "PINCH")

    def test_single_fire_point_right(self):
        mock_controller = MockActionController()
        manager = GestureStateManager(mock_controller)
        manager.HOLD_TIME_STANDARD = 0.05  # fast for test

        # Simulate frames holding point right
        for _ in range(5):
            manager.update("POINT_RIGHT", {"pinch_dist": 1.0})
            time.sleep(0.02)

        # Should fire exactly once
        self.assertEqual(mock_controller.calls, ["RIGHT_ARROW"])

        # Continuous holding still doesn't fire more
        for _ in range(5):
            manager.update("POINT_RIGHT", {"pinch_dist": 1.0})
            time.sleep(0.02)
        self.assertEqual(mock_controller.calls, ["RIGHT_ARROW"])

    def test_pinch_one_press_per_pinch(self):
        mock_controller = MockActionController()
        manager = GestureStateManager(mock_controller)
        manager.HOLD_TIME_PINCH = 0.02

        # Pinch frame 1 & 2
        manager.update("PINCH", {"pinch_dist": 0.20})
        time.sleep(0.03)
        manager.update("PINCH", {"pinch_dist": 0.20})
        self.assertEqual(mock_controller.calls, ["SPACE"])

        # Kept pinching - should NOT fire space again
        for _ in range(5):
            manager.update("PINCH", {"pinch_dist": 0.20})
            time.sleep(0.02)
        self.assertEqual(len(mock_controller.calls), 1)

        # Release pinch
        manager.update("NONE", {"pinch_dist": 0.60})

        # Pinch again
        manager.update("PINCH", {"pinch_dist": 0.20})
        time.sleep(0.03)
        manager.update("PINCH", {"pinch_dist": 0.20})
        self.assertEqual(len(mock_controller.calls), 2)


if __name__ == "__main__":
    unittest.main()
