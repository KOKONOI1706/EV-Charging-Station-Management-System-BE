import express from 'express';
import { getActiveBenefits, calculateDiscountedPrice } from '../services/benefitsService.js';

const router = express.Router();

/**
 * GET /api/benefits/active/:userId
 * Get active package benefits for a user
 */
router.get('/active/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const benefits = await getActiveBenefits(parseInt(userId));
    
    res.json({
      success: true,
      data: benefits
    });
  } catch (error) {
    console.error('Error fetching active benefits:', error);
    res.status(500).json({
      error: 'Failed to fetch benefits',
      message: error.message
    });
  }
});

/**
 * POST /api/benefits/calculate-price
 * Calculate discounted price based on user's active benefits
 * Body: { user_id, original_price }
 */
router.post('/calculate-price', async (req, res) => {
  try {
    const { user_id, original_price } = req.body;
    
    if (!user_id || original_price === undefined) {
      return res.status(400).json({ 
        error: 'user_id and original_price are required' 
      });
    }

    const priceInfo = await calculateDiscountedPrice(parseInt(user_id), parseFloat(original_price));
    
    res.json({
      success: true,
      data: priceInfo
    });
  } catch (error) {
    console.error('Error calculating discounted price:', error);
    res.status(500).json({
      error: 'Failed to calculate price',
      message: error.message
    });
  }
});

export default router;
