/**
 * ===============================================================
 * PAYMENT MODEL (MODEL THANH TOÁN)
 * ===============================================================
 * Model tạo payment record trong database
 * 
 * Chức năng:
 * - 💳 Tạo payment record (giả lập thanh toán thành công)
 * - 💰 Lưu amount, method, status
 * - 📅 Ghi nhận timestamp
 * 
 * Method: createPayment({ user_id, method_id, amount })
 * 
 * Input:
 * - user_id: UUID của user
 * - method_id: ID phương thức thanh toán
 *   * 1: MoMo
 *   * 2: VNPay
 *   * 3: ZaloPay
 *   * 4: Cash
 * - amount: Số tiền (VND)
 * 
 * Process:
 * 1. Insert vào payments table:
 *    - user_id
 *    - method_id
 *    - amount
 *    - status: 'Completed' (giả lập success)
 *    - date: new Date()
 * 2. Return payment object
 * 
 * Output:
 * - payment_id: Auto-generated UUID
 * - user_id
 * - method_id
 * - amount
 * - status: 'Completed'
 * - date: ISO timestamp
 * 
 * Note:
 * - Đây là mock payment (status luôn = Completed)
 * - Production: Status sẽ pending → Completed sau khi nhận IPN từ payment gateway
 * 
 * Dependencies:
 * - Supabase Admin: Insert vào payments table
 */

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