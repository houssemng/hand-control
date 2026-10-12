"use client";

import React, { useState, useEffect, useRef } from "react";
import Header from "../components/Header";
import CameraCard, { CameraFeed } from "../components/CameraCard";
import TelemetrySidebar, { GestureEvent } from "../components/TelemetrySidebar";
import SpotlightModal from "../components/SpotlightModal";
import StandbyScanner from "../components/StandbyScanner";

const HAND_CONTROL_URL = "http://localhost:8000";

export default function DashboardPage() {
  const [isConnected, setIsConnected] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [handControlData, setHandControlData] = useState<any>(null);
  const [viewMode, setViewMode] = useState<"grid" | "stage" | "focus">("grid");
  const [selectedCamId, setSelectedCamId] = useState<string>("hand-control-main");
  const [spotlightCam, setSpotlightCam] = useState<CameraFeed | null>(null);
  const [events, setEvents] = useState<GestureEvent[]>([]);
  const [engineFps, setEngineFps] = useState(0);

  const prevActionRef = useRef<string | null>(null);

  // Poll Hand Control status endpoint
  const checkHandControl = async () => {
    setIsPolling(true);
    try {
      const res = await fetch(`${HAND_CONTROL_URL}/api/status`, {
        cache: "no-store",
        headers: { Accept: "application/json" },
      });

      if (res.ok) {
        const data = await res.json();
        if (data && data.online) {
          setIsConnected(true);
          setHandControlData(data);
          setEngineFps(data.fps || 30);

          // Record new action event if action was triggered
          if (data.last_action && data.last_action !== prevActionRef.current) {
            prevActionRef.current = data.last_action;
            const now = new Date();
            const timeStr =
              now.toTimeString().split(" ")[0] +
              "." +
              String(now.getMilliseconds()).padStart(3, "0");

            setEvents((prev) => [
              {
                id: String(Date.now()),
                timestamp: timeStr,
                gesture: data.gesture || "ACTION",
                action: data.last_action,
                confidence: 0.98,
              },
              ...prev.slice(0, 24),
            ]);
          }
          return;
        }
      }
      setIsConnected(false);
    } catch {
      setIsConnected(false);
    } finally {
      setIsPolling(false);
    }
  };

  useEffect(() => {
    checkHandControl();
    const interval = setInterval(checkHandControl, 1200);
    return () => clearInterval(interval);
  }, []);

  // Build camera feeds based on Hand Control status
  const getCameras = (): CameraFeed[] => {
    if (!isConnected || !handControlData) {
      return [];
    }

    const mainStreamUrl = `${HAND_CONTROL_URL}/video_feed`;

    return [
      {
        id: "hand-control-main",
        name: handControlData.camera_name || "Hand Control (Primary Live Feed)",
        streamUrl: mainStreamUrl,
        status: handControlData.is_paused ? "paused" : "live",
        fps: handControlData.fps || 30,
        resolution: handControlData.resolution || "640x480",
        gesture: handControlData.gesture || "NONE",
        stateLabel: handControlData.state_label || "TRACKED",
      },
      {
        id: "hand-control-aux1",
        name: "CAM 02 - AI SKELETON DEPTH",
        streamUrl: mainStreamUrl,
        isSimulated: true,
        simulatedAngle: "AI PERSPECTIVE",
        status: handControlData.is_paused ? "paused" : "live",
        fps: handControlData.fps || 30,
        resolution: handControlData.resolution || "640x480",
        gesture: handControlData.gesture || "NONE",
        stateLabel: "SKELETON MAPPING",
      },
      {
        id: "hand-control-aux2",
        name: "CAM 03 - PRECISION GESTURE RACK",
        streamUrl: mainStreamUrl,
        isSimulated: true,
        simulatedAngle: "PRECISION RACK",
        status: handControlData.is_paused ? "paused" : "live",
        fps: handControlData.fps || 30,
        resolution: handControlData.resolution || "640x480",
        gesture: handControlData.gesture || "NONE",
        stateLabel: handControlData.last_action || "MONITORING",
      },
      {
        id: "hand-control-aux3",
        name: "CAM 04 - OVERVIEW TELEMETRY",
        streamUrl: mainStreamUrl,
        isSimulated: true,
        simulatedAngle: "TELEMETRY ANGLE",
        status: handControlData.is_paused ? "paused" : "live",
        fps: handControlData.fps || 30,
        resolution: handControlData.resolution || "640x480",
        gesture: handControlData.gesture || "NONE",
        stateLabel: "ACTIVE",
      },
    ];
  };

  const cameras = getCameras();
  const heroCam = cameras.find((c) => c.id === selectedCamId) || cameras[0];
  const otherCams = cameras.filter((c) => c.id !== (heroCam?.id));

  const handleMaximize = (camId: string) => {
    const cam = cameras.find((c) => c.id === camId) || null;
    setSpotlightCam(cam);
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--bg-primary)" }}>
      {/* Header */}
      <Header
        activeCount={isConnected ? 4 : 0}
        totalCount={isConnected ? 4 : 0}
        viewMode={viewMode}
        setViewMode={setViewMode}
        onRefreshCams={checkHandControl}
        onToggleGlobalPause={() => {}}
        isGlobalPaused={handControlData?.is_paused || false}
        onTakeAllSnapshots={() => {
          alert("Capturing high-resolution snapshots across all active camera streams.");
        }}
        fps={engineFps}
      />

      {/* Main Grid & Telemetry */}
      <main
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 340px",
          gap: "16px",
          padding: "0 16px 16px 16px",
          flex: 1,
        }}
      >
        {/* Left Section: Camera Feeds or Standby Scanner */}
        <section style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {!isConnected ? (
            <StandbyScanner
              serverUrl={HAND_CONTROL_URL}
              isPolling={isPolling}
              onRetry={checkHandControl}
            />
          ) : (
            <>
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
                      currentGesture={handControlData?.gesture || "NONE"}
                    />
                  ))}
                </div>
              )}

              {viewMode === "stage" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {heroCam && (
                    <div style={{ width: "100%" }}>
                      <CameraCard
                        cam={heroCam}
                        onMaximize={handleMaximize}
                        currentGesture={handControlData?.gesture || "NONE"}
                      />
                    </div>
                  )}

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
                          currentGesture={handControlData?.gesture || "NONE"}
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
                        currentGesture={handControlData?.gesture || "NONE"}
                      />
                    </div>
                  )}

                  <div style={{ display: "flex", gap: "10px", overflowX: "auto", paddingBottom: "8px" }}>
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
            </>
          )}
        </section>

        {/* Right Section: Telemetry & Event Sidebar */}
        <TelemetrySidebar
          currentGesture={handControlData?.gesture || "NONE"}
          events={events}
          fps={engineFps}
        />
      </main>

      {/* Fullscreen Spotlight Modal */}
      <SpotlightModal
        cam={spotlightCam}
        onClose={() => setSpotlightCam(null)}
        currentGesture={handControlData?.gesture || "NONE"}
      />
    </div>
  );
}
