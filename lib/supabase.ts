import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const isSupabaseConfigured =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 40,
    },
  },
});

export type DrawEvent = {
  type: "draw" | "erase" | "clear";
  userId: string;
  userName: string;
  color: string;
  size: number;
  points: { x: number; y: number }[];
};

export type UserPresence = {
  userId: string;
  userName: string;
  color: string;
  joinedAt: number;
};