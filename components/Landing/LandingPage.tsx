'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Pen, Users, ArrowRight, LogIn } from 'lucide-react';
import { generateRoomId, generateUserId, getRandomColor } from '@/lib/roomUtils';
import styles from './LandingPage.module.css';

type Step = 'name' | 'action';

export default function LandingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('name');
  const [name, setName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [nameError, setNameError] = useState('');
  const [joinError, setJoinError] = useState('');

  /* ── Helpers ─────────────────────────────────────────────────────── */
  const saveSession = (overrideColor?: string) => {
    const color = overrideColor ?? getRandomColor();
    const userId = generateUserId();
    sessionStorage.setItem('userName', name.trim());
    sessionStorage.setItem('userId', userId);
    sessionStorage.setItem('userColor', color);
    return { userId, color };
  };

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) {
      setNameError('Name must be at least 2 characters');
      return;
    }
    setNameError('');
    setStep('action');
  };

  const handleCreate = () => {
    saveSession();
    const roomId = generateRoomId();
    router.push(`/room/${roomId}`);
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    const code = joinCode.trim().toLowerCase();
    if (!code) {
      setJoinError('Please enter a room code');
      return;
    }
    if (!/^[a-z0-9]{6,12}$/.test(code)) {
      setJoinError('Invalid room code format');
      return;
    }
    setJoinError('');
    saveSession();
    router.push(`/room/${code}`);
  };

  return (
    <div className={styles.page}>
      {/* ── Animated background blobs ── */}
      <div className={styles.blob1} />
      <div className={styles.blob2} />
      <div className={styles.blob3} />

      {/* ── Card ── */}
      <div className={styles.card}>
        {/* Logo + title */}
        <div className={styles.header}>
          <div className={styles.logoWrap}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 2L3 7v10l9 5 9-5V7L12 2z"
                fill="var(--accent)"
                opacity="0.18"
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
          <h1 className={styles.title}>Shared Whiteboard</h1>
          <p className={styles.subtitle}>
            Draw together in real-time — no account needed.
          </p>
        </div>

        {/* ── Step: Name ── */}
        {step === 'name' && (
          <form className={styles.form} onSubmit={handleNameSubmit} noValidate>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="user-name">
                Your name
              </label>
              <input
                id="user-name"
                className={`${styles.input} ${nameError ? styles.inputError : ''}`}
                type="text"
                placeholder="e.g. Devanshu"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (nameError) setNameError('');
                }}
                autoFocus
                maxLength={30}
              />
              {nameError && (
                <span className={styles.errorMsg}>{nameError}</span>
              )}
            </div>
            <button
              id="continue-btn"
              className={styles.primaryBtn}
              type="submit"
            >
              Continue <ArrowRight size={16} />
            </button>
          </form>
        )}

        {/* ── Step: Create or Join ── */}
        {step === 'action' && (
          <div className={styles.actionStep}>
            <p className={styles.greeting}>
              Welcome, <strong>{name}</strong>! What would you like to do?
            </p>

            {/* Create Room */}
            <button
              id="create-room-btn"
              className={styles.actionCard}
              onClick={handleCreate}
            >
              <div className={styles.actionIcon} style={{ background: '#eff6ff' }}>
                <Pen size={20} color="var(--accent)" />
              </div>
              <div className={styles.actionText}>
                <span className={styles.actionTitle}>Create a Room</span>
                <span className={styles.actionDesc}>
                  Start a new whiteboard and invite others
                </span>
              </div>
              <ArrowRight size={16} className={styles.actionArrow} />
            </button>

            {/* Join Room */}
            <div className={styles.joinCard}>
              <div className={styles.joinHeader}>
                <div className={styles.actionIcon} style={{ background: '#f0fdf4' }}>
                  <Users size={20} color="#22c55e" />
                </div>
                <span className={styles.actionTitle}>Join a Room</span>
              </div>
              <form onSubmit={handleJoin} className={styles.joinForm} noValidate>
                <input
                  id="room-code-input"
                  className={`${styles.input} ${joinError ? styles.inputError : ''}`}
                  type="text"
                  placeholder="Enter room code (e.g. abc12345)"
                  value={joinCode}
                  onChange={(e) => {
                    setJoinCode(e.target.value);
                    if (joinError) setJoinError('');
                  }}
                  maxLength={12}
                />
                {joinError && (
                  <span className={styles.errorMsg}>{joinError}</span>
                )}
                <button
                  id="join-room-btn"
                  type="submit"
                  className={styles.joinBtn}
                >
                  <LogIn size={15} /> Join Room
                </button>
              </form>
            </div>

            <button
              className={styles.backLink}
              onClick={() => setStep('name')}
            >
              ← Change name
            </button>
          </div>
        )}
      </div>

      {/* Footer credit */}
      <div className={styles.footerCredit}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 2L3 6v6c0 5.25 3.75 10.15 9 11.25C17.25 22.15 21 17.25 21 12V6L12 2z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path
            d="M9 12l2 2 4-4"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Built for&nbsp;
        <a
          href="https://digitalheroesco.com"
          target="_blank"
          rel="noopener noreferrer"
          id="digital-heroes-landing-link"
        >
          Digital Heroes
        </a>
        &nbsp;·&nbsp;Devanshu Barsod
      </div>
    </div>
  );
}
