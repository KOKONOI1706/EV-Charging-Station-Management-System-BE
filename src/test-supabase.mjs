import { supabaseAdmin } from './config/supabase.js';

async function run() {
  try {
    console.log('Testing Supabase admin client connectivity...');

    const { data: roles, error: roleError } = await supabaseAdmin
      .from('roles')
      .select('*')
      .limit(1);

    if (roleError) {
      console.error('Role fetch error:', roleError);
    } else {
      console.log('Roles fetched:', roles);
    }

    // Attempt a minimal insert (will create a row) to test insert permissions
    const testEmail = `copilot-test-${Date.now()}@example.com`;
    console.log('Attempting test insert with email:', testEmail);

    const { data: insertData, error: insertError } = await supabaseAdmin
      .from('users')
      .insert([
        {
          name: 'Supabase Test',
          email: testEmail,
          phone: null,
          role_id: roles?.[0]?.role_id || 1,
          is_active: true
        }
      ])
      .select('*');

    if (insertError) {
      console.error('Insert error:', insertError);
    } else {
      console.log('Insert succeeded:', insertData);
    }
  } catch (err) {
    console.error('Unexpected error during Supabase test:', err);
  }
}

run().then(() => process.exit(0));
