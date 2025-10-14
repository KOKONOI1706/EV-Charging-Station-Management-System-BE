import express from 'express';
import Booking from '../models/Booking.js';

const router = express.Router();

// API: Báo cáo chi phí sạc theo tháng của user
router.get('/:userId/monthly-cost', async (req, res) => {
    try {
        // Lấy tất cả booking của user
        const bookings = await Booking.find({ userId: req.params.userId });

        // Gom nhóm theo tháng và tính tổng chi phí, số lần sạc
        const report = {};
        bookings.forEach(b => {
            const month = b.createdAt.toISOString().slice(0,7); // YYYY-MM
            if (!report[month]) {
                report[month] = { totalCost: 0, totalSessions: 0 };
            }
            report[month].totalCost += b.amount || 0;
            report[month].totalSessions += 1;
        });

        res.json(report);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default Booking;