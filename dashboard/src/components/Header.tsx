"use client";

import React from "react";
import {
  Video,
  Grid,
  Layers,
  Maximize2,
  RefreshCw,
  Camera,
  Shield,
  Activity,
  Sliders,
  Play,
  Pause,
} from "lucide-react";

interface HeaderProps {
  activeCount: number;
  totalCount: number;
  viewMode: "grid" | "stage" | "focus";
  setViewMode: (mode: "grid" | "stage" | "focus") => void;
  onRefreshCams: () => void;
  onToggleGlobalPause: () => void;
  isGlobalPaused: boolean;
  onTakeAllSnapshots: () => void;
  fps: number;
}

export default function Header({
  activeCount,
  totalCount,
  viewMode,
  setViewMode,
  onRefreshCams,
  onToggleGlobalPause,
  isGlobalPaused,
  onTakeAllSnapshots,
  fps,
}: HeaderProps) {
  return (
    <header className="glass-panel" style={{ margin: "16px", padding: "14px 20px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
        {/* Brand & Status */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "12px",
              background: "linear-gradient(135deg, #00f0ff, #10e599)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 0 20px rgba(0, 240, 255, 0.4)",
            }}
          >
            <Video size={22} color="#080a0f" strokeWidth={2.5} />
          </div>

          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <h1 style={{ fontSize: "19px", fontWeight: "700", letterSpacing: "0.5px", color: "#ffffff" }}>
                HAND CONTROL <span style={{ color: "var(--accent-cyan)", fontWeight: "400" }}>LIVE HUB</span>
              </h1>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "rgba(16, 229, 153, 0.12)", padding: "3px 8px", borderRadius: "20px", border: "1px solid rgba(16, 229, 153, 0.3)" }}>
                <span className="pulse-dot online" />
                <span style={{ fontSize: "11px", fontWeight: "600", color: "var(--accent-green)", letterSpacing: "0.5px" }}>
                  SYSTEM ONLINE
                </span>
              </div>
            </div>
            <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "2px" }}>
              Multi-Webcam Surveillance & Real-Time Gesture Telemetry Dashboard
            </p>
          </div>
        </div>

        {/* Center: System Telemetry Pills */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              background: "var(--bg-card)",
              padding: "6px 12px",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <Activity size={15} color="var(--accent-cyan)" />
            <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Active Cams:</span>
            <span style={{ fontSize: "13px", fontWeight: "700", color: "var(--accent-cyan)" }}>
              {activeCount} / {totalCount}
            </span>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              background: "var(--bg-card)",
              padding: "6px 12px",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Engine FPS:</span>
            <span style={{ fontSize: "13px", fontWeight: "700", color: "var(--accent-green)" }}>
              {Math.round(fps)} FPS
            </span>
          </div>
        </div>

        {/* Right Controls: View Switcher & Action Buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {/* Layout Mode Selector */}
          <div
            style={{
              display: "flex",
              background: "var(--bg-surface)",
              padding: "3px",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <button
              id="btn-view-grid"
              onClick={() => setViewMode("grid")}
              className={`btn ${viewMode === "grid" ? "primary" : ""}`}
              style={{ padding: "6px 10px", fontSize: "12px", border: "none" }}
              title="2x2 Multi-Grid View"
            >
              <Grid size={14} />
              Grid
            </button>
            <button
              id="btn-view-stage"
              onClick={() => setViewMode("stage")}
              className={`btn ${viewMode === "stage" ? "primary" : ""}`}
              style={{ padding: "6px 10px", fontSize: "12px", border: "none" }}
              title="Spotlight Stage View"
            >
              <Layers size={14} />
              Stage
            </button>
            <button
              id="btn-view-focus"
              onClick={() => setViewMode("focus")}
              className={`btn ${viewMode === "focus" ? "primary" : ""}`}
              style={{ padding: "6px 10px", fontSize: "12px", border: "none" }}
              title="Single Focus View"
            >
              <Maximize2 size={14} />
              Focus
            </button>
          </div>

          {/* Action Buttons */}
          <button
            id="btn-refresh-cams"
            onClick={onRefreshCams}
            className="btn"
            title="Scan Hardware Cameras"
          >
            <RefreshCw size={14} />
            Scan Cams
          </button>

          <button
            id="btn-snapshot-all"
            onClick={onTakeAllSnapshots}
            className="btn"
            title="Capture snapshots of all cameras"
          >
            <Camera size={14} />
            Capture All
          </button>

          <button
            id="btn-global-pause"
            onClick={onToggleGlobalPause}
            className={`btn ${isGlobalPaused ? "danger" : ""}`}
            title={isGlobalPaused ? "Resume Feeds" : "Pause All Feeds"}
          >
            {isGlobalPaused ? <Play size={14} /> : <Pause size={14} />}
            {isGlobalPaused ? "Resume" : "Freeze"}
          </button>
        </div>
      </div>
    </header>
  );
}
