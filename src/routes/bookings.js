import express from 'express';

const router = express.Router();

// Mock data for bookings
const mockBookings = [];

// GET /api/bookings - Get all bookings for a user
router.get('/', (req, res) => {
  try {
    const { userId } = req.query;
    let bookings = mockBookings;
    
    if (userId) {
      bookings = mockBookings.filter(b => b.userId === userId);
    }
    
    res.json({
      success: true,
      data: bookings,
      total: bookings.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch bookings',
      message: error.message
    });
  }
});

// POST /api/bookings - Create new booking
router.post('/', (req, res) => {
  try {
    const newBooking = {
      id: `booking_${Date.now()}`,
      ...req.body,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    mockBookings.push(newBooking);
    
    res.status(201).json({
      success: true,
      data: newBooking,
      message: 'Booking created successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to create booking',
      message: error.message
    });
  }
});

// PUT /api/bookings/:id - Update booking status
router.put('/:id', (req, res) => {
  try {
    const bookingIndex = mockBookings.findIndex(b => b.id === req.params.id);
    if (bookingIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }
    
    mockBookings[bookingIndex] = {
      ...mockBookings[bookingIndex],
      ...req.body,
      updatedAt: new Date().toISOString()
    };
    
    res.json({
      success: true,
      data: mockBookings[bookingIndex],
      message: 'Booking updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to update booking',
      message: error.message
    });
  }
});

// DELETE /api/bookings/:id - Cancel booking
router.delete('/:id', (req, res) => {
  try {
    const bookingIndex = mockBookings.findIndex(b => b.id === req.params.id);
    if (bookingIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }
    
    mockBookings.splice(bookingIndex, 1);
    
    res.json({
      success: true,
      message: 'Booking cancelled successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to cancel booking',
      message: error.message
    });
  }
});

export default router;