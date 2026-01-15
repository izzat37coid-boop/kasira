
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
              console.warn("Supabase: SUPABASE_URL belum dikonfigurasi.");
              return Promise.resolve({ data: { session: null }, error: null });
            },
            signInWithPassword: () => {
              return Promise.reject(new Error("Supabase credentials missing"));
            },
            signUp: () => {
              return Promise.reject(new Error("Supabase credentials missing"));
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
        
        // Default handler untuk from('table').select()...
        return () => ({
          from: () => ({
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({ data: null, error: new Error("Missing credentials") }),
                limit: () => ({ single: () => Promise.resolve({ data: null, error: new Error("Missing credentials") }) })
              }),
              in: () => Promise.resolve({ data: [], error: null })
            }),
            insert: () => Promise.resolve({ data: null, error: new Error("Missing credentials") }),
            upsert: () => Promise.resolve({ data: null, error: new Error("Missing credentials") }),
            update: () => ({ eq: () => Promise.resolve({ error: new Error("Missing credentials") }) }),
            delete: () => ({ eq: () => Promise.resolve({ error: new Error("Missing credentials") }) })
          })
        });
      }
    });
