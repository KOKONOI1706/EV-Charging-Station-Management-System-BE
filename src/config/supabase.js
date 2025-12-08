/*
========================================
SUPABASE CONFIG - Cấu hình Supabase Client
========================================

Mô tả:
File config tạo Supabase clients cho backend (Node.js).
Tự động tìm file .env ở nhiều đường dẫn khác nhau.

Chức năng chính:
• Tìm và load file .env từ nhiều vị trí có thể
• Tạo 2 Supabase clients:
  1. supabase: Client thông thường với ANON_KEY (có Row Level Security - RLS)
  2. supabaseAdmin: Admin client với SERVICE_ROLE_KEY (bypass RLS)
• Validate environment variables
• Export ra các clients để dùng trong toàn bộ backend

Đường dẫn tìm .env (theo thứ tự):
1. src/config/../../.env (thư mục gốc BE)
2. process.cwd()/.env (thư mục hiện tại khi chạy)
3. ../../EV-Charging-Station-Management-System-BE/.env (từ workspace root)

Environment variables cần:
- SUPABASE_URL: URL của Supabase project
- SUPABASE_ANON_KEY: Public anon key (cho client thông thường)
- SUPABASE_SERVICE_ROLE_KEY: Service role key (cho admin client)

Clients:
- supabase (export default): Dùng cho các API routes thông thường
  + Tuân thủ Row Level Security (RLS)
  + Chỉ truy cập data được phép theo policies
  
- supabaseAdmin (export named): Dùng cho server-side operations
  + Bypass Row Level Security
  + Full quyền truy cập database
  + Dùng cho: seeding, migrations, admin tasks

Error handling:
- Throw error nếu thiếu SUPABASE_URL hoặc SUPABASE_ANON_KEY
- Console.warn nếu không tìm thấy .env nhưng vẫn thử default dotenv.config()

ESM compatibility:
- Dùng fileURLToPath để convert import.meta.url thành __filename
- Tính __dirname từ __filename
- fs.existsSync để check file .env tồn tại

Dependencies:
- @supabase/supabase-js: Supabase client library
- dotenv: Load environment variables
- path, fs: File system operations
*/

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Try multiple paths to find .env file
const possibleEnvPaths = [
  path.join(__dirname, '../..', '.env'),           // from config dir
  path.join(process.cwd(), '.env'),                 // from cwd
  path.join(__dirname, '../../..', 'EV-Charging-Station-Management-System-BE', '.env'), // from workspace root
];

let envPath = null;
for (const p of possibleEnvPaths) {
  if (fs.existsSync(p)) {
    envPath = p;
    console.log('Loading .env from:', envPath);
    break;
  }
}

if (envPath) {
  dotenv.config({ path: envPath });
} else {
  console.warn('⚠️ Could not find .env file. Attempting default dotenv behavior...');
  dotenv.config(); // Try default behavior
}

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

// Client for general operations (with Row Level Security)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client for server-side operations (bypasses RLS)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey);

export default supabase;