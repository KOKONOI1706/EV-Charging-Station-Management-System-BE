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
