/**
 * ===============================================================
 * USER PACKAGE MODEL (MODEL GÓI DỊCH VỤ NGƯỜI DÙNG)
 * ===============================================================
 * Model kích hoạt gói dịch vụ cho user sau khi thanh toán
 * 
 * Chức năng:
 * - ✅ Kích hoạt gói cho user
 * - 📅 Tính start_date và end_date
 * - 💾 Lưu vào user_packages table
 * 
 * Method: createUserPackage({ user_id, payment_id, package_id, duration_days })
 * 
 * Input:
 * - user_id: UUID của user
 * - payment_id: ID payment đã hoàn thành
 * - package_id: ID gói dịch vụ (từ service_packages)
 * - duration_days: Số ngày hiệu lực (VD: 30, 90, 365)
 * 
 * Date calculation:
 * - startDate = new Date() (ngày mua)
 * - endDate = startDate + duration_days
 * - VD: Mua 30/01/2024 + 30 days = Hết hạn 29/02/2024
 * 
 * Process:
 * 1. Tính startDate và endDate
 * 2. Insert vào user_packages:
 *    - user_id
 *    - payment_id (link đến payment)
 *    - package_id (link đến service_packages)
 *    - start_date
 *    - end_date
 *    - status: 'Active'
 * 3. Return user_package object
 * 
 * Output:
 * - user_package_id: Auto-generated
 * - user_id
 * - payment_id
 * - package_id
 * - start_date: ISO timestamp
 * - end_date: ISO timestamp
 * - status: 'Active'
 * 
 * Package lifecycle:
 * - Active: Đang hiệu lực (current_date <= end_date)
 * - Expired: Hết hạn (current_date > end_date)
 * - Cancelled: Bị hủy
 * 
 * Dependencies:
 * - Supabase Admin: Insert vào user_packages table
 */

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
