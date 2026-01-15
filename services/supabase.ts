
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

const isConfigured = 
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'undefined' && 
  supabaseAnonKey !== '' &&
  supabaseAnonKey !== 'undefined';

export const supabase = isConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : new Proxy({} as any, {
      get(_, prop) {
        if (prop === 'auth') {
          return {
            getSession: () => {
              console.warn("Supabase: SUPABASE_URL atau SUPABASE_ANON_KEY belum dikonfigurasi.");
              return Promise.resolve({ data: { session: null }, error: null });
            },
            signInWithPassword: () => {
              return Promise.reject(new Error("Konfigurasi Database (Supabase) belum lengkap. Pastikan SUPABASE_URL dan SUPABASE_ANON_KEY sudah terisi di environment."));
            },
            signUp: () => {
              return Promise.reject(new Error("Konfigurasi Database (Supabase) belum lengkap."));
            },
            signOut: () => Promise.resolve({ error: null }),
            onAuthStateChange: () => {
              return {
                data: {
                  subscription: {
                    unsubscribe: () => {}
                  }
                }
              };
            }
          };
        }
        
        // Default handler untuk query tabel
        return () => ({
          from: () => ({
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({ data: null, error: new Error("Database belum dikonfigurasi.") }),
                limit: () => ({ single: () => Promise.resolve({ data: null, error: new Error("Database belum dikonfigurasi.") }) }),
                in: () => Promise.resolve({ data: [], error: null })
              }),
              in: () => Promise.resolve({ data: [], error: null })
            }),
            insert: () => Promise.resolve({ data: null, error: new Error("Database belum dikonfigurasi.") }),
            upsert: () => Promise.resolve({ data: null, error: new Error("Database belum dikonfigurasi.") }),
            update: () => ({ eq: () => Promise.resolve({ error: new Error("Database belum dikonfigurasi.") }) }),
            delete: () => ({ eq: () => Promise.resolve({ error: new Error("Database belum dikonfigurasi.") }) })
          })
        });
      }
    });
