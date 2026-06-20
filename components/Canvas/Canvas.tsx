'use client';

import {
  forwardRef,
  useImperativeHandle,
  useRef,
  useEffect,
  useCallback,
} from 'react';
import type { Stroke, Point, Tool } from '@/types/whiteboard';
import styles from './Canvas.module.css';

/* ─── Public handle exposed via ref ─────────────────────────────────── */
export interface CanvasHandle {
  addRemoteStrokeStart: (
    strokeId: string,
    remoteUserId: string,
    remoteUserName: string,
    remoteColor: string,
    tool: Tool,
    lineWidth: number
  ) => void;
  addRemoteStrokePoint: (strokeId: string, point: Point) => void;
  addRemoteStrokeEnd: (strokeId: string) => void;
  removeStrokeById: (strokeId: string) => void;
  clearAll: () => void;
  undoLast: () => string | null;
  downloadPNG: () => void;
}

interface CanvasProps {
  tool: Tool;
  color: string;
  lineWidth: number;
  userName: string;
  onStrokeStart: (strokeId: string) => void;
  onStrokePoint: (strokeId: string, point: Point) => void;
  onStrokeEnd: (strokeId: string) => void;
  onCursorMove: (x: number, y: number) => void;
}

/* ─── Helpers ────────────────────────────────────────────────────────── */
function randomId(): string {
  return Math.random().toString(36).slice(2, 11);
}

function drawDotGrid(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number
): void {
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = '#d1d5db';
  const spacing = 24;
  for (let x = spacing; x < w; x += spacing) {
    for (let y = spacing; y < h; y += spacing) {
      ctx.beginPath();
      ctx.arc(x, y, 1, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function renderStroke(ctx: CanvasRenderingContext2D, stroke: Stroke): void {
  if (stroke.points.length === 0) return;

  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const isEraser = stroke.tool === 'eraser';
  ctx.strokeStyle = isEraser ? '#ffffff' : stroke.color;
  ctx.lineWidth = isEraser ? stroke.lineWidth * 4 : stroke.lineWidth;

  if (stroke.points.length === 1) {
    /* single dot */
    ctx.beginPath();
    ctx.arc(
      stroke.points[0].x,
      stroke.points[0].y,
      ctx.lineWidth / 2,
      0,
      Math.PI * 2
    );
    ctx.fillStyle = ctx.strokeStyle;
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.moveTo(stroke.points[0].x, stroke.points[0].y);

    /* Quadratic bezier smoothing */
    for (let i = 1; i < stroke.points.length - 1; i++) {
      const mx = (stroke.points[i].x + stroke.points[i + 1].x) / 2;
      const my = (stroke.points[i].y + stroke.points[i + 1].y) / 2;
      ctx.quadraticCurveTo(stroke.points[i].x, stroke.points[i].y, mx, my);
    }
    const last = stroke.points[stroke.points.length - 1];
    ctx.lineTo(last.x, last.y);
    ctx.stroke();
  }

  ctx.restore();
}

/* ─── Component ──────────────────────────────────────────────────────── */
const Canvas = forwardRef<CanvasHandle, CanvasProps>(function Canvas(
  { tool, color, lineWidth, userName, onStrokeStart, onStrokePoint, onStrokeEnd, onCursorMove },
  ref
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  /* Mutable drawing state (not React state — avoids re-render overhead) */
  const committed = useRef<Stroke[]>([]);
  const active = useRef<Map<string, Stroke>>(new Map());
  const localIds = useRef<string[]>([]);

  const isDrawing = useRef(false);
  const currentId = useRef<string | null>(null);

  /* Keep tool props accessible in event handlers without stale closures */
  const toolRef = useRef(tool);
  const colorRef = useRef(color);
  const lwRef = useRef(lineWidth);
  const userNameRef = useRef(userName);
  useEffect(() => { toolRef.current = tool; }, [tool]);
  useEffect(() => { colorRef.current = color; }, [color]);
  useEffect(() => { lwRef.current = lineWidth; }, [lineWidth]);
  useEffect(() => { userNameRef.current = userName; }, [userName]);

  /* ── Grid cache (redrawn only on resize) ─────────────────────────── */
  const gridCache = useRef<ImageData | null>(null);

  const buildGridCache = useCallback((w: number, h: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    drawDotGrid(ctx, w, h);
    gridCache.current = ctx.getImageData(0, 0, w, h);
  }, []);

  /* ── Resize handler ──────────────────────────────────────────────── */
  useEffect(() => {
    const resize = () => {
      const canvas = canvasRef.current;
      const wrapper = wrapperRef.current;
      if (!canvas || !wrapper) return;
      canvas.width = wrapper.clientWidth;
      canvas.height = wrapper.clientHeight;
      buildGridCache(canvas.width, canvas.height);
    };

    resize();
    const ro = new ResizeObserver(resize);
    if (wrapperRef.current) ro.observe(wrapperRef.current);
    return () => ro.disconnect();
  }, [buildGridCache]);

  /* ── RAF render loop ─────────────────────────────────────────────── */
  const rafId = useRef<number | null>(null);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    /* Restore cached grid (fast path) */
    if (gridCache.current) {
      ctx.putImageData(gridCache.current, 0, 0);
    } else {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    committed.current.forEach((s) => renderStroke(ctx, s));
    active.current.forEach((s) => renderStroke(ctx, s));
  }, []);

  useEffect(() => {
    const loop = () => {
      render();
      rafId.current = requestAnimationFrame(loop);
    };
    rafId.current = requestAnimationFrame(loop);
    return () => {
      if (rafId.current !== null) cancelAnimationFrame(rafId.current);
    };
  }, [render]);

  /* ── Coordinate helper ───────────────────────────────────────────── */
  const getPoint = useCallback(
    (e: MouseEvent | TouchEvent): Point => {
      const canvas = canvasRef.current!;
      const rect = canvas.getBoundingClientRect();
      let cx: number, cy: number;

      if ('touches' in e) {
        const t = e.touches[0] ?? e.changedTouches[0];
        cx = t.clientX; cy = t.clientY;
      } else {
        cx = e.clientX; cy = e.clientY;
      }

      return {
        x: (cx - rect.left) * (canvas.width / rect.width),
        y: (cy - rect.top) * (canvas.height / rect.height),
      };
    },
    []
  );

  /* ── Pointer handlers ────────────────────────────────────────────── */
  const handleDown = useCallback(
    (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      const point = getPoint(e);
      const sid = randomId();

      active.current.set(sid, {
        id: sid,
        userName: userNameRef.current,
        color: colorRef.current,
        lineWidth: lwRef.current,
        tool: toolRef.current,
        points: [point],
      });

      isDrawing.current = true;
      currentId.current = sid;
      localIds.current.push(sid);
      onStrokeStart(sid);
    },
    [getPoint, onStrokeStart]
  );

  const handleMove = useCallback(
    (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      const point = getPoint(e);
      const canvas = canvasRef.current;

      /* Broadcast cursor as percentage */
      if (canvas) {
        onCursorMove(point.x / canvas.width, point.y / canvas.height);
      }

      if (!isDrawing.current || !currentId.current) return;

      const stroke = active.current.get(currentId.current);
      if (stroke) {
        stroke.points.push(point);
        onStrokePoint(currentId.current, point);
      }
    },
    [getPoint, onCursorMove, onStrokePoint]
  );

  const handleUp = useCallback(
    (_e: MouseEvent | TouchEvent) => {
      if (!isDrawing.current || !currentId.current) return;
      const sid = currentId.current;
      const stroke = active.current.get(sid);
      if (stroke) {
        active.current.delete(sid);
        committed.current.push(stroke);
      }
      isDrawing.current = false;
      currentId.current = null;
      onStrokeEnd(sid);
    },
    [onStrokeEnd]
  );

  /* Attach pointer events */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.addEventListener('mousedown', handleDown);
    canvas.addEventListener('mousemove', handleMove);
    canvas.addEventListener('mouseup', handleUp);
    canvas.addEventListener('mouseleave', handleUp);
    canvas.addEventListener('touchstart', handleDown, { passive: false });
    canvas.addEventListener('touchmove', handleMove, { passive: false });
    canvas.addEventListener('touchend', handleUp);

    return () => {
      canvas.removeEventListener('mousedown', handleDown);
      canvas.removeEventListener('mousemove', handleMove);
      canvas.removeEventListener('mouseup', handleUp);
      canvas.removeEventListener('mouseleave', handleUp);
      canvas.removeEventListener('touchstart', handleDown);
      canvas.removeEventListener('touchmove', handleMove);
      canvas.removeEventListener('touchend', handleUp);
    };
  }, [handleDown, handleMove, handleUp]);

  /* ── Imperative API for parent (remote events) ───────────────────── */
  useImperativeHandle(ref, () => ({
    addRemoteStrokeStart(sid, _uid, uName, uColor, uTool, uLw) {
      active.current.set(sid, {
        id: sid,
        userName: uName,
        color: uColor,
        lineWidth: uLw,
        tool: uTool,
        points: [],
      });
    },

    addRemoteStrokePoint(sid, point) {
      const stroke = active.current.get(sid);
      if (stroke) stroke.points.push(point);
    },

    addRemoteStrokeEnd(sid) {
      const stroke = active.current.get(sid);
      if (stroke) {
        active.current.delete(sid);
        committed.current.push(stroke);
      }
    },

    removeStrokeById(sid) {
      committed.current = committed.current.filter((s) => s.id !== sid);
      active.current.delete(sid);
      localIds.current = localIds.current.filter((id) => id !== sid);
    },

    clearAll() {
      committed.current = [];
      active.current.clear();
      localIds.current = [];
    },

    undoLast() {
      if (localIds.current.length === 0) return null;
      const sid = localIds.current.pop()!;
      committed.current = committed.current.filter((s) => s.id !== sid);
      active.current.delete(sid);
      return sid;
    },

    downloadPNG() {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const tmp = document.createElement('canvas');
      tmp.width = canvas.width;
      tmp.height = canvas.height;
      const ctx = tmp.getContext('2d')!;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, tmp.width, tmp.height);
      ctx.drawImage(canvas, 0, 0);
      const a = document.createElement('a');
      a.download = 'whiteboard.png';
      a.href = tmp.toDataURL('image/png');
      a.click();
    },
  }));

  return (
    <div ref={wrapperRef} className={styles.wrapper}>
      <canvas
        ref={canvasRef}
        className={styles.canvas}
        style={{ cursor: tool === 'eraser' ? 'cell' : 'crosshair' }}
      />
    </div>
  );
});

export default Canvas;
