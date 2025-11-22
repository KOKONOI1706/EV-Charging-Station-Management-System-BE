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

    // Find active package
    const { data: activePackage, error: findError } = await supabase
      .from('user_packages')
      .select('*')
      .eq('user_id', parseInt(userId))
      .eq('status', 'active')
      .gte('end_date', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (findError || !activePackage) {
      return res.status(404).json({
        success: false,
        error: 'No active package found',
        message: 'Không tìm thấy gói đang hoạt động'
      });
    }

    // Update package status to cancelled
    const { error: updateError } = await supabase
      .from('user_packages')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('user_package_id', activePackage.user_package_id);

    if (updateError) {
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
