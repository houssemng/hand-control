"""
Lightweight embedded streaming server for Hand Control.
Runs an HTTP server in a background thread to broadcast MJPEG video feeds
and real-time gesture telemetry JSON to the Next.js dashboard.
Zero external dependencies required (uses standard library http.server).
"""

import json
import threading
import time
import cv2
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from typing import Optional, Dict, Any

_latest_frame_bytes: Optional[bytes] = None
_latest_status: Dict[str, Any] = {
    "online": False,
    "has_hand": False,
    "gesture": "NONE",
    "state_label": "OFFLINE",
    "fps": 0.0,
    "resolution": "640x480",
    "is_paused": False,
    "last_action": None,
    "last_action_time": 0.0,
    "camera_name": "Webcam 0",
}
_lock = threading.Lock()
_server_instance: Optional[ThreadingHTTPServer] = None
_server_thread: Optional[threading.Thread] = None


class StreamRequestHandler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        # Silence standard HTTP access logging in terminal
        pass

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self):
        path = self.path.split("?")[0]

        if path in ("/api/status", "/status"):
            with _lock:
                status_copy = dict(_latest_status)
            payload = json.dumps(status_copy).encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header("Content-Length", str(len(payload)))
            self.end_headers()
            self.wfile.write(payload)

        elif path in ("/video_feed", "/stream"):
            self.send_response(200)
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header("Content-Type", "multipart/x-mixed-replace; boundary=frame")
            self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
            self.send_header("Pragma", "no-cache")
            self.send_header("Expires", "0")
            self.end_headers()

            while True:
                with _lock:
                    frame = _latest_frame_bytes
                    is_online = _latest_status.get("online", False)

                if not is_online:
                    break

                if frame is not None:
                    try:
                        header = (
                            b"--frame\r\n"
                            b"Content-Type: image/jpeg\r\n"
                            + f"Content-Length: {len(frame)}\r\n\r\n".encode("utf-8")
                        )
                        self.wfile.write(header)
                        self.wfile.write(frame)
                        self.wfile.write(b"\r\n")
                    except (BrokenPipeError, ConnectionResetError):
                        break

                time.sleep(0.033)  # ~30 FPS stream cap

        else:
            msg = b'{"service":"Hand Control Live Server","endpoints":["/api/status","/video_feed"]}'
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header("Content-Length", str(len(msg)))
            self.end_headers()
            self.wfile.write(msg)


def update_feed(frame_bgr, status_info: Dict[str, Any]):
    """Called by app.py on every frame loop to update live stream."""
    global _latest_frame_bytes, _latest_status

    # Encode frame to JPEG
    ret, jpeg = cv2.imencode(".jpg", frame_bgr, [cv2.IMWRITE_JPEG_QUALITY, 80])
    if ret:
        with _lock:
            _latest_frame_bytes = jpeg.tobytes()
            _latest_status.update(status_info)
            _latest_status["online"] = True


def start_server(port: int = 8000):
    """Starts the HTTP streaming server on a background daemon thread."""
    global _server_instance, _server_thread

    if _server_instance is not None:
        return

    try:
        _server_instance = ThreadingHTTPServer(("0.0.0.0", port), StreamRequestHandler)
        _server_thread = threading.Thread(target=_server_instance.serve_forever, daemon=True)
        _server_thread.start()
        print(f"[HandControl] Live stream server started at http://localhost:{port}/video_feed")
    except Exception as e:
        print(f"[HandControl] Warning: could not start stream server on port {port}: {e}")


def stop_server():
    """Stops the streaming server."""
    global _server_instance, _latest_status
    with _lock:
        _latest_status["online"] = False
        _latest_status["state_label"] = "OFFLINE"

    if _server_instance is not None:
        try:
            _server_instance.shutdown()
            _server_instance.server_close()
        except Exception:
            pass
        _server_instance = None
