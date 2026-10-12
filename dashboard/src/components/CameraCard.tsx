"use client";

import React, { useRef, useEffect, useState } from "react";
import {
  Camera,
  Maximize2,
  RefreshCw,
  Sliders,
  Eye,
  EyeOff,
  FlipHorizontal,
  Pause,
  Play,
  Volume2,
  VolumeX,
  Zap,
} from "lucide-react";

export interface CameraFeed {
  id: string;
  name: string;
  deviceId?: string;
  stream?: MediaStream | null;
  isSimulated?: boolean;
  simulatedAngle?: string;
  status: "live" | "connecting" | "paused" | "error";
  errorMsg?: string;
}

interface CameraCardProps {
  cam: CameraFeed;
  onMaximize: (camId: string) => void;
  onTogglePause: (camId: string) => void;
  onSnapshotReady?: (dataUrl: string) => void;
  currentGesture?: string;
  gestureConfidence?: number;
}

export default function CameraCard({
  cam,
  onMaximize,
  onTogglePause,
  onSnapshotReady,
  currentGesture = "NONE",
  gestureConfidence = 0.94,
}: CameraCardProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [isMirrored, setIsMirrored] = useState(true);
  const [showSkeleton, setShowSkeleton] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [fps, setFps] = useState(30);
  const [resolution, setResolution] = useState("1280x720");

  // Filter adjustments
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [zoom, setZoom] = useState(1);

  // Attach stream to video element
  useEffect(() => {
    if (!videoRef.current) return;
    if (cam.stream) {
      videoRef.current.srcObject = cam.stream;
      videoRef.current.play().catch(() => {});
    }
  }, [cam.stream]);

  // Video metadata listener for resolution
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      if (video.videoWidth && video.videoHeight) {
        setResolution(`${video.videoWidth}x${video.videoHeight}`);
      }
    };

    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    return () => video.removeEventListener("loadedmetadata", handleLoadedMetadata);
  }, []);

  // Canvas drawing loop for cyber hand skeleton overlay & telemetry
  useEffect(() => {
    let animId: number;
    let frameCount = 0;
    let lastTime = performance.now();

    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const render = () => {
      // Calculate real FPS
      frameCount++;
      const now = performance.now();
      if (now - lastTime >= 1000) {
        setFps(Math.round((frameCount * 1000) / (now - lastTime)));
        frameCount = 0;
        lastTime = now;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (showSkeleton && cam.status === "live") {
        const cw = canvas.width;
        const ch = canvas.height;

        // Draw HUD targeting reticle & crosshairs
        ctx.strokeStyle = "rgba(0, 240, 255, 0.25)";
        ctx.lineWidth = 1;
        ctx.strokeRect(cw * 0.15, ch * 0.15, cw * 0.7, ch * 0.7);

        // Corner brackets
        const bLen = 20;
        ctx.strokeStyle = "rgba(0, 240, 255, 0.8)";
        ctx.lineWidth = 2;

        // Top Left
        ctx.beginPath();
        ctx.moveTo(cw * 0.15, ch * 0.15 + bLen);
        ctx.lineTo(cw * 0.15, ch * 0.15);
        ctx.lineTo(cw * 0.15 + bLen, ch * 0.15);
        ctx.stroke();

        // Top Right
        ctx.beginPath();
        ctx.moveTo(cw * 0.85 - bLen, ch * 0.15);
        ctx.lineTo(cw * 0.85, ch * 0.15);
        ctx.lineTo(cw * 0.85, ch * 0.15 + bLen);
        ctx.stroke();

        // Bottom Left
        ctx.beginPath();
        ctx.moveTo(cw * 0.15, ch * 0.85 - bLen);
        ctx.lineTo(cw * 0.15, ch * 0.85);
        ctx.lineTo(cw * 0.15 + bLen, ch * 0.85);
        ctx.stroke();

        // Bottom Right
        ctx.beginPath();
        ctx.moveTo(cw * 0.85 - bLen, ch * 0.85);
        ctx.lineTo(cw * 0.85, ch * 0.85);
        ctx.lineTo(cw * 0.85, ch * 0.85 - bLen);
        ctx.stroke();

        // Dynamic Hand Skeleton Demonstration / Landmark Simulation
        const timeOffset = Date.now() / 1000;
        const hx = cw * (0.5 + 0.05 * Math.sin(timeOffset));
        const hy = ch * (0.55 + 0.03 * Math.cos(timeOffset * 1.2));
        const scale = ch * 0.32;

        // Draw Palm Joints
        const joints = [
          { x: hx, y: hy + scale * 0.4 }, // 0 Wrist
          { x: hx - scale * 0.25, y: hy + scale * 0.2 }, // 1
          { x: hx - scale * 0.35, y: hy }, // 2
          { x: hx - scale * 0.4, y: hy - scale * 0.18 }, // 3
          { x: hx - scale * 0.45, y: hy - scale * 0.35 }, // 4 Thumb Tip
          { x: hx - scale * 0.15, y: hy - scale * 0.15 }, // 5 Index MCP
          { x: hx - scale * 0.15, y: hy - scale * 0.35 }, // 6
          { x: hx - scale * 0.15, y: hy - scale * 0.5 }, // 7
          { x: hx - scale * 0.15, y: hy - scale * 0.65 }, // 8 Index Tip
          { x: hx, y: hy - scale * 0.18 }, // 9 Middle MCP
          { x: hx, y: hy - scale * 0.38 }, // 10
          { x: hx, y: hy - scale * 0.55 }, // 11
          { x: hx, y: hy - scale * 0.7 }, // 12 Middle Tip
          { x: hx + scale * 0.15, y: hy - scale * 0.15 }, // 13 Ring MCP
          { x: hx + scale * 0.15, y: hy - scale * 0.34 }, // 14
          { x: hx + scale * 0.15, y: hy - scale * 0.48 }, // 15
          { x: hx + scale * 0.15, y: hy - scale * 0.62 }, // 16 Ring Tip
          { x: hx + scale * 0.28, y: hy - scale * 0.1 }, // 17 Pinky MCP
          { x: hx + scale * 0.3, y: hy - scale * 0.26 }, // 18
          { x: hx + scale * 0.3, y: hy - scale * 0.38 }, // 19
          { x: hx + scale * 0.3, y: hy - scale * 0.5 }, // 20 Pinky Tip
        ];

        // Draw connections
        const bones = [
          [0, 1], [1, 2], [2, 3], [3, 4],
          [0, 5], [5, 6], [6, 7], [7, 8],
          [0, 9], [9, 10], [10, 11], [11, 12],
          [0, 13], [13, 14], [14, 15], [15, 16],
          [0, 17], [17, 18], [18, 19], [19, 20],
          [5, 9], [9, 13], [13, 17],
        ];

        ctx.strokeStyle = "rgba(0, 240, 255, 0.75)";
        ctx.lineWidth = 2.5;
        bones.forEach(([s, e]) => {
          ctx.beginPath();
          ctx.moveTo(joints[s].x, joints[s].y);
          ctx.lineTo(joints[e].x, joints[e].y);
          ctx.stroke();
        });

        // Draw glowing nodes
        joints.forEach((pt, i) => {
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, i % 4 === 0 ? 5 : 3.5, 0, Math.PI * 2);
          ctx.fillStyle = i % 4 === 0 ? "#10e599" : "#00f0ff";
          ctx.fill();
          ctx.strokeStyle = "#ffffff";
          ctx.lineWidth = 1;
          ctx.stroke();
        });
      }

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [showSkeleton, cam.status]);

  // Take Snapshot function
  const handleTakeSnapshot = () => {
    const video = videoRef.current;
    if (!video) return;

    const snapCanvas = document.createElement("canvas");
    snapCanvas.width = video.videoWidth || 1280;
    snapCanvas.height = video.videoHeight || 720;
    const ctx = snapCanvas.getContext("2d");
    if (!ctx) return;

    // Apply mirror if enabled
    if (isMirrored) {
      ctx.translate(snapCanvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, snapCanvas.width, snapCanvas.height);

    const dataUrl = snapCanvas.toDataURL("image/png");

    // Download trigger
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `handcontrol-${cam.id}-${Date.now()}.png`;
    link.click();

    if (onSnapshotReady) onSnapshotReady(dataUrl);
  };

  const getGesturePill = () => {
    switch (currentGesture) {
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
        return { label: "✋ HAND TRACKED", color: "var(--accent-green)", active: false };
    }
  };

  const pill = getGesturePill();

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
          <span className={`pulse-dot ${cam.status === "live" ? "live" : "online"}`} />
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
              {cam.simulatedAngle || "AI FEED"}
            </span>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>{resolution}</span>
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
            {fps} FPS
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
          {/* HTML5 Video Element */}
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
              filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`,
              transition: "transform 0.1s ease",
            }}
          />

          {/* Canvas Overlay for Skeleton HUD */}
          <canvas
            ref={canvasRef}
            width={640}
            height={360}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              pointerEvents: "none",
            }}
          />

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

          {/* Quick Floating Toolbar (Top Right) */}
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
              title="Flip / Mirror Horizontal"
            >
              <FlipHorizontal size={15} color={isMirrored ? "var(--accent-cyan)" : "var(--text-muted)"} />
            </button>

            <button
              onClick={() => setShowSkeleton(!showSkeleton)}
              className="btn"
              style={{
                padding: "5px",
                border: "none",
                background: showSkeleton ? "rgba(16, 229, 153, 0.15)" : "transparent",
              }}
              title="Toggle AI Skeleton"
            >
              {showSkeleton ? <Eye size={15} color="var(--accent-green)" /> : <EyeOff size={15} color="var(--text-muted)" />}
            </button>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="btn"
              style={{
                padding: "5px",
                border: "none",
                background: showFilters ? "rgba(255, 170, 0, 0.15)" : "transparent",
              }}
              title="Camera Video Adjustments"
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

          {/* Video Adjustments Slider Drawer */}
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
                <span>Digital Zoom</span>
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
