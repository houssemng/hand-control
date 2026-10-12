"use client";

import React, { useRef, useState } from "react";
import {
  Camera,
  Maximize2,
  FlipHorizontal,
  Sliders,
  Zap,
  Activity,
  User,
  Shield,
  Wifi,
} from "lucide-react";

export interface UserSession {
  id: string;
  name: string;
  role: string;
  isHost?: boolean;
  streamUrl: string;
  status: "live" | "paused" | "offline";
  fps: number;
  resolution: string;
  gesture: string;
  stateLabel: string;
  latencyMs?: number;
  lastAction?: string | null;
}

interface UserCameraCardProps {
  session: UserSession;
  onMaximize: (sessionId: string) => void;
}

export default function UserCameraCard({
  session,
  onMaximize,
}: UserCameraCardProps) {
  const imgRef = useRef<HTMLImageElement | null>(null);

  const [isMirrored, setIsMirrored] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [zoom, setZoom] = useState(1);

  const handleSnapshot = () => {
    if (!imgRef.current) return;
    const snapCanvas = document.createElement("canvas");
    snapCanvas.width = 1280;
    snapCanvas.height = 720;
    const ctx = snapCanvas.getContext("2d");
    if (!ctx) return;

    try {
      ctx.drawImage(imgRef.current, 0, 0, snapCanvas.width, snapCanvas.height);
      const dataUrl = snapCanvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `${session.name.toLowerCase().replace(/\s+/g, "-")}-snapshot-${Date.now()}.png`;
      link.click();
    } catch {
      window.open(session.streamUrl, "_blank");
    }
  };

  const getGesturePill = () => {
    switch (session.gesture) {
      case "THUMBS_UP":
        return { label: "👍 VOLUME UP", color: "var(--accent-cyan)", active: true };
      case "THUMBS_DOWN":
        return { label: "👎 VOLUME DOWN", color: "var(--accent-cyan)", active: true };
      case "POINT_RIGHT":
        return { label: "👉 NEXT SLIDE (RIGHT)", color: "var(--accent-amber)", active: true };
      case "POINT_LEFT":
        return { label: "👈 PREV SLIDE (LEFT)", color: "var(--accent-amber)", active: true };
      case "PINCH":
        return { label: "👌 SPACE BAR (PLAY/PAUSE)", color: "var(--accent-green)", active: true };
      default:
        return {
          label: session.stateLabel || "HAND TRACKED",
          color: "var(--accent-green)",
          active: false,
        };
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
        background: "rgba(13, 17, 26, 0.75)",
        border: "1px solid rgba(255, 255, 255, 0.09)",
        borderRadius: "16px",
        boxShadow: "0 10px 30px rgba(0, 0, 0, 0.4)",
        transition: "border-color 0.2s ease, transform 0.2s ease",
      }}
    >
      {/* Structural Card Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 18px",
          background: "rgba(18, 24, 38, 0.8)",
          borderBottom: "1px solid var(--border-subtle)",
        }}
      >
        {/* User Identity */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              background: session.isHost
                ? "linear-gradient(135deg, #00f0ff, #10e599)"
                : "linear-gradient(135deg, #a855f7, #6366f1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#080a0f",
              fontWeight: "700",
              fontSize: "13px",
              boxShadow: "0 0 12px rgba(0, 240, 255, 0.3)",
            }}
          >
            {session.name.slice(0, 2).toUpperCase()}
          </div>

          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "14px", fontWeight: "700", color: "#ffffff" }}>
                {session.name}
              </span>
              <span
                style={{
                  fontSize: "10px",
                  fontWeight: "600",
                  padding: "2px 7px",
                  borderRadius: "10px",
                  background: session.isHost
                    ? "rgba(0, 240, 255, 0.12)"
                    : "rgba(168, 85, 247, 0.15)",
                  color: session.isHost ? "var(--accent-cyan)" : "var(--accent-violet)",
                  border: `1px solid ${session.isHost ? "rgba(0, 240, 255, 0.25)" : "rgba(168, 85, 247, 0.3)"}`,
                }}
              >
                {session.role}
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "2px" }}>
              <span className="pulse-dot live" style={{ width: "6px", height: "6px" }} />
              <span style={{ fontSize: "11px", color: "var(--accent-green)", fontWeight: "500" }}>
                LIVE FEED
              </span>
              <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>&bull;</span>
              <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                {session.latencyMs || 14} ms latency
              </span>
            </div>
          </div>
        </div>

        {/* Telemetry Pills */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span
            style={{
              fontSize: "11px",
              color: "var(--text-secondary)",
              background: "rgba(255, 255, 255, 0.05)",
              padding: "4px 8px",
              borderRadius: "6px",
              border: "1px solid var(--border-subtle)",
            }}
          >
            {session.resolution}
          </span>
          <span
            style={{
              fontSize: "11px",
              fontWeight: "600",
              color: "var(--accent-green)",
              background: "rgba(16, 229, 153, 0.1)",
              padding: "4px 8px",
              borderRadius: "6px",
              border: "1px solid rgba(16, 229, 153, 0.25)",
            }}
          >
            {session.fps} FPS
          </span>
        </div>
      </div>

      {/* Video Viewport Container */}
      <div
        style={{
          position: "relative",
          width: "100%",
          aspectRatio: "16 / 9",
          background: "#04060a",
          overflow: "hidden",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={imgRef}
          src={session.streamUrl}
          alt={session.name}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            transform: `${isMirrored ? "scaleX(-1)" : "scaleX(1)"} scale(${zoom})`,
            filter: `brightness(${brightness}%) contrast(${contrast}%)`,
            transition: "transform 0.1s ease",
          }}
        />

        {/* Bottom Left Gesture Pill */}
        <div
          style={{
            position: "absolute",
            bottom: "14px",
            left: "14px",
            display: "flex",
            alignItems: "center",
            gap: "7px",
            background: "rgba(8, 11, 18, 0.88)",
            padding: "6px 12px",
            borderRadius: "20px",
            border: `1px solid ${pill.color}`,
            boxShadow: pill.active ? `0 0 16px ${pill.color}` : "none",
            backdropFilter: "blur(10px)",
            transition: "all 0.2s ease",
            zIndex: 2,
          }}
        >
          <Zap size={14} color={pill.color} />
          <span style={{ fontSize: "12px", fontWeight: "700", color: pill.color }}>
            {pill.label}
          </span>
        </div>

        {/* Top Right Quick Toolbar */}
        <div
          style={{
            position: "absolute",
            top: "12px",
            right: "12px",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            background: "rgba(8, 11, 18, 0.75)",
            padding: "5px",
            borderRadius: "10px",
            backdropFilter: "blur(10px)",
            border: "1px solid var(--border-subtle)",
            zIndex: 2,
          }}
        >
          <button
            onClick={handleSnapshot}
            className="btn"
            style={{ padding: "5px", border: "none", background: "transparent" }}
            title="Save Snapshot PNG"
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
            <FlipHorizontal
              size={15}
              color={isMirrored ? "var(--accent-cyan)" : "var(--text-muted)"}
            />
          </button>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn"
            style={{
              padding: "5px",
              border: "none",
              background: showFilters ? "rgba(255, 170, 0, 0.15)" : "transparent",
            }}
            title="Adjust Camera Brightness / Zoom"
          >
            <Sliders
              size={15}
              color={showFilters ? "var(--accent-amber)" : "var(--text-muted)"}
            />
          </button>

          <button
            onClick={() => onMaximize(session.id)}
            className="btn"
            style={{ padding: "5px", border: "none", background: "transparent" }}
            title="Fullscreen Spotlight View"
          >
            <Maximize2 size={15} color="#ffffff" />
          </button>
        </div>

        {/* Adjustment Sliders Drawer */}
        {showFilters && (
          <div
            style={{
              position: "absolute",
              bottom: "55px",
              right: "14px",
              background: "rgba(10, 14, 24, 0.96)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "12px",
              padding: "14px",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              width: "210px",
              backdropFilter: "blur(16px)",
              zIndex: 10,
              boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px" }}>
              <span style={{ color: "var(--text-secondary)" }}>Brightness</span>
              <span style={{ color: "#ffffff" }}>{brightness}%</span>
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
              <span style={{ color: "var(--text-secondary)" }}>Contrast</span>
              <span style={{ color: "#ffffff" }}>{contrast}%</span>
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
              <span style={{ color: "var(--text-secondary)" }}>Digital Zoom</span>
              <span style={{ color: "#ffffff" }}>{zoom.toFixed(1)}x</span>
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
  );
}
