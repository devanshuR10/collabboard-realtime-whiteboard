'use client';

import { useState } from 'react';
import { Link2, Copy, Check, Users } from 'lucide-react';
import styles from './TopNav.module.css';

interface TopNavProps {
  roomId: string;
  roomName: string;
  onlineCount: number;
  userName: string;
  userColor: string;
}

export default function TopNav({
  roomId,
  roomName,
  onlineCount,
  userName,
  userColor,
}: TopNavProps) {
  const [copied, setCopied] = useState(false);

  const roomUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/room/${roomId}`
      : '';

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(roomUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* fallback: do nothing */
    }
  };

  return (
    <header className={styles.nav}>
      {/* ── Left: logo + title ── */}
      <div className={styles.left}>
        <div className={styles.logo}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 2L3 7v10l9 5 9-5V7L12 2z"
              fill="var(--accent)"
              opacity="0.15"
            />
            <path
              d="M12 2L3 7v10l9 5 9-5V7L12 2z"
              stroke="var(--accent)"
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
            <path
              d="M8 10l2.5 2.5L16 9"
              stroke="var(--accent)"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <span className={styles.appName}>Shared Whiteboard</span>
      </div>

      {/* ── Centre: room badge + online count ── */}
      <div className={styles.centre}>
        <div className={styles.roomBadge}>
          <span className={styles.roomLabel}>Room:</span>
          <span className={styles.roomName}>{roomName}</span>
          <button
            className={styles.iconBtn}
            onClick={handleCopyLink}
            title="Copy room link"
            aria-label="Copy room link"
          >
            {copied ? <Check size={13} /> : <Copy size={13} />}
          </button>
        </div>

        <div className={styles.onlineBadge}>
          <span className={styles.pulse} />
          <span>{onlineCount} user{onlineCount !== 1 ? 's' : ''} online</span>
        </div>
      </div>

      {/* ── Right: share + user avatar ── */}
      <div className={styles.right}>
        <div
          className={styles.userAvatar}
          style={{ background: userColor }}
          title={userName}
        >
          {userName.charAt(0).toUpperCase()}
        </div>

        <button className={styles.shareBtn} onClick={handleCopyLink}>
          <Link2 size={14} />
          {copied ? 'Copied!' : 'Share Room'}
        </button>
      </div>
    </header>
  );
}
