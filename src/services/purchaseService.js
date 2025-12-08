/**
 * ===============================================================
 * PURCHASE SERVICE (DỊCH VỤ MUA GÓI)
 * ===============================================================
 * Service xử lý flow mua gói dịch vụ (payment + activation)
 * 
 * Chức năng:
 * - 💳 Tạo payment (giả lập thanh toán thành công)
 * - ✅ Kích hoạt gói cho user
 * - 🔗 Link payment với user_package
 * 
 * Method: purchasePackage(user_id, package_id, method_id)
 * 
 * Input:
 * - user_id: UUID của user
 * - package_id: ID gói muốn mua
 * - method_id: Phương thức thanh toán (1=MoMo, 2=VNPay, etc.)
 * 
 * Flow:
 * 1. Lấy thông tin gói:
 *    - Query service_packages.price, duration_days
 *    - Validate gói tồn tại
 * 
 * 2. Tạo payment:
 *    - Gọi createPayment({ user_id, method_id, amount: price })
 *    - Nhận payment_id
 * 
 * 3. Kích hoạt gói:
 *    - Gọi createUserPackage({
 *        user_id,
 *        payment_id,
 *        package_id,
 *        duration_days
 *      })
 *    - Nhận user_package object
 * 
 * 4. Return:
 *    - message: "Mua gói thành công!"
 *    - payment: Payment object
 *    - userPackage: User package object
 * 
 * Output:
 * ```json
 * {
 *   "message": "Mua gói thành công!",
 *   "payment": {
 *     "payment_id": "uuid",
 *     "amount": 100000,
 *     "status": "Completed"
 *   },
 *   "userPackage": {
 *     "user_package_id": "uuid",
 *     "start_date": "2024-01-30",
 *     "end_date": "2024-02-29",
 *     "status": "Active"
 *   }
 * }
 * ```
 * 
 * Error handling:
 * - Gói không tồn tại: throw "Không tìm thấy gói."
 * - Payment failed: throw error từ createPayment
 * - Activation failed: throw error từ createUserPackage
 * 
 * Note:
 * - Hiện tại là mock payment (luôn success)
 * - Production: Phải chờ IPN callback từ gateway trước khi activate
 * 
 * Dependencies:
 * - paymentModel.createPayment: Tạo payment
 * - userPackageModel.createUserPackage: Kích hoạt gói
 * - Supabase Admin: Query service_packages
 */

import { createPayment } from '../models/paymentModel.js';
import { createUserPackage } from '../models/userPackageModel.js';
import { supabaseAdmin } from '../config/supabase.js';

export const purchasePackage = async (user_id, package_id, method_id) => {
  // Lấy thông tin gói để biết giá và thời hạn
  const { data: packageData, error: packageError } = await supabaseAdmin
    .from('service_packages')
    .select('package_id, price, duration_days')
    .eq('package_id', package_id)
    .single();

  if (packageError || !packageData) throw new Error('Không tìm thấy gói.');

  // 1️⃣ Tạo thanh toán giả lập thành công
  const payment = await createPayment({
    user_id,
    method_id,
    amount: packageData.price,
  });

  // 2️⃣ Kích hoạt gói cho người dùng
  const userPackage = await createUserPackage({
    user_id,
    payment_id: payment.payment_id,
    package_id: packageData.package_id,
    duration_days: packageData.duration_days,
  });

  return {
    message: 'Mua gói thành công!',
    payment,
    userPackage,
  };
};
