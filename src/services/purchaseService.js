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
