
import { createClient } from '@supabase/supabase-js';

// Mengambil nilai dari process.env yang disuntikkan oleh Vite
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

/**
 * Validasi kredensial sebelum inisialisasi.
 * Jika URL atau Key tidak tersedia (misal: belum disetel di environment),
 * kita mengembalikan Proxy agar aplikasi tidak crash saat pertama kali dimuat (runtime error),
 * tetapi akan memberikan pesan error yang jelas saat mencoba mengakses database.
 */
const isConfigured = 
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'undefined' && 
  supabaseAnonKey !== 'undefined';

export const supabase = isConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : new Proxy({} as any, {
      get(_, prop) {
        // Penanganan khusus untuk auth agar pemanggilan seperti supabase.auth.getSession() tidak langsung crash
        if (prop === 'auth') {
          return new Proxy({}, {
            get: () => () => {
              console.error("Supabase Error: SUPABASE_URL atau SUPABASE_ANON_KEY belum dikonfigurasi.");
              return Promise.resolve({ data: { session: null }, error: new Error("Missing credentials") });
            }
          });
        }
        // Penanganan umum untuk query (from, select, dll)
        return () => {
          throw new Error(
            "Koneksi Supabase Gagal: Pastikan variabel lingkungan SUPABASE_URL dan SUPABASE_ANON_KEY sudah disetel di environment Anda (misal: di .env atau dashboard deployment)."
          );
        };
      }
    });
