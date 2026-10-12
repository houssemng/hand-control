"use client";

import React, { useRef, useEffect, useState } from "react";
import {
  X,
  Camera,
  FlipHorizontal,
  Eye,
  EyeOff,
  Maximize2,
  Minimize2,
  Sliders,
  Zap,
} from "lucide-react";
import { CameraFeed } from "./CameraCard";

interface SpotlightModalProps {
  cam: CameraFeed | null;
  onClose: () => void;
  currentGesture: string;
}

export default function SpotlightModal({
  cam,
  onClose,
  currentGesture,
}: SpotlightModalProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isMirrored, setIsMirrored] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);

  useEffect(() => {
    if (!cam || !videoRef.current) return;
    if (cam.stream) {
      videoRef.current.srcObject = cam.stream;
      videoRef.current.play().catch(() => {});
    }
  }, [cam]);

  if (!cam) return null;

  const handleSnapshot = () => {
    const video = videoRef.current;
    if (!video) return;

    const snapCanvas = document.createElement("canvas");
    snapCanvas.width = video.videoWidth || 1920;
    snapCanvas.height = video.videoHeight || 1080;
    const ctx = snapCanvas.getContext("2d");
    if (!ctx) return;

    if (isMirrored) {
      ctx.translate(snapCanvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, snapCanvas.width, snapCanvas.height);

    const dataUrl = snapCanvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `spotlight-${cam.id}-${Date.now()}.png`;
    link.click();
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(5, 7, 12, 0.92)",
        backdropFilter: "blur(20px)",
        zIndex: 1000,
        display: "flex",
        flexDirection: "column",
        padding: "24px",
      }}
    >
      {/* Spotlight Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "16px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span className="pulse-dot live" />
          <h2 style={{ fontSize: "18px", fontWeight: "700", color: "#ffffff" }}>
            SPOTLIGHT INSPECTOR: {cam.name}
          </h2>
          <span
            style={{
              fontSize: "12px",
              background: "rgba(0, 240, 255, 0.15)",
              color: "var(--accent-cyan)",
              padding: "3px 10px",
              borderRadius: "12px",
            }}
          >
            ACTIVE GESTURE: {currentGesture}
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button onClick={handleSnapshot} className="btn primary">
            <Camera size={16} />
            High-Res Snapshot
          </button>
          <button onClick={() => setIsMirrored(!isMirrored)} className="btn">
            <FlipHorizontal size={16} />
            {isMirrored ? "Mirrored" : "Normal"}
          </button>
          <button onClick={onClose} className="btn danger">
            <X size={16} />
            Close
          </button>
        </div>
      </div>

      {/* Main Large Viewport */}
      <div
        style={{
          flex: 1,
          position: "relative",
          borderRadius: "var(--radius-lg)",
          overflow: "hidden",
          background: "#000000",
          border: "1px solid var(--border-subtle)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            transform: `${isMirrored ? "scaleX(-1)" : "scaleX(1)"} scale(${zoom})`,
            filter: `brightness(${brightness}%) contrast(${contrast}%)`,
          }}
        />

        {/* Floating Controls Bar at Bottom */}
        <div
          style={{
            position: "absolute",
            bottom: "24px",
            display: "flex",
            alignItems: "center",
            gap: "18px",
            background: "rgba(13, 17, 26, 0.85)",
            backdropFilter: "blur(14px)",
            padding: "10px 20px",
            borderRadius: "var(--radius-xl)",
            border: "1px solid var(--border-subtle)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px" }}>
            <span>Zoom</span>
            <input
              type="range"
              min="1"
              max="3"
              step="0.1"
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              style={{ width: "90px", accentColor: "var(--accent-cyan)" }}
            />
            <span>{zoom.toFixed(1)}x</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px" }}>
            <span>Brightness</span>
            <input
              type="range"
              min="50"
              max="180"
              value={brightness}
              onChange={(e) => setBrightness(Number(e.target.value))}
              style={{ width: "90px", accentColor: "var(--accent-cyan)" }}
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px" }}>
            <span>Contrast</span>
            <input
              type="range"
              min="50"
              max="180"
              value={contrast}
              onChange={(e) => setContrast(Number(e.target.value))}
              style={{ width: "90px", accentColor: "var(--accent-cyan)" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
