import express from 'express';
import * as Booking from '../models/Booking.js';

const router = express.Router();

// API: Lấy lịch sử sạc của user
router.get('/:userId/history', async (req, res) => {
    try {
        const bookings = await Booking.find({ userId: req.params.userId }).sort({ createdAt: -1 });
        res.json(bookings);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;