/**
 * Simple Export Script - Export data from Supabase without schema
 * 
 * Usage: node scripts/simple-export.js
 */

import { supabaseAdmin } from '../src/config/supabase.js';
import fs from 'fs';

const TABLES = [
  'users',
  'stations', 
  'charging_points',
  'vehicles',
  'bookings',
  'charging_sessions',
  'payments',
  'services_packages',
  'user_packages'
];

async function simpleExport() {
  console.log('🚀 Starting simple export...\n');
  
  const results = {};
  
  for (const table of TABLES) {
    console.log(`📦 Exporting ${table}...`);
    
    const { data, error } = await supabaseAdmin
      .from(table)
      .select('*');
    
    if (error) {
      console.error(`❌ Error: ${error.message}`);
      results[table] = { error: error.message };
    } else {
      console.log(`   ✅ ${data?.length || 0} rows`);
      results[table] = data;
    }
  }
  
  // Save as JSON
  fs.writeFileSync('backup.json', JSON.stringify(results, null, 2));
  console.log('\n✅ Saved to backup.json');
  
  // Generate SQL INSERT statements
  let sql = '-- Simple SQL Backup\n\n';
  
  for (const [table, data] of Object.entries(results)) {
    if (data.error || !Array.isArray(data) || data.length === 0) continue;
    
    sql += `-- Table: ${table}\n`;
    
    const columns = Object.keys(data[0]);
    
    for (const row of data) {
      const values = columns.map(col => {
        const val = row[col];
        if (val === null) return 'NULL';
        if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
        if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
        if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
        return val;
      });
      
      sql += `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${values.join(', ')});\n`;
    }
    
    sql += '\n';
  }
  
  fs.writeFileSync('backup.sql', sql);
  console.log('✅ Saved to backup.sql\n');
}

simpleExport().catch(console.error);
