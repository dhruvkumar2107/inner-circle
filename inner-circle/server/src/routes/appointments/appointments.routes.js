const express = require('express');
const router = express.Router();
const User = require('../models/User');
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access denied. No token provided.' });
  jwt.verify(token, process.env.JWT_SECRET || 'inner-circle-jwt-secret', (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token.' });
    req.user = user;
    next();
  });
};

// Get appointments
router.get('/', authenticateToken, async (req, res) => {
  try {
    // In a full implementation, would fetch from DB
    res.json({ success: true, appointments: [] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Book appointment
router.post('/book', authenticateToken, async (req, res) => {
  try {
    const { professionalId, date, time, type, mode, notes } = req.body;

    // Validation
    if (!date || !time) {
      return res.status(400).json({ error: 'Date and time are required' });
    }

    // Check date is not in the past
    const today = new Date().toISOString().slice(0, 10);
    if (date < today) {
      return res.status(400).json({ error: 'Please choose a date that is today or later' });
    }

    // In a full implementation, would check for double-booking and save to DB
    res.json({ success: true, appointment: { id: Date.now(), professionalId, date, time, type, mode, notes, status: 'confirmed' }, message: 'Appointment booked successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Cancel appointment
router.post('/cancel', authenticateToken, async (req, res) => {
  try {
    const { appointmentId } = req.body;
    res.json({ success: true, message: 'Appointment cancelled successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get available slots
router.get('/:professionalId/slots', authenticateToken, async (req, res) => {
  try {
    // In a full implementation, would fetch from DB
    res.json({ success: true, slots: [] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;