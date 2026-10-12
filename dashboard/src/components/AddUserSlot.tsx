"use client";

import React, { useState } from "react";
import { Plus, Wifi, Laptop, Share2, Check } from "lucide-react";

interface AddUserSlotProps {
  onAddRemoteNode: (name: string, url: string) => void;
  onAddDemoCollaborator: () => void;
}

export default function AddUserSlot({
  onAddRemoteNode,
  onAddDemoCollaborator,
}: AddUserSlotProps) {
  const [showInput, setShowInput] = useState(false);
  const [nodeName, setNodeName] = useState("");
  const [nodeUrl, setNodeUrl] = useState("http://192.168.1.50:8000");
  const [copied, setCopied] = useState(false);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nodeName.trim() || !nodeUrl.trim()) return;
    onAddRemoteNode(nodeName.trim(), nodeUrl.trim());
    setNodeName("");
    setShowInput(false);
  };

  const copyShareLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.origin);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      className="glass-panel"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "36px 24px",
        minHeight: "320px",
        background: "rgba(11, 15, 24, 0.45)",
        border: "1px dashed rgba(255, 255, 255, 0.14)",
        borderRadius: "16px",
        textAlign: "center",
        transition: "all 0.25s ease",
      }}
    >
      <div
        style={{
          width: "52px",
          height: "52px",
          borderRadius: "50%",
          background: "rgba(0, 240, 255, 0.08)",
          border: "1px solid rgba(0, 240, 255, 0.25)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "16px",
        }}
      >
        <Laptop size={24} color="var(--accent-cyan)" />
      </div>

      <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#ffffff", marginBottom: "6px" }}>
        Connect Another User or Camera
      </h3>
      <p
        style={{
          fontSize: "13px",
          color: "var(--text-secondary)",
          maxWidth: "380px",
          lineHeight: "1.5",
          marginBottom: "20px",
        }}
      >
        When more users run Hand Control on their laptop, their live camera feed and hand gestures will automatically appear side-by-side.
      </p>

      {!showInput ? (
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", justifyContent: "center" }}>
          <button
            onClick={() => setShowInput(true)}
            className="btn primary"
            style={{ padding: "8px 16px", fontSize: "13px" }}
          >
            <Plus size={15} />
            Connect Remote Node URL
          </button>

          <button
            onClick={copyShareLink}
            className="btn"
            style={{ padding: "8px 16px", fontSize: "13px" }}
          >
            {copied ? <Check size={15} color="var(--accent-green)" /> : <Share2 size={15} />}
            {copied ? "Link Copied!" : "Share Dashboard Link"}
          </button>

          <button
            onClick={onAddDemoCollaborator}
            className="btn"
            style={{ padding: "8px 16px", fontSize: "13px", background: "rgba(168, 85, 247, 0.12)", borderColor: "rgba(168, 85, 247, 0.3)", color: "var(--accent-violet)" }}
            title="Preview how multi-user layout looks"
          >
            + Preview Multi-User Grid
          </button>
        </div>
      ) : (
        <form
          onSubmit={handleAdd}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            width: "100%",
            maxWidth: "360px",
            background: "rgba(18, 24, 38, 0.9)",
            padding: "16px",
            borderRadius: "12px",
            border: "1px solid var(--border-subtle)",
          }}
        >
          <input
            type="text"
            placeholder="User or Camera Name (e.g. Sarah Laptop)"
            value={nodeName}
            onChange={(e) => setNodeName(e.target.value)}
            style={{
              padding: "8px 12px",
              borderRadius: "6px",
              background: "var(--bg-surface)",
              border: "1px solid var(--border-subtle)",
              color: "#ffffff",
              fontSize: "13px",
              outline: "none",
            }}
            required
          />

          <input
            type="text"
            placeholder="Stream URL (http://<ip>:8000)"
            value={nodeUrl}
            onChange={(e) => setNodeUrl(e.target.value)}
            style={{
              padding: "8px 12px",
              borderRadius: "6px",
              background: "var(--bg-surface)",
              border: "1px solid var(--border-subtle)",
              color: "#ffffff",
              fontSize: "13px",
              outline: "none",
            }}
            required
          />

          <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", marginTop: "4px" }}>
            <button
              type="button"
              onClick={() => setShowInput(false)}
              className="btn"
              style={{ fontSize: "12px", padding: "6px 12px" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn primary"
              style={{ fontSize: "12px", padding: "6px 12px" }}
            >
              Add Node
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
