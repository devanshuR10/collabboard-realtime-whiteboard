'use client';

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import type { RemoteUser } from '@/types/whiteboard';
import styles from './RightSidebar.module.css';

interface RightSidebarProps {
  roomId: string;
  roomName: string;
  remoteUsers: Record<string, RemoteUser>;
  userName: string;
  userColor: string;
}

export default function RightSidebar({
  roomId,
  roomName,
  remoteUsers,
  userName,
  userColor,
}: RightSidebarProps) {
  const [copied, setCopied] = useState(false);

  const roomUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/room/${roomId}`
      : `https://whiteboard.app/room/${roomId}`;

  const allUsers: Array<{ id: string; name: string; color: string; status: string; isMe: boolean }> = [
    { id: 'me', name: userName, color: userColor, status: 'Drawing', isMe: true },
    ...Object.values(remoteUsers).map((u) => ({
      id: u.userId,
      name: u.userName,
      color: u.color,
      status: u.status === 'drawing' ? 'Drawing' : 'Idle',
      isMe: false,
    })),
  ];

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(roomUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* noop */
    }
  };

  return (
    <aside className={styles.sidebar}>
      {/* ── Online Users ── */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Online Users ({allUsers.length})</h3>
        <ul className={styles.userList}>
          {allUsers.map((u) => (
            <li key={u.id} className={styles.userRow}>
              <span
                className={styles.userDot}
                style={{ background: u.color }}
              />
              <span className={styles.userName}>
                {u.name}
                {u.isMe && <span className={styles.youBadge}> (you)</span>}
              </span>
              <span
                className={`${styles.statusBadge} ${
                  u.status === 'Drawing' ? styles.statusDrawing : styles.statusIdle
                }`}
              >
                {u.status}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <div className={styles.divider} />

      {/* ── Room Info ── */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Room Info</h3>

        <div className={styles.infoRow}>
          <span className={styles.infoLabel}>Room Name</span>
          <div className={styles.infoValue}>
            <span>{roomName}</span>
            <button
              className={styles.copyIconBtn}
              onClick={handleCopy}
              title="Copy link"
            >
              {copied ? <Check size={13} /> : <Copy size={13} />}
            </button>
          </div>
        </div>

        <div className={styles.infoRow}>
          <span className={styles.infoLabel}>Room Link</span>
          <div className={styles.infoValue}>
            <span className={styles.roomLink} title={roomUrl}>
              {roomUrl.replace('https://', '').slice(0, 28)}…
            </span>
            <button
              className={styles.copyIconBtn}
              onClick={handleCopy}
              title="Copy link"
            >
              {copied ? <Check size={13} /> : <Copy size={13} />}
            </button>
          </div>
        </div>

        <button className={styles.copyLinkBtn} onClick={handleCopy}>
          {copied ? (
            <>
              <Check size={14} /> Copied!
            </>
          ) : (
            <>
              <Copy size={14} /> Copy Link
            </>
          )}
        </button>
      </section>

      <div className={styles.divider} />

      {/* ── How to use ── */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>How to use</h3>
        <ul className={styles.howToList}>
          <li>Select a color and start drawing</li>
          <li>Everyone can see in real-time</li>
          <li>Your name shows with your drawing</li>
          <li>Undo to remove your last stroke</li>
          <li>Share the link to invite others</li>
        </ul>
      </section>
    </aside>
  );
}
