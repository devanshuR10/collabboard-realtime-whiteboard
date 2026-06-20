import { use, useEffect, useRef, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { Point, Tool, RemoteUser } from '@/types/whiteboard';

interface UseRealtimeOptions {
  roomId: string;
  userId: string;
  userName: string;
  color: string;
  onRemoteStrokeStart: (
    strokeId: string,
    remoteUserId: string,
    remoteUserName: string,
    remoteColor: string,
    tool: Tool,
    lineWidth: number
  ) => void;
  onRemoteStrokePoint: (strokeId: string, point: Point) => void;
  onRemoteStrokeEnd: (strokeId: string) => void;
  onRemoteClear: () => void;
  onRemoteUndo: (strokeId: string) => void;
  onUsersChange: (users: Record<string, RemoteUser>) => void;
}

export function useRealtime({
  roomId,
  userId,
  userName,
  color,
  onRemoteStrokeStart,
  onRemoteStrokePoint,
  onRemoteStrokeEnd,
  onRemoteClear,
  onRemoteUndo,
  onUsersChange,
}: UseRealtimeOptions) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const remoteUsersRef = useRef<Record<string, RemoteUser>>({});

  // ── Broadcast helpers ───────────────────────────────────────────────
  const broadcastStrokeStart = useCallback(
    (strokeId: string, tool: Tool, lineWidth: number) => {
      channelRef.current?.send({
        type: 'broadcast',
        event: 'stroke_start',
        payload: { strokeId, userId, userName, color, tool, lineWidth },
      });
    },
    [userId, userName, color]
  );

  const broadcastStrokePoint = useCallback(
    (strokeId: string, point: Point) => {
      channelRef.current?.send({
        type: 'broadcast',
        event: 'stroke_point',
        payload: { strokeId, point },
      });
    },
    []
  );

  const broadcastStrokeEnd = useCallback((strokeId: string) => {
    channelRef.current?.send({
      type: 'broadcast',
      event: 'stroke_end',
      payload: { strokeId },
    });
  }, []);

  const broadcastClear = useCallback(() => {
    channelRef.current?.send({
      type: 'broadcast',
      event: 'canvas_clear',
      payload: { userId },
    });
  }, [userId]);

  const broadcastUndo = useCallback(
    (strokeId: string) => {
      channelRef.current?.send({
        type: 'broadcast',
        event: 'stroke_undo',
        payload: { strokeId, userId },
      });
    },
    [userId]
  );

  /** Cursor position is broadcast as 0-1 percentage coordinates */
  const broadcastCursor = useCallback(
    (x: number, y: number) => {
      channelRef.current?.send({
        type: 'broadcast',
        event: 'cursor_move',
        payload: { userId, userName, color, x, y },
      });
    },
    [userId, userName, color]
  );

  // ── Channel subscription ────────────────────────────────────────────
  useEffect(() => {
    if (!isSupabaseConfigured || !userId || !userName) return;

    const updateUsers = (extra?: Partial<Record<string, Partial<RemoteUser>>>) => {
      const state = channel.presenceState<{ userName: string; color: string }>();
      const users: Record<string, RemoteUser> = {};

      Object.entries(state).forEach(([key, presences]) => {
        if (key === userId) return;
        const p = presences[0];
        users[key] = {
          userId: key,
          userName: p.userName,
          color: p.color,
          cursor: remoteUsersRef.current[key]?.cursor ?? null,
          status: remoteUsersRef.current[key]?.status ?? 'idle',
          ...extra?.[key],
        };
      });

      remoteUsersRef.current = users;
      onUsersChange({ ...users });
    };

    const channel = supabase.channel(`room:${roomId}`, {
      config: {
        presence: { key: userId },
        broadcast: { self: false, ack: false },
      },
    });

    // Presence
    channel.on('presence', { event: 'sync' }, () => updateUsers());
    channel.on('presence', { event: 'join' }, () => updateUsers());
    channel.on('presence', { event: 'leave' }, () => updateUsers());

    // Drawing broadcasts
    channel.on('broadcast', { event: 'stroke_start' }, ({ payload }) => {
      if (payload.userId === userId) return;
      onRemoteStrokeStart(
        payload.strokeId,
        payload.userId,
        payload.userName,
        payload.color,
        payload.tool,
        payload.lineWidth
      );
      remoteUsersRef.current[payload.userId] = {
        ...remoteUsersRef.current[payload.userId],
        status: 'drawing',
      };
      onUsersChange({ ...remoteUsersRef.current });
    });

    channel.on('broadcast', { event: 'stroke_point' }, ({ payload }) => {
      onRemoteStrokePoint(payload.strokeId, payload.point);
    });

    channel.on('broadcast', { event: 'stroke_end' }, ({ payload }) => {
      onRemoteStrokeEnd(payload.strokeId);
      if (remoteUsersRef.current[payload.userId ?? '']) {
        remoteUsersRef.current[payload.userId] = {
          ...remoteUsersRef.current[payload.userId],
          status: 'idle',
        };
        onUsersChange({ ...remoteUsersRef.current });
      }
    });

    channel.on('broadcast', { event: 'canvas_clear' }, () => {
      onRemoteClear();
    });

    channel.on('broadcast', { event: 'stroke_undo' }, ({ payload }) => {
      onRemoteUndo(payload.strokeId);
    });

    channel.on('broadcast', { event: 'cursor_move' }, ({ payload }) => {
      if (payload.userId === userId) return;
      remoteUsersRef.current[payload.userId] = {
        userId: payload.userId,
        userName: payload.userName,
        color: payload.color,
        cursor: { x: payload.x, y: payload.y },
        status: remoteUsersRef.current[payload.userId]?.status ?? 'idle',
      };
      onUsersChange({ ...remoteUsersRef.current });
    });

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({ userName, color });
      }
    });

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, userId, userName, color]);

  return {
    broadcastStrokeStart,
    broadcastStrokePoint,
    broadcastStrokeEnd,
    broadcastClear,
    broadcastUndo,
    broadcastCursor,
  };
}
