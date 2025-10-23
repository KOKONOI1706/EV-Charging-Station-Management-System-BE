import { supabaseAdmin } from '../config/supabase.js';

export const createPayment = async ({ user_id, method_id, amount }) => {
  const { data, error } = await supabaseAdmin
    .from('payments')
    .insert([
      {
        user_id,
        method_id,
        amount,
        status: 'Completed', // Giả lập thanh toán thành công
        date: new Date(),
      },
    ])
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
};