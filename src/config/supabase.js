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