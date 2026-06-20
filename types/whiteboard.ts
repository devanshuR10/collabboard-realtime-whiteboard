export type Tool = 'pen' | 'eraser';

export interface Point {
  x: number;
  y: number;
}

export interface Stroke {
  id: string;
  userName: string;
  color: string;
  lineWidth: number;
  tool: Tool;
  points: Point[];
}

export interface RemoteUser {
  userId: string;
  userName: string;
  color: string;
  cursor: { x: number; y: number } | null; // 0-1 percentage coords
  status: 'drawing' | 'idle';
}
