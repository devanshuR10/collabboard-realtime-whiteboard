'use client';

import type { RemoteUser } from '@/types/whiteboard';
import styles from './CursorOverlay.module.css';

interface CursorOverlayProps {
  remoteUsers: Record<string, RemoteUser>;
}

/**
 * Renders other users' cursors as coloured pointer + name-tag pills.
 * Cursor coordinates are in 0-1 percentage space so they map correctly
 * regardless of canvas CSS dimensions vs internal resolution.
 */
export default function CursorOverlay({ remoteUsers }: CursorOverlayProps) {
  return (
    <div className={styles.overlay} aria-hidden>
      {Object.values(remoteUsers).map((user) => {
        if (!user.cursor) return null;
        return (
          <div
            key={user.userId}
            className={styles.cursorWrapper}
            style={{
              left: `${user.cursor.x * 100}%`,
              top: `${user.cursor.y * 100}%`,
            }}
          >
            {/* SVG cursor arrow */}
            <svg
              className={styles.cursorIcon}
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
            >
              <path
                d="M2 2l5.5 13.5 2.5-5.5 5.5-2.5L2 2z"
                fill={user.color}
                stroke="#ffffff"
                strokeWidth="1"
              />
            </svg>

            {/* Name tag */}
            <span
              className={styles.nameTag}
              style={{ background: user.color }}
            >
              {user.userName}
            </span>
          </div>
        );
      })}
    </div>
  );
}
