'use client';

import { MousePointer2, Pen, Eraser, Undo2, Trash2, Download } from 'lucide-react';
import type { Tool } from '@/types/whiteboard';
import styles from './Toolbar.module.css';

const SWATCHES = [
  { color: '#000000', label: 'Black' },
  { color: '#ef4444', label: 'Red' },
  { color: '#3b82f6', label: 'Blue' },
  { color: '#22c55e', label: 'Green' },
  { color: '#a855f7', label: 'Purple' },
  { color: '#f97316', label: 'Orange' },
];

const WIDTHS = [
  { value: 2,  label: 'Thin' },
  { value: 5,  label: 'Medium' },
  { value: 10, label: 'Thick' },
];

interface ToolbarProps {
  tool: Tool;
  color: string;
  lineWidth: number;
  onToolChange: (t: Tool) => void;
  onColorChange: (c: string) => void;
  onLineWidthChange: (w: number) => void;
  onUndo: () => void;
  onClear: () => void;
  onDownload: () => void;
}

export default function Toolbar({
  tool,
  color,
  lineWidth,
  onToolChange,
  onColorChange,
  onLineWidthChange,
  onUndo,
  onClear,
  onDownload,
}: ToolbarProps) {
  return (
    <aside className={styles.toolbar}>
      {/* ── Drawing tools ── */}
      <div className={styles.section}>
        <ToolBtn
          icon={<MousePointer2 size={18} />}
          label="Select"
          active={tool === 'pen' ? false : false}   /* future select tool */
          onClick={() => onToolChange('pen')}
        />
        <ToolBtn
          icon={<Pen size={18} />}
          label="Pen"
          active={tool === 'pen'}
          onClick={() => onToolChange('pen')}
        />
        <ToolBtn
          icon={<Eraser size={18} />}
          label="Eraser"
          active={tool === 'eraser'}
          onClick={() => onToolChange('eraser')}
        />
      </div>

      <div className={styles.divider} />

      {/* ── Actions ── */}
      <div className={styles.section}>
        <ToolBtn icon={<Undo2 size={18} />} label="Undo" onClick={onUndo} />
        <ToolBtn
          icon={<Trash2 size={18} />}
          label="Clear"
          danger
          onClick={() => {
            if (window.confirm('Clear the entire canvas?')) onClear();
          }}
        />
        <ToolBtn
          icon={<Download size={18} />}
          label="Save"
          onClick={onDownload}
        />
      </div>

      <div className={styles.divider} />

      {/* ── Color swatches ── */}
      <div className={styles.colorSection}>
        <span className={styles.colorLabel}>Color</span>
        <div className={styles.swatchGrid}>
          {SWATCHES.map((s) => (
            <button
              key={s.color}
              className={`${styles.swatch} ${color === s.color ? styles.swatchActive : ''}`}
              style={{ background: s.color }}
              title={s.label}
              onClick={() => onColorChange(s.color)}
              aria-label={s.label}
            />
          ))}
        </div>
        <label className={styles.customRow}>
          <input
            type="color"
            value={color}
            onChange={(e) => onColorChange(e.target.value)}
            className={styles.colorInput}
            title="Custom color"
          />
          <span className={styles.customLabel}>+ Custom</span>
        </label>
      </div>

      <div className={styles.divider} />

      {/* ── Stroke width ── */}
      <div className={styles.widthSection}>
        <span className={styles.colorLabel}>Width</span>
        <div className={styles.widthBtns}>
          {WIDTHS.map((w) => (
            <button
              key={w.value}
              className={`${styles.widthBtn} ${lineWidth === w.value ? styles.widthActive : ''}`}
              onClick={() => onLineWidthChange(w.value)}
              title={w.label}
            >
              <span
                className={styles.widthDot}
                style={{ width: w.value * 2, height: w.value * 2 }}
              />
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}

/* ─── ToolBtn sub-component ─────────────────────────────────────────── */
function ToolBtn({
  icon,
  label,
  active,
  danger,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  danger?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={`${styles.toolBtn} ${active ? styles.toolActive : ''} ${danger ? styles.toolDanger : ''}`}
      onClick={onClick}
      title={label}
      aria-label={label}
      aria-pressed={active}
    >
      {icon}
      <span className={styles.toolLabel}>{label}</span>
    </button>
  );
}
