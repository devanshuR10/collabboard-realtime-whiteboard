"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import { supabase, DrawEvent, UserPresence } from "@/lib/supabase";
import type { RealtimeChannel } from "@supabase/supabase-js";

const USER_COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#ef4444",
  "#f97316", "#eab308", "#22c55e", "#14b8a6",
  "#3b82f6", "#06b6d4",
];

function getRandomColor() {
  return USER_COLORS[Math.floor(Math.random() * USER_COLORS.length)];
}

type Tool = "pen" | "eraser";

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = (params.id as string).toUpperCase();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  const [userName, setUserName] = useState("");
  const [userId] = useState(() => uuidv4());
  const [userColor] = useState(() => getRandomColor());
  const [tool, setTool] = useState<Tool>("pen");
  const [color, setColor] = useState("#1e1e1e");
  const [size, setSize] = useState(4);
  const [users, setUsers] = useState<UserPresence[]>([]);
  const [copied, setCopied] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);

  const currentPoints = useRef<{ x: number; y: number }[]>([]);
  const remoteDrawers = useRef<Map<string, { x: number; y: number }[]>>(new Map());

  // Get username from sessionStorage
  useEffect(() => {
    const stored = sessionStorage.getItem("wb_username");
    if (!stored) {
      router.push("/");
      return;
    }
    setUserName(stored);
  }, [router]);

  // Setup canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = canvas.offsetWidth * window.devicePixelRatio;
    canvas.height = canvas.offsetHeight * window.devicePixelRatio;
    const ctx = canvas.getContext("2d")!;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    const overlay = overlayRef.current;
    if (!overlay) return;
    overlay.width = overlay.offsetWidth * window.devicePixelRatio;
    overlay.height = overlay.offsetHeight * window.devicePixelRatio;
    const octx = overlay.getContext("2d")!;
    octx.scale(window.devicePixelRatio, window.devicePixelRatio);
  }, []);

  // Resize handler
  useEffect(() => {
    function handleResize() {
      const canvas = canvasRef.current;
      if (!canvas) return;
      // Save existing drawing
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      tempCanvas.getContext("2d")!.drawImage(canvas, 0, 0);

      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      const ctx = canvas.getContext("2d")!;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      ctx.drawImage(tempCanvas, 0, 0, canvas.offsetWidth, canvas.offsetHeight);

      const overlay = overlayRef.current;
      if (!overlay) return;
      overlay.width = overlay.offsetWidth * window.devicePixelRatio;
      overlay.height = overlay.offsetHeight * window.devicePixelRatio;
      overlay.getContext("2d")!.scale(window.devicePixelRatio, window.devicePixelRatio);
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Supabase realtime
  useEffect(() => {
    if (!userName) return;

    const channel = supabase.channel(`room:${roomId}`, {
      config: { presence: { key: userId } },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState<UserPresence>();
        const allUsers: UserPresence[] = [];
        Object.values(state).forEach((presences: any) => {
          presences.forEach((p: UserPresence) => allUsers.push(p));
        });
        setUsers(allUsers.sort((a, b) => a.joinedAt - b.joinedAt));
      })
      .on("broadcast", { event: "draw" }, ({ payload }: { payload: DrawEvent }) => {
        applyRemoteEvent(payload);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({
            userId,
            userName,
            color: userColor,
            joinedAt: Date.now(),
          } satisfies UserPresence);
        }
      });

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
    };
  }, [userName, roomId, userId, userColor]);

  function applyRemoteEvent(event: DrawEvent) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const w = canvas.offsetWidth;
    const h = canvas.offsetHeight;

    if (event.type === "clear") {
      ctx.clearRect(0, 0, w, h);
      return;
    }

    if (event.points.length < 2) return;
    ctx.beginPath();
    ctx.moveTo(event.points[0].x * w, event.points[0].y * h);
    for (let i = 1; i < event.points.length; i++) {
      ctx.lineTo(event.points[i].x * w, event.points[i].y * h);
    }
    ctx.strokeStyle = event.type === "erase" ? "#ffffff" : event.color;
    ctx.lineWidth = event.type === "erase" ? event.size * 3 : event.size;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();

    // Draw username label at last point
    if (event.type === "draw") {
      const last = event.points[event.points.length - 1];
      ctx.font = "500 11px Inter, sans-serif";
      ctx.fillStyle = event.color;
      ctx.fillText(event.userName, last.x * w + 8, last.y * h - 6);
    }
  }

  function getCanvasPoint(e: React.MouseEvent | React.TouchEvent) {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    let clientX: number, clientY: number;
    if ("touches" in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }
    return {
      x: (clientX - rect.left) / rect.width,
      y: (clientY - rect.top) / rect.height,
    };
  }

  function startDraw(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault();
    setIsDrawing(true);
    const pt = getCanvasPoint(e);
    currentPoints.current = [pt];
  }

  function draw(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault();
    if (!isDrawing) return;
    const pt = getCanvasPoint(e);
    currentPoints.current.push(pt);

    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const w = canvas.offsetWidth;
    const h = canvas.offsetHeight;
    const pts = currentPoints.current;

    if (pts.length < 2) return;
    ctx.beginPath();
    ctx.moveTo(pts[pts.length - 2].x * w, pts[pts.length - 2].y * h);
    ctx.lineTo(pts[pts.length - 1].x * w, pts[pts.length - 1].y * h);
    ctx.strokeStyle = tool === "eraser" ? "#ffffff" : color;
    ctx.lineWidth = tool === "eraser" ? size * 3 : size;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
  }

  function endDraw(e: React.MouseEvent | React.TouchEvent) {
    if (!isDrawing) return;
    setIsDrawing(false);

    const pts = currentPoints.current;
    if (pts.length < 1) return;

    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const w = canvas.offsetWidth;
    const h = canvas.offsetHeight;

    // Draw username label
    if (tool === "pen" && pts.length > 0) {
      const last = pts[pts.length - 1];
      ctx.font = "500 11px Inter, sans-serif";
      ctx.fillStyle = color;
      ctx.fillText(userName, last.x * w + 8, last.y * h - 6);
    }

    // Broadcast
    const event: DrawEvent = {
      type: tool === "eraser" ? "erase" : "draw",
      userId,
      userName,
      color,
      size,
      points: pts,
    };
    channelRef.current?.send({
      type: "broadcast",
      event: "draw",
      payload: event,
    });

    currentPoints.current = [];
  }

  function clearCanvas() {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);
    channelRef.current?.send({
      type: "broadcast",
      event: "draw",
      payload: { type: "clear", userId, userName, color, size, points: [] } satisfies DrawEvent,
    });
  }

  function downloadCanvas() {
    const canvas = canvasRef.current!;
    const a = document.createElement("a");
    // Create white background
    const tmpCanvas = document.createElement("canvas");
    tmpCanvas.width = canvas.width;
    tmpCanvas.height = canvas.height;
    const tmpCtx = tmpCanvas.getContext("2d")!;
    tmpCtx.fillStyle = "#ffffff";
    tmpCtx.fillRect(0, 0, tmpCanvas.width, tmpCanvas.height);
    tmpCtx.drawImage(canvas, 0, 0);
    a.href = tmpCanvas.toDataURL("image/png");
    a.download = `collab-board-${roomId}.png`;
    a.click();
  }

  function copyRoomId() {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const COLORS = ["#1e1e1e", "#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#8b5cf6", "#ec4899", "#ffffff"];

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      height: "100vh",
      background: "#f9fafb",
      overflow: "hidden",
    }}>
      {/* Top Nav */}
      <header style={{
        height: "52px",
        background: "rgba(255,255,255,0.95)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid #e5e7eb",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 16px",
        zIndex: 20,
        flexShrink: 0,
      }}>
        {/* Left: Logo + room info */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button
            onClick={() => router.push("/")}
            style={{
              display: "flex", alignItems: "center", gap: "8px",
              background: "none", border: "none", cursor: "pointer",
              padding: "4px 8px", borderRadius: "8px",
              transition: "background 0.15s",
            }}
            onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = "#f3f4f6"}
            onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = "none"}
          >
            <div style={{
              width: "26px", height: "26px",
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              borderRadius: "7px",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="13" height="13" fill="none" viewBox="0 0 24 24">
                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 000-1.41l-2.34-2.34a1 1 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" fill="white"/>
              </svg>
            </div>
            <span style={{ fontWeight: 700, fontSize: "14px", color: "#111827" }}>CollabBoard</span>
          </button>

          <div style={{ width: "1px", height: "20px", background: "#e5e7eb" }} />

          <div style={{
            display: "flex", alignItems: "center", gap: "8px",
            background: "#f3f4f6",
            borderRadius: "8px",
            padding: "4px 10px",
          }}>
            <span style={{ fontSize: "12px", color: "#6b7280", fontWeight: 500 }}>Room</span>
            <span style={{ fontFamily: "monospace", fontSize: "13px", fontWeight: 700, color: "#111827", letterSpacing: "0.05em" }}>
              {roomId}
            </span>
            <button
              onClick={copyRoomId}
              title="Copy Room ID"
              style={{
                background: "none", border: "none", cursor: "pointer",
                color: copied ? "#22c55e" : "#9ca3af",
                display: "flex", padding: "2px",
                transition: "color 0.2s",
              }}
            >
              {copied ? (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>
              ) : (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
              )}
            </button>
          </div>
        </div>

        {/* Right: actions */}
 <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
  <a
    href="https://digitalheroesco.com"
    target="_blank"
    rel="noopener noreferrer"
    style={{
      fontSize: "11px",
      fontWeight: 600,
      color: "#6366f1",
      background: "rgba(99,102,241,0.08)",
      padding: "5px 12px",
      borderRadius: "99px",
      border: "1px solid rgba(99,102,241,0.2)",
      display: "flex",
      alignItems: "center",
      gap: "5px",
      transition: "background 0.2s",
    }}
    onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.background = "rgba(99,102,241,0.15)"}
    onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.background = "rgba(99,102,241,0.08)"}
  >
    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2L13.09 8.26L19 7L14.74 11.74L21 12L14.74 12.26L19 17L13.09 15.74L12 22L10.91 15.74L5 17L9.26 12.26L3 12L9.26 11.74L5 7L10.91 8.26L12 2Z"/>
    </svg>
    Built for Digital Heroes
  </a>

  <button
            onClick={downloadCanvas}
            title="Download as PNG"
            style={{
              display: "flex", alignItems: "center", gap: "6px",
              padding: "7px 14px",
              background: "#111827",
              color: "white",
              borderRadius: "8px",
              fontSize: "12px",
              fontWeight: 600,
              border: "none",
              cursor: "pointer",
              transition: "background 0.2s",
            }}
            onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = "#374151"}
            onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = "#111827"}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M19 9h-4V3H9v6H5l7 7 7-7zm-8 2V5h2v6h1.17L12 13.17 9.83 11H11zm-6 7h14v2H5v-2z"/></svg>
            Export PNG
          </button>
        </div>
      </header>

      {/* Body */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Left Toolbar */}
        <aside style={{
          width: "56px",
          background: "rgba(255,255,255,0.95)",
          backdropFilter: "blur(12px)",
          borderRight: "1px solid #e5e7eb",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "12px 0",
          gap: "4px",
          zIndex: 10,
          flexShrink: 0,
        }}>
          <ToolButton
            title="Pen"
            active={tool === "pen"}
            onClick={() => setTool("pen")}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 000-1.41l-2.34-2.34a1 1 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
            </svg>
          </ToolButton>

          <ToolButton
            title="Eraser"
            active={tool === "eraser"}
            onClick={() => setTool("eraser")}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M15.14 3c-.51 0-1.02.2-1.41.59L2.59 14.73c-.78.78-.78 2.05 0 2.83L5.03 20h7.66l8.72-8.72c.78-.78.78-2.05 0-2.83l-4.86-4.86A2 2 0 0015.14 3zm-4.36 15H6.31l-2-2L9 11.31l4.69 4.69-3.09 3.09.08-.09z"/>
            </svg>
          </ToolButton>

          <div style={{ height: "1px", width: "32px", background: "#e5e7eb", margin: "4px 0" }} />

          {/* Size presets */}
          {[2, 4, 8, 14].map(s => (
            <button
              key={s}
              title={`Size ${s}`}
              onClick={() => setSize(s)}
              style={{
                width: "36px", height: "36px",
                borderRadius: "8px",
                border: size === s ? "2px solid #6366f1" : "1.5px solid transparent",
                background: size === s ? "rgba(99,102,241,0.08)" : "transparent",
                cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.15s",
              }}
            >
              <div style={{
                width: `${Math.min(s * 1.5, 20)}px`,
                height: `${Math.min(s * 1.5, 20)}px`,
                borderRadius: "50%",
                background: size === s ? "#6366f1" : "#6b7280",
              }} />
            </button>
          ))}

          <div style={{ height: "1px", width: "32px", background: "#e5e7eb", margin: "4px 0" }} />

          {/* Clear */}
          <ToolButton title="Clear Canvas" active={false} onClick={clearCanvas} danger>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
            </svg>
          </ToolButton>
        </aside>

        {/* Canvas area */}
        <main style={{ flex: 1, position: "relative", overflow: "hidden" }}>
          {/* Dotted grid */}
          <div style={{
            position: "absolute",
            inset: 0,
            backgroundImage: "radial-gradient(circle, #d1d5db 1.2px, transparent 1.2px)",
            backgroundSize: "24px 24px",
            pointerEvents: "none",
            zIndex: 0,
          }} />

          {/* Drawing canvas */}
          <canvas
            ref={canvasRef}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              cursor: tool === "eraser" ? "cell" : "crosshair",
              zIndex: 1,
              touchAction: "none",
            }}
            onMouseDown={startDraw}
            onMouseMove={draw}
            onMouseUp={endDraw}
            onMouseLeave={endDraw}
            onTouchStart={startDraw}
            onTouchMove={draw}
            onTouchEnd={endDraw}
          />

          {/* Overlay (labels layer) */}
          <canvas
            ref={overlayRef}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              pointerEvents: "none",
              zIndex: 2,
            }}
          />

          {/* Color picker bar at bottom of canvas */}
          <div style={{
            position: "absolute",
            bottom: "16px",
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(255,255,255,0.95)",
            backdropFilter: "blur(12px)",
            border: "1px solid #e5e7eb",
            borderRadius: "99px",
            padding: "8px 14px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            boxShadow: "0 4px 14px rgba(0,0,0,0.08)",
            zIndex: 5,
          }}>
            {COLORS.map(c => (
              <button
                key={c}
                onClick={() => { setColor(c); setTool("pen"); }}
                title={c}
                style={{
                  width: "22px",
                  height: "22px",
                  borderRadius: "50%",
                  background: c,
                  border: color === c && tool === "pen"
                    ? "3px solid #6366f1"
                    : c === "#ffffff" ? "1.5px solid #d1d5db" : "2px solid transparent",
                  cursor: "pointer",
                  transition: "transform 0.15s",
                  transform: color === c && tool === "pen" ? "scale(1.2)" : "scale(1)",
                  boxShadow: c !== "#ffffff" ? `0 2px 6px ${c}60` : "none",
                }}
              />
            ))}
            <div style={{ width: "1px", height: "18px", background: "#e5e7eb", margin: "0 2px" }} />
            <input
              type="color"
              value={color}
              onChange={e => { setColor(e.target.value); setTool("pen"); }}
              title="Custom color"
              style={{
                width: "22px", height: "22px",
                borderRadius: "50%",
                border: "1.5px solid #d1d5db",
                padding: 0,
                cursor: "pointer",
                overflow: "hidden",
                background: "none",
              }}
            />
          </div>
        </main>

        {/* Right Sidebar */}
        <aside style={{
          width: "220px",
          background: "rgba(255,255,255,0.95)",
          backdropFilter: "blur(12px)",
          borderLeft: "1px solid #e5e7eb",
          display: "flex",
          flexDirection: "column",
          flexShrink: 0,
          overflow: "hidden",
        }}>
          {/* Room info */}
          <div style={{
            padding: "16px",
            borderBottom: "1px solid #e5e7eb",
          }}>
            <p style={{ fontSize: "11px", fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "10px" }}>
              Room Info
            </p>
            <div style={{ background: "#f9fafb", borderRadius: "8px", padding: "10px 12px" }}>
              <p style={{ fontSize: "11px", color: "#6b7280", marginBottom: "3px" }}>Room ID</p>
              <p style={{ fontFamily: "monospace", fontSize: "14px", fontWeight: 700, color: "#111827", letterSpacing: "0.05em" }}>
                {roomId}
              </p>
            </div>
            <div style={{ marginTop: "8px", background: "#f9fafb", borderRadius: "8px", padding: "10px 12px" }}>
              <p style={{ fontSize: "11px", color: "#6b7280", marginBottom: "3px" }}>You</p>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: userColor, flexShrink: 0 }} />
                <p style={{ fontSize: "13px", fontWeight: 600, color: "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {userName}
                </p>
              </div>
            </div>
          </div>

          {/* Online users */}
          <div style={{ flex: 1, overflow: "auto", padding: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
              <p style={{ fontSize: "11px", fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Online
              </p>
              <div style={{
                background: "#dcfce7",
                color: "#16a34a",
                fontSize: "11px",
                fontWeight: 700,
                padding: "2px 7px",
                borderRadius: "99px",
              }}>
                {users.length}
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              {users.map(u => (
                <div
                  key={u.userId}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "8px 10px",
                    borderRadius: "8px",
                    background: u.userId === userId ? "rgba(99,102,241,0.06)" : "transparent",
                    border: u.userId === userId ? "1px solid rgba(99,102,241,0.15)" : "1px solid transparent",
                    transition: "background 0.15s",
                  }}
                >
                  <div style={{
                    width: "28px", height: "28px",
                    borderRadius: "50%",
                    background: u.color,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "white",
                    flexShrink: 0,
                    boxShadow: `0 2px 6px ${u.color}50`,
                  }}>
                    {u.userName.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ overflow: "hidden" }}>
                    <p style={{
                      fontSize: "13px",
                      fontWeight: 500,
                      color: "#111827",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}>
                      {u.userName}
                    </p>
                    {u.userId === userId && (
                      <p style={{ fontSize: "10px", color: "#6366f1", fontWeight: 600 }}>You</p>
                    )}
                  </div>
                  <div style={{
                    width: "7px", height: "7px",
                    borderRadius: "50%",
                    background: "#22c55e",
                    marginLeft: "auto",
                    flexShrink: 0,
                    boxShadow: "0 0 0 2px rgba(34,197,94,0.2)",
                  }} />
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div style={{
            padding: "12px 16px",
            borderTop: "1px solid #e5e7eb",
            fontSize: "10px",
            color: "#9ca3af",
            textAlign: "center",
            lineHeight: 1.6,
          }}>
            Devanshu Barsod<br />
            <a href="mailto:devanshur583@gmail.com" style={{ color: "#6366f1" }}>
              devanshur583@gmail.com
            </a>
          </div>
        </aside>
      </div>
    </div>
  );
}

function ToolButton({
  children,
  title,
  active,
  onClick,
  danger,
}: {
  children: React.ReactNode;
  title: string;
  active: boolean;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      style={{
        width: "36px", height: "36px",
        borderRadius: "8px",
        border: active ? "2px solid #6366f1" : "1.5px solid transparent",
        background: active
          ? "rgba(99,102,241,0.1)"
          : danger
          ? "transparent"
          : "transparent",
        color: active ? "#6366f1" : danger ? "#ef4444" : "#6b7280",
        cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "all 0.15s",
      }}
      onMouseEnter={e => {
        if (!active) {
          (e.currentTarget as HTMLButtonElement).style.background = danger ? "rgba(239,68,68,0.08)" : "#f3f4f6";
        }
      }}
      onMouseLeave={e => {
        if (!active) {
          (e.currentTarget as HTMLButtonElement).style.background = "transparent";
        }
      }}
    >
      {children}
    </button>
  );
}