
import { createClient } from '@supabase/supabase-js';

// Mencoba mengambil dari process.env (diinjeksi oleh vite.config) atau import.meta.env (standar Vite)
const supabaseUrl = process.env.SUPABASE_URL || (import.meta as any).env?.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;

export const isDbConfigured = 
  !!supabaseUrl && 
  !!supabaseAnonKey && 
  supabaseUrl !== 'undefined' && 
  supabaseAnonKey !== 'undefined' &&
  supabaseUrl !== '';

// Log status koneksi untuk debug di Vercel (Hanya muncul di console log)
if (!isDbConfigured) {
  console.warn("KASIRA Status: Database belum terhubung. Pastikan SUPABASE_URL & SUPABASE_ANON_KEY sudah diatur di Environment Variables.");
} else {
  console.log("KASIRA Status: Database terdeteksi dan siap digunakan.");
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
