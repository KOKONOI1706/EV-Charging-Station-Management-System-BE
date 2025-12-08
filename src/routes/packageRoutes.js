/**
 * ===============================================================
 * PACKAGE ROUTES (BACKEND)
 * ===============================================================
 * Express routes CRUD cho service packages
 * 
 * Endpoints:
 * - GET /api/packages - Lấy tất cả packages
 * - GET /api/packages/:id - Lấy package theo ID
 * - POST /api/packages - Tạo package mới
 * - PUT /api/packages/:id - Cập nhật package
 * - DELETE /api/packages/:id - Xóa package
 * 
 * Methods:
 * 1. GET /:
 *    - PackageController.getAll()
 *    - Return: Array of packages
 * 
 * 2. GET /:id:
 *    - PackageController.getById(id)
 *    - Return: Single package hoặc 404
 * 
 * 3. POST /:
 *    - Body: { name, description, price, duration_days, benefits, status }
 *    - PackageController.create(body)
 *    - Return: Created package (201)
 * 
 * 4. PUT /:id:
 *    - Body: Updated fields
 *    - PackageController.update(id, body)
 *    - Return: Updated package
 * 
 * 5. DELETE /:id:
 *    - PackageController.delete(id)
 *    - Return: Deleted package
 * 
 * Dependencies:
 * - PackageController: Business logic
 */

import express from "express";
import { PackageController } from "../models/packageController.js";
import supabase from '../supabase/client.js';

const router = express.Router();

router.get("/", PackageController.getAll);
router.get("/:id", PackageController.getById);
router.post("/", PackageController.create);
router.put("/:id", PackageController.update);
router.delete("/:id", PackageController.delete);

// POST /api/packages/cancel/:userId - Cancel active package for user
router.post("/cancel/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'Missing userId parameter'
      });
    }

    // Find active package (remove .single() to avoid error if not found)
    const { data: packages, error: findError } = await supabase
      .from('user_packages')
      .select('*')
      .eq('user_id', parseInt(userId))
      .eq('status', 'active')
      .gte('end_date', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1);

    if (findError) {
      console.error('Error finding package:', findError);
      throw findError;
    }

    if (!packages || packages.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No active package found',
        message: 'Không tìm thấy gói đang hoạt động'
      });
    }

    const activePackage = packages[0];

    // Update package status to cancelled
    const { error: updateError } = await supabase
      .from('user_packages')
      .update({
        status: 'cancelled'
      })
      .eq('user_package_id', activePackage.user_package_id);

    if (updateError) {
      console.error('Error updating package:', updateError);
      throw updateError;
    }

    res.json({
      success: true,
      message: 'Đã hủy gói thành công',
      data: {
        user_package_id: activePackage.user_package_id,
        package_id: activePackage.package_id,
        cancelled_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error cancelling package:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cancel package',
      message: error.message
    });
  }
});

export default router;
