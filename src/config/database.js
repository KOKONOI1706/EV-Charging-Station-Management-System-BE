import { createClient } from '@supabase/supabase-js';
import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Try multiple paths to find .env file
const possibleEnvPaths = [
  path.join(__dirname, '../..', '.env'),
  path.join(process.cwd(), '.env'),
  path.join(__dirname, '../../..', 'EV-Charging-Station-Management-System-BE', '.env'),
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
  dotenv.config();
}

// Database mode: 'supabase' or 'local'
const DB_MODE = process.env.DB_MODE || 'supabase';

let db = null;
let supabase = null;
let supabaseAdmin = null;

if (DB_MODE === 'local') {
  // PostgreSQL Local Configuration
  console.log('🗄️ Using LOCAL PostgreSQL database');
  
  const { Pool } = pg;
  
  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'ev_charging_db',
    max: 20, // Maximum number of clients in the pool
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });

  // Test connection
  pool.query('SELECT NOW()', (err, res) => {
    if (err) {
      console.error('❌ PostgreSQL connection error:', err);
    } else {
      console.log('✅ PostgreSQL connected successfully at', res.rows[0].now);
    }
  });

  db = pool;
  
} else {
  // Supabase Configuration (default)
  console.log('☁️ Using SUPABASE database');
  
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables. Please check your .env file.');
  }

  // Client for general operations (with Row Level Security)
  supabase = createClient(supabaseUrl, supabaseAnonKey);

  // Admin client for server-side operations (bypasses RLS)
  supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey);
}

/**
 * Universal query wrapper that works with both Supabase and PostgreSQL
 * 
 * For Supabase: Use supabase.from('table').select()...
 * For PostgreSQL: Use query('SELECT * FROM table WHERE...')
 */
export const query = async (text, params) => {
  if (DB_MODE === 'local') {
    const start = Date.now();
    const res = await db.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: res.rowCount });
    return res;
  } else {
    throw new Error('Use supabase client methods for Supabase mode');
  }
};

/**
 * Get database client based on mode
 */
export const getDB = () => {
  if (DB_MODE === 'local') {
    return db;
  } else {
    return { supabase, supabaseAdmin };
  }
};

export { db, supabase, supabaseAdmin, DB_MODE };
export default DB_MODE === 'local' ? db : supabase;
