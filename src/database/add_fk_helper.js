import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../..', '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('🚀 Adding foreign key constraint to charging_points table...\n');

// We'll use PostgreSQL REST API to execute raw SQL
async function executeSql(sql) {
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseServiceKey,
      'Authorization': `Bearer ${supabaseServiceKey}`,
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({ query: sql })
  });

  return response;
}

// Main migration
async function addForeignKey() {
  try {
    // Since Supabase doesn't allow direct SQL execution via client,
    // we need to provide instructions for manual execution
    
    const migrationSQL = `
-- Add foreign key constraint
ALTER TABLE charging_points 
ADD CONSTRAINT charging_points_station_id_fkey 
FOREIGN KEY (station_id) 
REFERENCES stations(station_id)
ON DELETE CASCADE
ON UPDATE CASCADE;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_charging_points_station_id ON charging_points(station_id);
    `;

    console.log('📋 Please execute the following SQL in Supabase Dashboard > SQL Editor:\n');
    console.log('=' .repeat(80));
    console.log(migrationSQL);
    console.log('=' .repeat(80));
    console.log('\n📍 Dashboard URL: https://supabase.com/dashboard/project/xxdqbldczmlvvnbxsemq/editor');
    console.log('\n✅ After running the SQL, the foreign key relationship will be established!');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

addForeignKey();
