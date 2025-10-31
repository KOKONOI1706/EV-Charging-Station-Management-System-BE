import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../..', '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  console.log('🚀 Starting migration: Add Foreign Key for charging_points...\n');

  try {
    // Read the migration SQL file
    const sqlFile = path.join(__dirname, 'add_charging_points_fk.sql');
    const sqlContent = fs.readFileSync(sqlFile, 'utf-8');

    console.log('📄 Migration file loaded successfully\n');

    // Split SQL by semicolons and execute each statement
    const statements = sqlContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`📊 Found ${statements.length} SQL statements to execute\n`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Skip comments and empty lines
      if (statement.startsWith('--') || statement.trim() === '') {
        continue;
      }

      console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`);
      
      const { data, error } = await supabase.rpc('exec', {
        sql: statement
      });

      if (error) {
        // Try alternative method using direct query
        console.log('⚠️  RPC method failed, trying direct execution...');
        
        // For this, we need to use the REST API directly
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`
          },
          body: JSON.stringify({ sql: statement })
        });

        if (!response.ok) {
          console.error(`❌ Failed to execute statement ${i + 1}:`, error);
          console.error('Statement:', statement.substring(0, 200));
          throw error;
        }
      }

      console.log(`✅ Statement ${i + 1} executed successfully\n`);
    }

    console.log('🎉 Migration completed successfully!\n');

    // Verify the foreign key was created
    console.log('🔍 Verifying foreign key constraint...');
    const { data: fkData, error: fkError } = await supabase
      .from('charging_points')
      .select('*, stations(*)')
      .limit(1);

    if (fkError) {
      console.log('⚠️  Foreign key verification query failed (this might be expected)');
      console.log('Please verify manually in Supabase Dashboard');
    } else {
      console.log('✅ Foreign key relationship verified!');
      console.log('Sample data:', JSON.stringify(fkData, null, 2));
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
runMigration();
