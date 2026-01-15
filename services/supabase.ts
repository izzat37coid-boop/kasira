
import { createClient } from '@supabase/supabase-js';

// Deteksi dari berbagai kemungkinan sumber (Vite define, import.meta.env, atau process.env)
const supabaseUrl = 
  process.env.SUPABASE_URL || 
  (import.meta as any).env?.VITE_SUPABASE_URL || 
  (import.meta as any).env?.SUPABASE_URL;

const supabaseAnonKey = 
  process.env.SUPABASE_ANON_KEY || 
  (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 
  (import.meta as any).env?.SUPABASE_ANON_KEY;

export const isDbConfigured = 
  !!supabaseUrl && 
  !!supabaseAnonKey && 
  supabaseUrl !== 'undefined' && 
  supabaseAnonKey !== 'undefined' &&
  supabaseUrl !== '';

// Debug Log (Masked untuk keamanan)
if (isDbConfigured) {
  console.log("KASIRA: Database tersambung. URL terdeteksi.");
} else {
  console.warn("KASIRA: Konfigurasi Database tidak lengkap.");
  console.log("Status URL:", !!supabaseUrl ? "ADA" : "KOSONG");
  console.log("Status KEY:", !!supabaseAnonKey ? "ADA" : "KOSONG");
}

export const supabase = isDbConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : new Proxy({} as any, {
      get(_, prop) {
        if (prop === 'auth') {
          return {
            getSession: () => Promise.resolve({ data: { session: null }, error: null }),
            signInWithPassword: () => Promise.reject(new Error("Database belum dikonfigurasi.")),
            signUp: () => Promise.reject(new Error("Database belum dikonfigurasi.")),
            signOut: () => Promise.resolve({ error: null }),
            onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } })
          };
        }
        return () => ({
          from: () => ({
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({ data: null, error: null }),
                limit: () => ({ single: () => Promise.resolve({ data: null, error: null }) }),
                in: () => Promise.resolve({ data: [], error: null })
              }),
              in: () => Promise.resolve({ data: [], error: null })
            }),
            insert: () => Promise.resolve({ data: null, error: null }),
            upsert: () => Promise.resolve({ data: null, error: null }),
            update: () => ({ eq: () => Promise.resolve({ error: null }) }),
            delete: () => ({ eq: () => Promise.resolve({ error: null }) })
          })
        });
      }
    });
