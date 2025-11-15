import { supabaseAdmin } from '../config/supabase.js';

async function test() {
  try {
    console.log('Testing Supabase connection using supabaseAdmin...');

    // Try a few simple queries to confirm connectivity and schema access
    const tablesToCheck = ['stations', 'charging_sessions', 'payments', 'users'];

    for (const tbl of tablesToCheck) {
      try {
        const { data, error } = await supabaseAdmin
          .from(tbl)
          .select('*')
          .limit(3);

        if (error) {
          console.error(`Table: ${tbl} -> ERROR:`, error.message || error);
        } else {
          console.log(`Table: ${tbl} -> rows:`, Array.isArray(data) ? data.length : data ? 1 : 0);
        }
      } catch (innerErr) {
        console.error(`Table: ${tbl} -> Exception:`, innerErr.message || innerErr);
      }
    }

    console.log('Supabase check complete.');
  } catch (err) {
    console.error('Unexpected error while testing Supabase:', err.message || err);
    process.exit(1);
  }
}

test();
