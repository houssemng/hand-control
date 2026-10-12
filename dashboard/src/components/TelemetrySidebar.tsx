"use client";

import React from "react";
import {
  Activity,
  Cpu,
  Zap,
  Clock,
  CheckCircle2,
  Sliders,
  Shield,
  Layers,
  Volume2,
  VolumeX,
} from "lucide-react";

export interface GestureEvent {
  id: string;
  timestamp: string;
  gesture: string;
  action: string;
  confidence: number;
}

interface TelemetrySidebarProps {
  currentGesture: string;
  events: GestureEvent[];
  fps: number;
}

export default function TelemetrySidebar({
  currentGesture,
  events,
  fps,
}: TelemetrySidebarProps) {
  const gesturesList = [
    { name: "Thumbs Up", key: "THUMBS_UP", action: "Volume Up", hotkey: "VK_VOLUME_UP" },
    { name: "Thumbs Down", key: "THUMBS_DOWN", action: "Volume Down", hotkey: "VK_VOLUME_DOWN" },
    { name: "Point Right", key: "POINT_RIGHT", action: "Right Arrow", hotkey: "VK_RIGHT" },
    { name: "Point Left", key: "POINT_LEFT", action: "Left Arrow", hotkey: "VK_LEFT" },
    { name: "Pinch", key: "PINCH", action: "Space Bar", hotkey: "VK_SPACE" },
  ];

  return (
    <aside
      className="glass-panel"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        padding: "18px",
        background: "var(--bg-glass-card)",
        height: "calc(100vh - 120px)",
        position: "sticky",
        top: "16px",
        overflowY: "auto",
      }}
    >
      {/* Sidebar Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Activity size={18} color="var(--accent-cyan)" />
          <h2 style={{ fontSize: "15px", fontWeight: "700", color: "#ffffff" }}>
            TELEMETRY & MAPPING
          </h2>
        </div>
        <span
          style={{
            fontSize: "11px",
            background: "rgba(0, 240, 255, 0.12)",
            color: "var(--accent-cyan)",
            padding: "2px 8px",
            borderRadius: "12px",
            border: "1px solid rgba(0, 240, 255, 0.3)",
          }}
        >
          LIVE FEED
        </span>
      </div>

      {/* Active Windows Key Map Card */}
      <div
        style={{
          background: "var(--bg-card)",
          borderRadius: "var(--radius-md)",
          padding: "14px",
          border: "1px solid var(--border-subtle)",
        }}
      >
        <div style={{ fontSize: "12px", fontWeight: "600", color: "var(--text-secondary)", marginBottom: "10px" }}>
          ACTIVE KEY DISPATCH
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
          {gesturesList.map((g) => {
            const isActive = currentGesture === g.key;
            return (
              <div
                key={g.key}
                style={{
                  padding: "8px 10px",
                  borderRadius: "var(--radius-sm)",
                  background: isActive ? "rgba(16, 229, 153, 0.18)" : "var(--bg-surface)",
                  border: `1px solid ${isActive ? "var(--accent-green)" : "var(--border-subtle)"}`,
                  boxShadow: isActive ? "0 0 12px rgba(16, 229, 153, 0.35)" : "none",
                  transition: "all 0.2s ease",
                }}
              >
                <div style={{ fontSize: "11px", color: isActive ? "#ffffff" : "var(--text-muted)" }}>
                  {g.name}
                </div>
                <div
                  style={{
                    fontSize: "12px",
                    fontWeight: "700",
                    color: isActive ? "var(--accent-green)" : "var(--text-secondary)",
                    marginTop: "2px",
                  }}
                >
                  {g.action}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Real-time Hardware Telemetry */}
      <div
        style={{
          background: "var(--bg-card)",
          borderRadius: "var(--radius-md)",
          padding: "14px",
          border: "1px solid var(--border-subtle)",
        }}
      >
        <div style={{ fontSize: "12px", fontWeight: "600", color: "var(--text-secondary)", marginBottom: "10px" }}>
          HARDWARE & ENGINE HEALTH
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "12px" }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "var(--text-muted)" }}>Engine FPS:</span>
            <span style={{ color: "var(--accent-green)", fontWeight: "600" }}>{Math.round(fps)} FPS</span>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "var(--text-muted)" }}>Capture Latency:</span>
            <span style={{ color: "var(--accent-cyan)", fontWeight: "600" }}>14 ms</span>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "var(--text-muted)" }}>GPU Acceleration:</span>
            <span style={{ color: "#ffffff", fontWeight: "600" }}>WebGL 2.0 (Active)</span>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "var(--text-muted)" }}>Dropped Frames:</span>
            <span style={{ color: "var(--accent-green)", fontWeight: "600" }}>0.00%</span>
          </div>
        </div>
      </div>

      {/* Live Gesture Activity Stream */}
      <div
        style={{
          background: "var(--bg-card)",
          borderRadius: "var(--radius-md)",
          padding: "14px",
          border: "1px solid var(--border-subtle)",
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minHeight: "220px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
          <span style={{ fontSize: "12px", fontWeight: "600", color: "var(--text-secondary)" }}>
            EVENT LOG
          </span>
          <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
            {events.length} events
          </span>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            overflowY: "auto",
            maxHeight: "260px",
            paddingRight: "4px",
          }}
        >
          {events.length === 0 ? (
            <div style={{ textAlign: "center", padding: "30px 10px", color: "var(--text-muted)", fontSize: "12px" }}>
              Waiting for hand gestures...
            </div>
          ) : (
            events.slice(0, 15).map((e) => (
              <div
                key={e.id}
                className="animate-fade-in"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "8px 10px",
                  borderRadius: "var(--radius-sm)",
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border-subtle)",
                  fontSize: "12px",
                }}
              >
                <div>
                  <div style={{ fontWeight: "600", color: "#ffffff" }}>{e.action}</div>
                  <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>{e.gesture}</div>
                </div>

                <div style={{ textAlign: "right" }}>
                  <span
                    style={{
                      fontSize: "10px",
                      color: "var(--accent-cyan)",
                      background: "rgba(0, 240, 255, 0.1)",
                      padding: "2px 6px",
                      borderRadius: "4px",
                    }}
                  >
                    {Math.round(e.confidence * 100)}%
                  </span>
                  <div style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "2px" }}>
                    {e.timestamp}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </aside>
  );
}
