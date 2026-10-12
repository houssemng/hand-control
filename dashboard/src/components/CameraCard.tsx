"use client";

import React, { useRef, useEffect, useState } from "react";
import {
  Camera,
  Maximize2,
  FlipHorizontal,
  Sliders,
  Zap,
  Activity,
  Layers,
} from "lucide-react";

export interface CameraFeed {
  id: string;
  name: string;
  deviceId?: string;
  stream?: MediaStream | null;
  streamUrl?: string; // MJPEG stream URL from Hand Control
  isSimulated?: boolean;
  simulatedAngle?: string;
  status: "live" | "connecting" | "paused" | "error";
  fps?: number;
  resolution?: string;
  gesture?: string;
  stateLabel?: string;
  errorMsg?: string;
}

interface CameraCardProps {
  cam: CameraFeed;
  onMaximize: (camId: string) => void;
  onTogglePause?: (camId: string) => void;
  onSnapshotReady?: (dataUrl: string) => void;
  currentGesture?: string;
}

export default function CameraCard({
  cam,
  onMaximize,
  currentGesture = "NONE",
}: CameraCardProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const [isMirrored, setIsMirrored] = useState(false); // Python feed is already mirrored
  const [showFilters, setShowFilters] = useState(false);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [zoom, setZoom] = useState(1);

  // Attach MediaStream if available
  useEffect(() => {
    if (!videoRef.current || !cam.stream) return;
    videoRef.current.srcObject = cam.stream;
    videoRef.current.play().catch(() => {});
  }, [cam.stream]);

  // Snapshot handler
  const handleTakeSnapshot = () => {
    const snapCanvas = document.createElement("canvas");
    snapCanvas.width = 1280;
    snapCanvas.height = 720;
    const ctx = snapCanvas.getContext("2d");
    if (!ctx) return;

    if (cam.streamUrl && imgRef.current) {
      try {
        ctx.drawImage(imgRef.current, 0, 0, snapCanvas.width, snapCanvas.height);
      } catch {
        // Cross-origin fallback
        window.open(cam.streamUrl, "_blank");
        return;
      }
    } else if (videoRef.current) {
      ctx.drawImage(videoRef.current, 0, 0, snapCanvas.width, snapCanvas.height);
    }

    const dataUrl = snapCanvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `handcontrol-${cam.id}-${Date.now()}.png`;
    link.click();
  };

  const getPill = () => {
    const g = cam.gesture || currentGesture;
    switch (g) {
      case "THUMBS_UP":
        return { label: "👍 VOLUME UP", color: "var(--accent-cyan)", active: true };
      case "THUMBS_DOWN":
        return { label: "👎 VOLUME DOWN", color: "var(--accent-cyan)", active: true };
      case "POINT_RIGHT":
        return { label: "👉 NEXT (RIGHT)", color: "var(--accent-amber)", active: true };
      case "POINT_LEFT":
        return { label: "👈 PREV (LEFT)", color: "var(--accent-amber)", active: true };
      case "PINCH":
        return { label: "👌 SPACE BAR", color: "var(--accent-green)", active: true };
      default:
        return { label: cam.stateLabel || "HAND TRACKED", color: "var(--accent-green)", active: false };
    }
  };

  const pill = getPill();

  return (
    <div
      className="glass-panel"
      style={{
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        position: "relative",
        background: "var(--bg-card)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
      }}
    >
      {/* Top Card Info Bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 14px",
          background: "rgba(10, 14, 22, 0.8)",
          borderBottom: "1px solid var(--border-subtle)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span className="pulse-dot live" />
          <span style={{ fontSize: "13px", fontWeight: "600", color: "#ffffff" }}>
            {cam.name}
          </span>
          {cam.isSimulated && (
            <span
              style={{
                fontSize: "10px",
                background: "rgba(168, 85, 247, 0.18)",
                color: "var(--accent-violet)",
                padding: "2px 6px",
                borderRadius: "4px",
                border: "1px solid rgba(168, 85, 247, 0.3)",
              }}
            >
              {cam.simulatedAngle || "AI STREAM"}
            </span>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
            {cam.resolution || "640x480"}
          </span>
          <span
            style={{
              fontSize: "11px",
              fontWeight: "600",
              color: "var(--accent-green)",
              background: "rgba(16, 229, 153, 0.12)",
              padding: "2px 6px",
              borderRadius: "4px",
            }}
          >
            {cam.fps || 30} FPS
          </span>
        </div>
      </div>

      {/* Main Video Viewport */}
      <div
        style={{
          position: "relative",
          width: "100%",
          paddingTop: "56.25%", // 16:9 ratio
          background: "#05070a",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* If MJPEG Stream URL from Hand Control is available */}
          {cam.streamUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              ref={imgRef}
              src={cam.streamUrl}
              alt={cam.name}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                transform: `${isMirrored ? "scaleX(-1)" : "scaleX(1)"} scale(${zoom})`,
                filter: `brightness(${brightness}%) contrast(${contrast}%)`,
                transition: "transform 0.1s ease",
              }}
            />
          ) : (
            /* Direct WebRTC Video Element */
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                transform: `${isMirrored ? "scaleX(-1)" : "scaleX(1)"} scale(${zoom})`,
                filter: `brightness(${brightness}%) contrast(${contrast}%)`,
              }}
            />
          )}

          {/* Bottom Left Live Gesture Pill */}
          <div
            style={{
              position: "absolute",
              bottom: "12px",
              left: "12px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              background: "rgba(10, 14, 22, 0.85)",
              padding: "5px 10px",
              borderRadius: "20px",
              border: `1px solid ${pill.color}`,
              boxShadow: pill.active ? `0 0 15px ${pill.color}` : "none",
              backdropFilter: "blur(8px)",
              transition: "all 0.2s ease",
            }}
          >
            <Zap size={13} color={pill.color} />
            <span style={{ fontSize: "11px", fontWeight: "700", color: pill.color }}>
              {pill.label}
            </span>
          </div>

          {/* Top Right Quick Controls */}
          <div
            style={{
              position: "absolute",
              top: "12px",
              right: "12px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              background: "rgba(10, 14, 22, 0.75)",
              padding: "4px",
              borderRadius: "var(--radius-md)",
              backdropFilter: "blur(8px)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <button
              onClick={handleTakeSnapshot}
              className="btn"
              style={{ padding: "5px", border: "none", background: "transparent" }}
              title="Snapshot to PNG"
            >
              <Camera size={15} color="var(--accent-cyan)" />
            </button>

            <button
              onClick={() => setIsMirrored(!isMirrored)}
              className="btn"
              style={{
                padding: "5px",
                border: "none",
                background: isMirrored ? "rgba(0, 240, 255, 0.15)" : "transparent",
              }}
              title="Flip Horizontal"
            >
              <FlipHorizontal size={15} color={isMirrored ? "var(--accent-cyan)" : "var(--text-muted)"} />
            </button>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="btn"
              style={{
                padding: "5px",
                border: "none",
                background: showFilters ? "rgba(255, 170, 0, 0.15)" : "transparent",
              }}
              title="Video Adjustments"
            >
              <Sliders size={15} color={showFilters ? "var(--accent-amber)" : "var(--text-muted)"} />
            </button>

            <button
              onClick={() => onMaximize(cam.id)}
              className="btn"
              style={{ padding: "5px", border: "none", background: "transparent" }}
              title="Maximize Spotlight"
            >
              <Maximize2 size={15} color="#ffffff" />
            </button>
          </div>

          {/* Adjustments Drawer */}
          {showFilters && (
            <div
              style={{
                position: "absolute",
                bottom: "48px",
                right: "12px",
                background: "rgba(13, 17, 26, 0.95)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-md)",
                padding: "12px",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                width: "200px",
                backdropFilter: "blur(12px)",
                zIndex: 10,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px" }}>
                <span>Brightness</span>
                <span>{brightness}%</span>
              </div>
              <input
                type="range"
                min="50"
                max="180"
                value={brightness}
                onChange={(e) => setBrightness(Number(e.target.value))}
                style={{ width: "100%", accentColor: "var(--accent-cyan)" }}
              />

              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px" }}>
                <span>Contrast</span>
                <span>{contrast}%</span>
              </div>
              <input
                type="range"
                min="50"
                max="180"
                value={contrast}
                onChange={(e) => setContrast(Number(e.target.value))}
                style={{ width: "100%", accentColor: "var(--accent-cyan)" }}
              />

              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px" }}>
                <span>Zoom</span>
                <span>{zoom.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min="1"
                max="2.5"
                step="0.1"
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                style={{ width: "100%", accentColor: "var(--accent-cyan)" }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
