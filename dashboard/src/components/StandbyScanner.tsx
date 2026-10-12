"use client";

import React from "react";
import { VideoOff, RefreshCw, Terminal, Play, ShieldAlert, Cpu } from "lucide-react";

interface StandbyScannerProps {
  serverUrl: string;
  isPolling: boolean;
  onRetry: () => void;
  onEnableBrowserCamera?: () => void;
}

export default function StandbyScanner({
  serverUrl,
  isPolling,
  onRetry,
  onEnableBrowserCamera,
}: StandbyScannerProps) {
  return (
    <div
      className="glass-panel"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "60px 24px",
        textAlign: "center",
        minHeight: "480px",
        background: "radial-gradient(circle at center, rgba(16, 24, 39, 0.8) 0%, rgba(8, 10, 15, 0.95) 100%)",
        border: "1px dashed rgba(0, 240, 255, 0.25)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background Radar Sweeper Effect */}
      <div
        style={{
          position: "absolute",
          width: "360px",
          height: "360px",
          borderRadius: "50%",
          border: "1px solid rgba(0, 240, 255, 0.12)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            position: "absolute",
            width: "220px",
            height: "220px",
            borderRadius: "50%",
            border: "1px solid rgba(0, 240, 255, 0.18)",
          }}
        />
        <div
          style={{
            position: "absolute",
            width: "90px",
            height: "90px",
            borderRadius: "50%",
            border: "1px dashed rgba(0, 240, 255, 0.25)",
          }}
        />
      </div>

      {/* Main Icon */}
      <div
        style={{
          width: "72px",
          height: "72px",
          borderRadius: "50%",
          background: "rgba(19, 24, 38, 0.8)",
          border: "2px solid rgba(0, 240, 255, 0.4)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 0 30px rgba(0, 240, 255, 0.2)",
          marginBottom: "24px",
          zIndex: 1,
        }}
      >
        <VideoOff size={32} color="var(--accent-cyan)" />
      </div>

      <div style={{ zIndex: 1, maxWidth: "560px" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            background: "rgba(255, 170, 0, 0.12)",
            border: "1px solid rgba(255, 170, 0, 0.3)",
            padding: "4px 12px",
            borderRadius: "20px",
            marginBottom: "16px",
          }}
        >
          <span className="pulse-dot" style={{ backgroundColor: "var(--accent-amber)" }} />
          <span style={{ fontSize: "12px", fontWeight: "600", color: "var(--accent-amber)" }}>
            STANDBY &bull; SCANNING FOR HAND CONTROL APP
          </span>
        </div>

        <h2 style={{ fontSize: "24px", fontWeight: "700", color: "#ffffff", marginBottom: "12px" }}>
          Camera Feed Will Appear When Hand Control Opens
        </h2>

        <p style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: "1.6", marginBottom: "28px" }}>
          The dashboard does not lock your webcam. As soon as you or another user starts{" "}
          <strong style={{ color: "#ffffff" }}>HandControl.exe</strong>, their camera stream, hand skeleton, and gesture actions will automatically appear live here.
        </p>

        {/* Quick Launch Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "12px",
            marginBottom: "28px",
            textAlign: "left",
          }}
        >
          <div
            style={{
              background: "var(--bg-surface)",
              padding: "14px",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
              <Play size={16} color="var(--accent-green)" />
              <span style={{ fontSize: "13px", fontWeight: "600", color: "#ffffff" }}>Option 1: Executable</span>
            </div>
            <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>
              Double-click <code style={{ color: "var(--accent-cyan)" }}>HandControl.exe</code> in the project folder.
            </p>
          </div>

          <div
            style={{
              background: "var(--bg-surface)",
              padding: "14px",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
              <Terminal size={16} color="var(--accent-cyan)" />
              <span style={{ fontSize: "13px", fontWeight: "600", color: "#ffffff" }}>Option 2: Terminal</span>
            </div>
            <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>
              Run <code style={{ color: "var(--accent-cyan)" }}>python main.py</code> in your command prompt.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "12px" }}>
          <button onClick={onRetry} className="btn primary" style={{ padding: "10px 18px", fontSize: "13px" }}>
            <RefreshCw size={14} className={isPolling ? "animate-spin" : ""} />
            Check Connection Now
          </button>

          {onEnableBrowserCamera && (
            <button
              onClick={onEnableBrowserCamera}
              className="btn"
              style={{ padding: "10px 18px", fontSize: "13px" }}
              title="Manually open webcam in browser without Hand Control"
            >
              Test Browser Cam Directly
            </button>
          )}
        </div>

        <div style={{ marginTop: "20px", fontSize: "11px", color: "var(--text-muted)" }}>
          Listening on <span style={{ color: "var(--accent-cyan)" }}>{serverUrl}</span> (auto-reconnects every 1.2s)
        </div>
      </div>
    </div>
  );
}
