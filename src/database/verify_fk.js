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

console.log('🔍 Verifying foreign key relationship...\n');

async function verify() {
  try {
    // Test join query
    const { data, error } = await supabase
      .from('charging_points')
      .select(`
        point_id,
        name,
        station_id,
        stations (
          id,
          name
        )
      `)
      .limit(5);

    if (error) {
      console.error('❌ Foreign key verification FAILED:', error.message);
      console.log('\nThe foreign key relationship has NOT been created yet.');
      console.log('Please run the SQL migration in Supabase Dashboard.');
      return;
    }

    console.log('✅ Foreign key relationship WORKS!\n');
    console.log('Sample joined data:');
    console.log(JSON.stringify(data, null, 2));
    
    console.log('\n✅ Success! You can now use joins like:');
    console.log('   .from("charging_points").select("*, stations(*)")');
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

verify();
