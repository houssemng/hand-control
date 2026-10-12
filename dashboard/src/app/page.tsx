"use client";

import React, { useState, useEffect, useRef } from "react";
import Header from "../components/Header";
import UserCameraCard, { UserSession } from "../components/UserCameraCard";
import AddUserSlot from "../components/AddUserSlot";
import TelemetrySidebar, { GestureEvent } from "../components/TelemetrySidebar";
import SpotlightModal from "../components/SpotlightModal";
import StandbyScanner from "../components/StandbyScanner";

const LOCAL_SERVER_URL = "http://localhost:8000";

export default function DashboardPage() {
  const [isHostConnected, setIsHostConnected] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [hostData, setHostData] = useState<any>(null);

  // Dynamic user sessions (no duplicates!)
  const [remoteSessions, setRemoteSessions] = useState<UserSession[]>([]);

  const [viewMode, setViewMode] = useState<"grid" | "stage" | "focus">("grid");
  const [spotlightSession, setSpotlightSession] = useState<UserSession | null>(null);
  const [events, setEvents] = useState<GestureEvent[]>([]);
  const [engineFps, setEngineFps] = useState(0);

  const prevActionRef = useRef<string | null>(null);

  // Poll Local Hand Control Host Instance
  const checkHost = async () => {
    setIsPolling(true);
    try {
      const res = await fetch(`${LOCAL_SERVER_URL}/api/status`, {
        cache: "no-store",
        headers: { Accept: "application/json" },
      });

      if (res.ok) {
        const data = await res.json();
        if (data && data.online) {
          setIsHostConnected(true);
          setHostData(data);
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
      setIsHostConnected(false);
    } catch {
      setIsHostConnected(false);
    } finally {
      setIsPolling(false);
    }
  };

  useEffect(() => {
    checkHost();
    const interval = setInterval(checkHost, 1200);
    return () => clearInterval(interval);
  }, []);

  // Assemble active sessions list
  const activeSessions: UserSession[] = [];

  if (isHostConnected && hostData) {
    activeSessions.push({
      id: "host-session",
      name: "Houssem (Local Node)",
      role: "Host Camera",
      isHost: true,
      streamUrl: `${LOCAL_SERVER_URL}/video_feed`,
      status: hostData.is_paused ? "paused" : "live",
      fps: hostData.fps || 30,
      resolution: hostData.resolution || "640x480",
      gesture: hostData.gesture || "NONE",
      stateLabel: hostData.state_label || "TRACKED",
      latencyMs: 12,
      lastAction: hostData.last_action,
    });
  }

  // Add any remote user sessions
  activeSessions.push(...remoteSessions);

  // Add a demo collaborator to preview multi-user experience
  const handleAddDemoCollaborator = () => {
    const demoId = `collaborator-${Date.now()}`;
    const newSession: UserSession = {
      id: demoId,
      name: `Collaborator #${remoteSessions.length + 2}`,
      role: "Remote Peer",
      isHost: false,
      streamUrl: `${LOCAL_SERVER_URL}/video_feed`,
      status: "live",
      fps: 29.5,
      resolution: "1280x720",
      gesture: "PINCH",
      stateLabel: "SPACE BAR",
      latencyMs: 24,
    };
    setRemoteSessions((prev) => [...prev, newSession]);
  };

  // Add real remote node URL
  const handleAddRemoteNode = (name: string, url: string) => {
    const newSession: UserSession = {
      id: `node-${Date.now()}`,
      name: name,
      role: "Network Node",
      isHost: false,
      streamUrl: `${url}/video_feed`,
      status: "live",
      fps: 30,
      resolution: "1280x720",
      gesture: "NONE",
      stateLabel: "CONNECTED",
      latencyMs: 18,
    };
    setRemoteSessions((prev) => [...prev, newSession]);
  };

  const handleMaximize = (sessionId: string) => {
    const s = activeSessions.find((x) => x.id === sessionId) || null;
    setSpotlightSession(s);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "var(--bg-primary)",
      }}
    >
      {/* Top Header */}
      <Header
        activeCount={activeSessions.length}
        totalCount={activeSessions.length}
        viewMode={viewMode}
        setViewMode={setViewMode}
        onRefreshCams={checkHost}
        onToggleGlobalPause={() => {}}
        isGlobalPaused={hostData?.is_paused || false}
        onTakeAllSnapshots={() => {
          alert("Capturing high-resolution snapshots across all active user sessions.");
        }}
        fps={engineFps}
      />

      {/* Main Structural Stage */}
      <main
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 340px",
          gap: "20px",
          padding: "0 20px 20px 20px",
          flex: 1,
        }}
      >
        {/* Left Section: Active User Feeds */}
        <section style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {activeSessions.length === 0 ? (
            <StandbyScanner
              serverUrl={LOCAL_SERVER_URL}
              isPolling={isPolling}
              onRetry={checkHost}
            />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {/* Dynamic Grid Layout Based on User Count */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    activeSessions.length === 1
                      ? "1fr"
                      : "repeat(auto-fit, minmax(460px, 1fr))",
                  gap: "20px",
                }}
              >
                {activeSessions.map((session) => (
                  <UserCameraCard
                    key={session.id}
                    session={session}
                    onMaximize={handleMaximize}
                  />
                ))}
              </div>

              {/* Add User / Node Expansion Slot (shown cleanly below or next to users) */}
              <AddUserSlot
                onAddRemoteNode={handleAddRemoteNode}
                onAddDemoCollaborator={handleAddDemoCollaborator}
              />
            </div>
          )}
        </section>

        {/* Right Section: Telemetry & Activity Sidebar */}
        <TelemetrySidebar
          currentGesture={hostData?.gesture || "NONE"}
          events={events}
          fps={engineFps}
        />
      </main>

      {/* Fullscreen Spotlight Modal */}
      {spotlightSession && (
        <SpotlightModal
          cam={{
            id: spotlightSession.id,
            name: spotlightSession.name,
            streamUrl: spotlightSession.streamUrl,
            status: spotlightSession.status === "offline" ? "error" : spotlightSession.status,
          }}
          onClose={() => setSpotlightSession(null)}
          currentGesture={spotlightSession.gesture}
        />
      )}
    </div>
  );
}
