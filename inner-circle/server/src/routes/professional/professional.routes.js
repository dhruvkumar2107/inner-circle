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

// Get professional directory
router.get('/', authenticateToken, async (req, res) => {
  try {
    res.json({ success: true, professionals: [
      { id: 1, name: 'Dr. Sarah Johnson', specialization: 'Clinical Psychology', available: true },
      { id: 2, name: 'Dr. Michael Chen', specialization: 'Counseling', available: true },
      { id: 3, name: 'Psychiatry Intern', specialization: 'Supervised intervention - subject to institutional approval', available: false },
    ] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get appointment slots
router.get('/:professionalId/slots', authenticateToken, async (req, res) => {
  try {
    // In a full implementation, would fetch from DB
    res.json({ success: true, slots: [] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get appointment history for a student
router.get('/:studentId/history', authenticateToken, async (req, res) => {
  try {
    // In a full implementation, would fetch from DB
    res.json({ success: true, appointments: [] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update appointment status
router.patch('/:appointmentId', authenticateToken, async (req, res) => {
  try {
    const { status, notes } = req.body;
    // In a full implementation, would update in DB
    res.json({ success: true, appointment: { id: appointmentId, status, notes }, message: 'Appointment updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  });
});

// Get review queue (for Tier 3 students)
router.get('/review-queue', authenticateToken, async (req, res) => {
  try {
    // In a full implementation, would fetch flagged interactions from DB
    res.json({ success: true, reviewQueue: [] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update review decision
router.patch('/review/:appointmentId', authenticateToken, async (req, res) => {
  try {
    const { decision, notes } = req.body;
    // In a full implementation, would update in DB with audit log
    res.json({ success: true, appointment: { id: appointmentId, decision, notes }, message: 'Review decision recorded' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  });
});

module.exports = router;