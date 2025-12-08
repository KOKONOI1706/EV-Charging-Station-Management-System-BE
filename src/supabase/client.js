/**
 * ===============================================================
 * SUPABASE CLIENT (SERVICE ROLE)
 * ===============================================================
 * Khởi tạo Supabase client với service role key cho backend
 * 
 * Chức năng:
 * - 🔑 Sử dụng service role key (bypass RLS policies)
 * - 🚫 Tắt auto-refresh token (không cần session persistence)
 * - 🔒 Chỉ dùng trong backend (KHÔNG expose ra frontend)
 * 
 * Configuration:
 * - supabaseUrl: URL của Supabase project (từ .env)
 * - supabaseServiceKey: Service role key (từ .env)
 *   * Service role key có quyền admin, bypass tất cả RLS
 *   * PHẢI giữ bí mật, không commit vào Git
 * 
 * Options:
 * - auth.autoRefreshToken: false
 *   → Không tự động refresh token
 * - auth.persistSession: false
 *   → Không lưu session (vì backend không cần)
 * 
 * Service role vs Anon key:
 * - Anon key: Dùng trong frontend, bị giới hạn bởi RLS policies
 * - Service role key: Dùng trong backend, bypass RLS, có full access
 * 
 * Use cases:
 * - Backend routes cần query data mà không bị RLS block
 * - Admin operations (create user, delete data, etc.)
 * - Scheduled jobs, background tasks
 * - Server-side data aggregation
 * 
 * Security:
 * - Service key PHẢI được lưu trong .env
 * - KHÔNG bao giờ expose key ra frontend
 * - KHÔNG commit .env vào Git
 * - Sử dụng .gitignore để exclude .env
 * 
 * Environment variables:
 * - SUPABASE_URL=https://your-project.supabase.co
 * - SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
 * 
 * Dependencies:
 * - @supabase/supabase-js: Supabase SDK
 * - dotenv: Load environment variables
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

// Create Supabase client with service role key for backend operations
export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export default supabase;