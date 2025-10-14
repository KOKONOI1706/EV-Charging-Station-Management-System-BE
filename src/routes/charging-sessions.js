import express from 'express';
import Booking from '../models/Booking.js';

const router = express.Router();

// API: Lấy danh sách phiên sạc của user
router.get('/:userId', async (req, res) => {
    try {
        const sessions = await Booking.getByUserId(req.params.userId);
        res.json(sessions);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;