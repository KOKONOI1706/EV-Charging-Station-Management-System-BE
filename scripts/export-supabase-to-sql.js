/**
 * Export Supabase Database to SQL file
 * 
 * Usage: node scripts/export-supabase-to-sql.js
 * 
 * This script will:
 * 1. Connect to your Supabase database
 * 2. Export all table schemas (CREATE TABLE statements)
 * 3. Export all data (INSERT statements)
 * 4. Save to backup.sql file
 */

import { supabaseAdmin } from '../src/config/supabase.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// List of tables to export (add your tables here)
const TABLES = [
  'roles',
  'users',
  'stations',
  'charging_points',
  'vehicles',
  'bookings',
  'charging_sessions',
  'payments',
  'user_packages',
  'services_packages',
  'invoices',
  'promotions',
  'reviews',
  'notifications',
  // Add more tables as needed
];

async function exportDatabase() {
  console.log('🚀 Starting Supabase export...\n');
  
  let sqlContent = `-- Supabase Database Backup
-- Generated: ${new Date().toISOString()}
-- 
-- To restore:
-- 1. Create a new PostgreSQL database
-- 2. Run: psql -U postgres -d your_database < backup.sql
--\n\n`;

  sqlContent += `-- Disable triggers and constraints during import
SET session_replication_role = 'replica';\n\n`;

  for (const tableName of TABLES) {
    console.log(`📦 Exporting table: ${tableName}`);
    
    try {
      // Get table structure
      const { data: schemaData, error: schemaError } = await supabaseAdmin
        .rpc('get_table_schema', { table_name: tableName })
        .single();

      if (schemaError) {
        console.log(`⚠️  Could not get schema for ${tableName}, trying data export only...`);
      }

      // Get all data from table
      const { data, error } = await supabaseAdmin
        .from(tableName)
        .select('*')
        .order('created_at', { ascending: true });

      if (error) {
        console.error(`❌ Error exporting ${tableName}:`, error.message);
        continue;
      }

      if (!data || data.length === 0) {
        console.log(`   ⚠️  Table ${tableName} is empty, skipping...`);
        sqlContent += `-- Table ${tableName} is empty\n\n`;
        continue;
      }

      console.log(`   ✅ Found ${data.length} rows`);

      // Generate CREATE TABLE statement (simplified)
      sqlContent += `-- Table: ${tableName}\n`;
      sqlContent += `-- (You need to create table schema manually or use pg_dump for full schema)\n\n`;

      // Generate INSERT statements
      const columns = Object.keys(data[0]);
      
      for (const row of data) {
        const values = columns.map(col => {
          const val = row[col];
          if (val === null) return 'NULL';
          if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
          if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
          if (val instanceof Date) return `'${val.toISOString()}'`;
          if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
          return val;
        });

        sqlContent += `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${values.join(', ')});\n`;
      }

      sqlContent += '\n';
      console.log(`   ✅ Exported ${data.length} rows\n`);

    } catch (err) {
      console.error(`❌ Error processing ${tableName}:`, err.message);
    }
  }

  sqlContent += `-- Re-enable triggers and constraints
SET session_replication_role = 'origin';\n\n`;

  sqlContent += `-- Update sequences (adjust as needed)
-- SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));
-- SELECT setval('stations_id_seq', (SELECT MAX(id) FROM stations));
-- Add more sequence updates as needed\n\n`;

  // Save to file
  const backupPath = path.join(__dirname, '..', 'backup.sql');
  fs.writeFileSync(backupPath, sqlContent, 'utf8');
  
  console.log('✅ Export completed!');
  console.log(`📁 Backup saved to: ${backupPath}`);
  console.log(`📊 File size: ${(fs.statSync(backupPath).size / 1024).toFixed(2)} KB\n`);
}

// Run export
exportDatabase().catch(err => {
  console.error('❌ Export failed:', err);
  process.exit(1);
});
