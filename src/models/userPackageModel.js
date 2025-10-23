import { supabaseAdmin } from '../config/supabase.js';

export const createUserPackage = async ({ user_id, payment_id, package_id, duration_days }) => {
  const startDate = new Date();
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + duration_days);

  const { data, error } = await supabaseAdmin
    .from('user_packages')
    .insert([
      {
        user_id,
        payment_id,
        package_id,
        start_date: startDate,
        end_date: endDate,
        status: 'Active',
      },
    ])
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
};
