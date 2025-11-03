import { supabaseAdmin } from '../src/config/supabase.js';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runMigration() {
  try {
    console.log('🚀 Starting migration: Add station_id to users table...\n');

    // Check if station_id column already exists by trying to select it
    console.log('Checking if station_id column exists...');
    const { error: testError } = await supabaseAdmin
      .from('users')
      .select('station_id')
      .limit(1);

    if (!testError) {
      console.log('✅ Column station_id already exists!');
      console.log('\nYou can now update users with their assigned stations.');
      return;
    }

    // Column doesn't exist, show SQL to run manually
    console.log('⚠️  Column station_id does NOT exist yet.\n');
    console.log('📝 Please run the following SQL in your Supabase SQL Editor:\n');
    
    const sqlPath = join(__dirname, 'add_station_id_to_users.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('---SQL START---');
    console.log(sql);
    console.log('---SQL END---\n');
    
    console.log('🔗 Steps:');
    console.log('1. Go to Supabase Dashboard > SQL Editor');
    console.log('2. Paste the SQL above');
    console.log('3. Click "Run"');
    console.log('4. Run this script again to verify\n');
    
  } catch (error) {
    console.error('❌ Migration error:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

runMigration();
