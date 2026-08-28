import { createClient as createSupabaseClient } from "@supabase/supabase-js";

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const rawKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Helper to check if URL is a valid http/https address
const isValidUrl = (url?: string) => {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
};

const supabaseUrl = isValidUrl(rawUrl)
  ? (rawUrl as string)
  : "https://placeholder.supabase.co";

const supabaseAnonKey =
  rawKey && rawKey.trim() !== "" ? rawKey : "placeholder-anon-key";

export const createClient = () =>
  createSupabaseClient(supabaseUrl, supabaseAnonKey);

export const supabase = createClient();
