/**
 * ===============================================================
 * PURCHASE ROUTES (BACKEND)
 * ===============================================================
 * Express route xử lý mua gói dịch vụ
 * 
 * Endpoint:
 * - POST /api/purchase - Mua gói dịch vụ
 * 
 * Request body:
 * - user_id: UUID của user mua gói
 * - package_id: ID gói dịch vụ
 * - method_id: Phương thức thanh toán (1=MoMo, 2=VNPay, etc.)
 * 
 * Process:
 * 1. Validate input (user_id, package_id, method_id required)
 * 2. Gọi purchasePackage service:
 *    a. Tạo payment (giả lập success)
 *    b. Kích hoạt gói cho user
 * 3. Return: { message, payment, userPackage }
 * 
 * Response:
 * ```json
 * {
 *   "message": "Mua gói thành công!",
 *   "payment": { payment_id, amount, status },
 *   "userPackage": { user_package_id, start_date, end_date, status }
 * }
 * ```
 * 
 * Error handling:
 * - 400: Thiếu thông tin (missing fields)
 * - 500: Lỗi service (payment/activation failed)
 * 
 * Dependencies:
 * - purchaseService: Xử lý flow mua gói
 */

import express from 'express';
import { purchasePackage } from '../services/purchaseService.js';

const router = express.Router();

// POST /api/purchase
router.post('/', async (req, res) => {
  try {
    const { user_id, package_id, method_id } = req.body;

    if (!user_id || !package_id || !method_id)
      return res.status(400).json({ error: 'Thiếu thông tin mua gói.' });

    const result = await purchasePackage(user_id, package_id, method_id);
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
