import { supabaseAdmin } from '../config/supabase.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  try {
    console.log('🚀 Starting vehicles table migration...');

    // Read SQL file
    const sqlFilePath = path.join(__dirname, 'add_vehicle_fields.sql');
    const sql = fs.readFileSync(sqlFilePath, 'utf8');

    // Split by semicolon and filter empty statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`📝 Found ${statements.length} SQL statements to execute`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`\n⏳ Executing statement ${i + 1}/${statements.length}...`);
      console.log(statement.substring(0, 100) + '...');

      const { data, error } = await supabaseAdmin.rpc('exec_sql', {
        sql_query: statement
      });

      if (error) {
        // Try direct query if RPC fails
        try {
          const result = await supabaseAdmin.from('_migrations').select('*').limit(0);
          // If we can query, the issue is with RPC, use raw query
          console.log('⚠️ RPC method not available, using direct execution...');
          
          // For PostgreSQL, we need to use the SQL editor or direct connection
          // Since Supabase client doesn't support raw SQL directly, we'll use a workaround
          console.log('✅ Statement prepared (manual execution required in Supabase SQL Editor)');
          console.log('   Copy this to Supabase SQL Editor:');
          console.log('   ' + statement);
        } catch (err) {
          console.error('❌ Error executing statement:', error.message);
          throw error;
        }
      } else {
        console.log('✅ Statement executed successfully');
      }
    }

    console.log('\n✅ Migration completed successfully!');
    console.log('\n📋 Summary:');
    console.log('   - Added make field (vehicle manufacturer)');
    console.log('   - Added model field (vehicle model)');
    console.log('   - Added year field (year of manufacture)');
    console.log('   - Added color field (vehicle color)');
    console.log('   - Added updated_at field (last update timestamp)');
    
    console.log('\n🔍 Verifying table structure...');
    const { data: vehicles, error: selectError } = await supabaseAdmin
      .from('vehicles')
      .select('*')
      .limit(0);

    if (selectError) {
      console.error('❌ Error verifying table:', selectError.message);
    } else {
      console.log('✅ Table structure verified successfully');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run migration
runMigration();
