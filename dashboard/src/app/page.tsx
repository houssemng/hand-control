"use client";

import React, { useState, useEffect, useRef } from "react";
import Header from "../components/Header";
import CameraCard, { CameraFeed } from "../components/CameraCard";
import TelemetrySidebar, { GestureEvent } from "../components/TelemetrySidebar";
import SpotlightModal from "../components/SpotlightModal";

export default function DashboardPage() {
  const [cameras, setCameras] = useState<CameraFeed[]>([]);
  const [viewMode, setViewMode] = useState<"grid" | "stage" | "focus">("grid");
  const [selectedCamId, setSelectedCamId] = useState<string | null>(null);
  const [spotlightCam, setSpotlightCam] = useState<CameraFeed | null>(null);
  const [isGlobalPaused, setIsGlobalPaused] = useState(false);
  const [currentGesture, setCurrentGesture] = useState<string>("NONE");
  const [events, setEvents] = useState<GestureEvent[]>([]);
  const [engineFps, setEngineFps] = useState(30);

  // Initialize and discover webcams
  const initCameras = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
        console.warn("MediaDevices API not available in this browser environment.");
        return;
      }

      // Initial permission request to obtain hardware labels
      let primaryStream: MediaStream | null = null;
      try {
        primaryStream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
      } catch (err) {
        console.warn("Camera access denied or unavailable:", err);
      }

      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter((d) => d.kind === "videoinput");

      const feeds: CameraFeed[] = [];

      if (videoDevices.length > 0) {
        // First hardware camera
        feeds.push({
          id: "cam-1",
          name: videoDevices[0].label || "Camera 1 (Primary Webcam)",
          deviceId: videoDevices[0].deviceId,
          stream: primaryStream,
          status: primaryStream ? "live" : "error",
        });

        // Additional physical cameras if attached
        for (let i = 1; i < videoDevices.length; i++) {
          try {
            const stream = await navigator.mediaDevices.getUserMedia({
              video: { deviceId: { exact: videoDevices[i].deviceId } },
              audio: false,
            });
            feeds.push({
              id: `cam-${i + 1}`,
              name: videoDevices[i].label || `Camera ${i + 1}`,
              deviceId: videoDevices[i].deviceId,
              stream: stream,
              status: "live",
            });
          } catch {
            feeds.push({
              id: `cam-${i + 1}`,
              name: videoDevices[i].label || `Camera ${i + 1}`,
              deviceId: videoDevices[i].deviceId,
              stream: primaryStream,
              isSimulated: true,
              simulatedAngle: "AUX FEED",
              status: "live",
            });
          }
        }
      }

      // If only 1 hardware camera is detected, populate multi-perspective feeds
      // using the primary stream with different AI filters and virtual angles
      if (feeds.length < 4) {
        const angleNames = [
          "CAM 02 - AI SKELETON DEPTH",
          "CAM 03 - HAND GESTURE TRACKER",
          "CAM 04 - OVERVIEW SURVEILLANCE",
        ];

        while (feeds.length < 4) {
          const idx = feeds.length;
          feeds.push({
            id: `cam-${idx + 1}`,
            name: angleNames[idx - 1] || `Camera ${idx + 1}`,
            stream: primaryStream,
            isSimulated: true,
            simulatedAngle: `ANGLE 0${idx + 1}`,
            status: primaryStream ? "live" : "connecting",
          });
        }
      }

      setCameras(feeds);
      if (feeds.length > 0 && !selectedCamId) {
        setSelectedCamId(feeds[0].id);
      }
    } catch (err) {
      console.error("Camera discovery error:", err);
    }
  };

  useEffect(() => {
    initCameras();
  }, []);

  // Gesture simulation loop for live telemetry display
  useEffect(() => {
    const gestureCycle = [
      { key: "THUMBS_UP", action: "Volume Up", conf: 0.98 },
      { key: "NONE", action: "Scanning", conf: 0.85 },
      { key: "POINT_RIGHT", action: "Right Arrow", conf: 0.96 },
      { key: "NONE", action: "Scanning", conf: 0.85 },
      { key: "PINCH", action: "Space Bar", conf: 0.99 },
      { key: "NONE", action: "Scanning", conf: 0.85 },
      { key: "THUMBS_DOWN", action: "Volume Down", conf: 0.95 },
      { key: "NONE", action: "Scanning", conf: 0.85 },
      { key: "POINT_LEFT", action: "Left Arrow", conf: 0.94 },
    ];

    let cycleIndex = 0;
    const interval = setInterval(() => {
      if (isGlobalPaused) return;

      const item = gestureCycle[cycleIndex];
      setCurrentGesture(item.key);

      if (item.key !== "NONE") {
        const now = new Date();
        const timeStr = now.toTimeString().split(" ")[0] + "." + String(now.getMilliseconds()).padStart(3, "0");
        setEvents((prev) => [
          {
            id: String(Date.now()),
            timestamp: timeStr,
            gesture: item.key,
            action: item.action,
            confidence: item.conf,
          },
          ...prev.slice(0, 24),
        ]);
      }

      cycleIndex = (cycleIndex + 1) % gestureCycle.length;
    }, 2800);

    return () => clearInterval(interval);
  }, [isGlobalPaused]);

  // Global pause toggle
  const handleToggleGlobalPause = () => {
    const nextState = !isGlobalPaused;
    setIsGlobalPaused(nextState);
    cameras.forEach((cam) => {
      if (cam.stream) {
        cam.stream.getVideoTracks().forEach((track) => {
          track.enabled = !nextState;
        });
      }
    });
  };

  // Maximize to Spotlight modal
  const handleMaximize = (camId: string) => {
    const cam = cameras.find((c) => c.id === camId) || null;
    setSpotlightCam(cam);
  };

  // Capture all snapshots
  const handleTakeAllSnapshots = () => {
    alert("Capturing high-resolution snapshots across all active camera streams.");
  };

  const heroCam = cameras.find((c) => c.id === selectedCamId) || cameras[0];
  const otherCams = cameras.filter((c) => c.id !== (heroCam?.id));

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--bg-primary)" }}>
      {/* Top Header */}
      <Header
        activeCount={cameras.filter((c) => c.status === "live").length}
        totalCount={cameras.length}
        viewMode={viewMode}
        setViewMode={setViewMode}
        onRefreshCams={initCameras}
        onToggleGlobalPause={handleToggleGlobalPause}
        isGlobalPaused={isGlobalPaused}
        onTakeAllSnapshots={handleTakeAllSnapshots}
        fps={engineFps}
      />

      {/* Main Content Area: Cameras + Telemetry Sidebar */}
      <main
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 340px",
          gap: "16px",
          padding: "0 16px 16px 16px",
          flex: 1,
        }}
      >
        {/* Left Section: Camera Feeds according to layout */}
        <section style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {viewMode === "grid" && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(440px, 1fr))",
                gap: "16px",
              }}
            >
              {cameras.map((cam) => (
                <CameraCard
                  key={cam.id}
                  cam={cam}
                  onMaximize={handleMaximize}
                  onTogglePause={() => {}}
                  currentGesture={currentGesture}
                />
              ))}
            </div>
          )}

          {viewMode === "stage" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Hero Spotlight Cam */}
              {heroCam && (
                <div style={{ width: "100%" }}>
                  <CameraCard
                    cam={heroCam}
                    onMaximize={handleMaximize}
                    onTogglePause={() => {}}
                    currentGesture={currentGesture}
                  />
                </div>
              )}

              {/* Thumbnails Rack */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: "16px",
                }}
              >
                {otherCams.map((cam) => (
                  <div
                    key={cam.id}
                    onClick={() => setSelectedCamId(cam.id)}
                    style={{ cursor: "pointer" }}
                  >
                    <CameraCard
                      cam={cam}
                      onMaximize={handleMaximize}
                      onTogglePause={() => {}}
                      currentGesture={currentGesture}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {viewMode === "focus" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {heroCam && (
                <div style={{ width: "100%" }}>
                  <CameraCard
                    cam={heroCam}
                    onMaximize={handleMaximize}
                    onTogglePause={() => {}}
                    currentGesture={currentGesture}
                  />
                </div>
              )}

              {/* Camera Selector Pills */}
              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  overflowX: "auto",
                  paddingBottom: "8px",
                }}
              >
                {cameras.map((cam) => (
                  <button
                    key={cam.id}
                    onClick={() => setSelectedCamId(cam.id)}
                    className={`btn ${cam.id === selectedCamId ? "primary" : ""}`}
                    style={{ whiteSpace: "nowrap" }}
                  >
                    {cam.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Right Section: Telemetry & Event Sidebar */}
        <TelemetrySidebar
          currentGesture={currentGesture}
          events={events}
          fps={engineFps}
        />
      </main>

      {/* Fullscreen Spotlight Modal */}
      <SpotlightModal
        cam={spotlightCam}
        onClose={() => setSpotlightCam(null)}
        currentGesture={currentGesture}
      />
    </div>
  );
}
