"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";

export default function HomePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [roomId, setRoomId] = useState("");
  const [nameError, setNameError] = useState("");
  const [roomError, setRoomError] = useState("");
  const [loading, setLoading] = useState<"create" | "join" | null>(null);

  function validateName() {
    if (!name.trim()) {
      setNameError("Please enter your name to continue.");
      return false;
    }
    setNameError("");
    return true;
  }

  function handleCreate() {
    if (!validateName()) return;
    setLoading("create");
    const id = uuidv4().slice(0, 8).toUpperCase();
    sessionStorage.setItem("wb_username", name.trim());
    router.push(`/room/${id}`);
  }

  function handleJoin() {
    if (!validateName()) return;
    if (!roomId.trim()) {
      setRoomError("Please enter a Room ID.");
      return;
    }
    setRoomError("");
    setLoading("join");
    sessionStorage.setItem("wb_username", name.trim());
    router.push(`/room/${roomId.trim().toUpperCase()}`);
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #f8faff 0%, #f0f4ff 50%, #faf8ff 100%)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Background grid */}
      <div style={{
        position: "absolute",
        inset: 0,
        backgroundImage: "radial-gradient(circle, #d1d5db 1px, transparent 1px)",
        backgroundSize: "28px 28px",
        opacity: 0.4,
        pointerEvents: "none",
      }} />

      {/* Decorative blobs */}
      <div style={{
        position: "absolute",
        top: "-80px",
        right: "-80px",
        width: "360px",
        height: "360px",
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute",
        bottom: "-60px",
        left: "-60px",
        width: "300px",
        height: "300px",
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      {/* Top bar */}
      <div style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: "56px",
        background: "rgba(255,255,255,0.8)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(229,231,235,0.8)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 32px",
        zIndex: 10,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            width: "30px", height: "30px",
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            borderRadius: "8px",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
              <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 000-1.41l-2.34-2.34a1 1 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" fill="white"/>
            </svg>
          </div>
          <span style={{ fontWeight: 700, fontSize: "16px", color: "#111827", letterSpacing: "-0.3px" }}>
            CollabBoard
          </span>
        </div>
        
        <a
          href="https://digitalheroesco.com"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontSize: "12px",
            fontWeight: 600,
            color: "#6366f1",
            background: "rgba(99,102,241,0.08)",
            padding: "6px 14px",
            borderRadius: "99px",
            border: "1px solid rgba(99,102,241,0.2)",
            transition: "all 0.2s",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLAnchorElement).style.background = "rgba(99,102,241,0.14)";
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLAnchorElement).style.background = "rgba(99,102,241,0.08)";
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L13.09 8.26L19 7L14.74 11.74L21 12L14.74 12.26L19 17L13.09 15.74L12 22L10.91 15.74L5 17L9.26 12.26L3 12L9.26 11.74L5 7L10.91 8.26L12 2Z"/>
          </svg>
          Built for Digital Heroes
        </a>
      </div>

      {/* Main card */}
      <div style={{
        background: "rgba(255,255,255,0.95)",
        backdropFilter: "blur(20px)",
        borderRadius: "24px",
        border: "1px solid rgba(229,231,235,0.8)",
        boxShadow: "0 25px 50px -12px rgba(0,0,0,0.08), 0 0 0 1px rgba(255,255,255,0.5)",
        padding: "48px",
        width: "100%",
        maxWidth: "460px",
        position: "relative",
        zIndex: 1,
        animation: "fadeIn 0.4s ease forwards",
      }}>
        {/* Logo / heading */}
        <div style={{ textAlign: "center", marginBottom: "36px" }}>
          <div style={{
            width: "56px",
            height: "56px",
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            borderRadius: "16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px",
            boxShadow: "0 8px 20px rgba(99,102,241,0.3)",
          }}>
            <svg width="28" height="28" fill="none" viewBox="0 0 24 24">
              <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 000-1.41l-2.34-2.34a1 1 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" fill="white"/>
            </svg>
          </div>
          <h1 style={{
            fontSize: "26px",
            fontWeight: 700,
            color: "#111827",
            letterSpacing: "-0.5px",
            marginBottom: "6px",
          }}>
            Welcome to CollabBoard
          </h1>
          <p style={{ fontSize: "14px", color: "#6b7280", lineHeight: 1.5 }}>
            Real-time collaborative whiteboard for teams
          </p>
        </div>

        {/* Name input */}
        <div style={{ marginBottom: "28px" }}>
          <label style={{
            display: "block",
            fontSize: "13px",
            fontWeight: 600,
            color: "#374151",
            marginBottom: "8px",
            letterSpacing: "0.01em",
          }}>
            Your Name
          </label>
          <input
            type="text"
            placeholder="e.g. Devanshu"
            value={name}
            onChange={e => { setName(e.target.value); setNameError(""); }}
            onKeyDown={e => e.key === "Enter" && handleCreate()}
            style={{
              width: "100%",
              padding: "12px 16px",
              borderRadius: "10px",
              border: nameError ? "1.5px solid #f87171" : "1.5px solid #e5e7eb",
              fontSize: "14px",
              color: "#111827",
              background: "#fafafa",
              transition: "border-color 0.2s, box-shadow 0.2s",
              outline: "none",
            }}
            onFocus={e => {
              e.currentTarget.style.borderColor = "#6366f1";
              e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.12)";
              e.currentTarget.style.background = "#fff";
            }}
            onBlur={e => {
              e.currentTarget.style.borderColor = nameError ? "#f87171" : "#e5e7eb";
              e.currentTarget.style.boxShadow = "none";
              e.currentTarget.style.background = "#fafafa";
            }}
          />
          {nameError && (
            <p style={{ fontSize: "12px", color: "#ef4444", marginTop: "6px", display: "flex", alignItems: "center", gap: "4px" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
              {nameError}
            </p>
          )}
        </div>

        {/* Divider */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          marginBottom: "24px",
        }}>
          <div style={{ flex: 1, height: "1px", background: "#e5e7eb" }} />
          <span style={{ fontSize: "12px", color: "#9ca3af", fontWeight: 500 }}>Choose an option</span>
          <div style={{ flex: 1, height: "1px", background: "#e5e7eb" }} />
        </div>

        {/* Create room */}
        <button
          onClick={handleCreate}
          disabled={loading !== null}
          style={{
            width: "100%",
            padding: "13px",
            borderRadius: "10px",
            background: loading === "create"
              ? "#a5b4fc"
              : "linear-gradient(135deg, #6366f1, #8b5cf6)",
            color: "white",
            fontSize: "14px",
            fontWeight: 600,
            marginBottom: "12px",
            cursor: loading !== null ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            boxShadow: loading ? "none" : "0 4px 14px rgba(99,102,241,0.35)",
            transition: "all 0.2s",
            border: "none",
          }}
          onMouseEnter={e => {
            if (!loading) (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)";
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
          }}
        >
          {loading === "create" ? (
            <span className="animate-spin" style={{ width: 16, height: 16, border: "2px solid white", borderTopColor: "transparent", borderRadius: "50%", display: "inline-block" }} />
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/>
            </svg>
          )}
          Create New Room
        </button>

        {/* Join room */}
        <div style={{ display: "flex", gap: "8px" }}>
          <div style={{ flex: 1, position: "relative" }}>
            <input
              type="text"
              placeholder="Room ID (e.g. A1B2C3D4)"
              value={roomId}
              onChange={e => { setRoomId(e.target.value.toUpperCase()); setRoomError(""); }}
              onKeyDown={e => e.key === "Enter" && handleJoin()}
              style={{
                width: "100%",
                padding: "12px 16px",
                borderRadius: "10px",
                border: roomError ? "1.5px solid #f87171" : "1.5px solid #e5e7eb",
                fontSize: "13px",
                fontFamily: "var(--font-mono, monospace)",
                color: "#111827",
                background: "#fafafa",
                letterSpacing: "0.08em",
                transition: "all 0.2s",
              }}
              onFocus={e => {
                e.currentTarget.style.borderColor = "#6366f1";
                e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.12)";
                e.currentTarget.style.background = "#fff";
              }}
              onBlur={e => {
                e.currentTarget.style.borderColor = roomError ? "#f87171" : "#e5e7eb";
                e.currentTarget.style.boxShadow = "none";
                e.currentTarget.style.background = "#fafafa";
              }}
            />
          </div>
          <button
            onClick={handleJoin}
            disabled={loading !== null}
            style={{
              padding: "12px 20px",
              borderRadius: "10px",
              background: "#f3f4f6",
              color: "#374151",
              fontSize: "13px",
              fontWeight: 600,
              cursor: loading !== null ? "not-allowed" : "pointer",
              border: "1.5px solid #e5e7eb",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              transition: "all 0.2s",
              whiteSpace: "nowrap",
            }}
            onMouseEnter={e => {
              if (!loading) {
                (e.currentTarget as HTMLButtonElement).style.background = "#e5e7eb";
                (e.currentTarget as HTMLButtonElement).style.borderColor = "#d1d5db";
              }
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.background = "#f3f4f6";
              (e.currentTarget as HTMLButtonElement).style.borderColor = "#e5e7eb";
            }}
          >
            {loading === "join" ? (
              <span className="animate-spin" style={{ width: 14, height: 14, border: "2px solid #6b7280", borderTopColor: "transparent", borderRadius: "50%", display: "inline-block" }} />
            ) : (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                <path d="M10.09 15.59L11.5 17l5-5-5-5-1.41 1.41L12.67 11H3v2h9.67l-2.58 2.59zM19 3H5c-1.11 0-2 .9-2 2v4h2V5h14v14H5v-4H3v4c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"/>
              </svg>
            )}
            Join
          </button>
        </div>
        {roomError && (
          <p style={{ fontSize: "12px", color: "#ef4444", marginTop: "6px", display: "flex", alignItems: "center", gap: "4px" }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
            {roomError}
          </p>
        )}
      </div>

      {/* Footer */}
      <footer style={{
        position: "absolute",
        bottom: "20px",
        textAlign: "center",
        fontSize: "12px",
        color: "#9ca3af",
        zIndex: 1,
      }}>
        Devanshu Barsod —{" "}
        <a href="mailto:devanshur583@gmail.com" style={{ color: "#6366f1" }}>
          devanshur583@gmail.com
        </a>
      </footer>
    </div>
  );
}