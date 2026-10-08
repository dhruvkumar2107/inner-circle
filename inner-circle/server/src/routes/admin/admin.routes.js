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

// Get analytics
router.get('/analytics', authenticateToken, async (req, res) => {
  try {
    // In a full implementation, would fetch aggregated data from DB with k-anonymity (min cell size 5)
    res.json({ success: true, analytics: {
      totalStudents: 0,
      assessmentsCompleted: 0,
      riskDistribution: { Low: 0, Moderate: 0, High: 0 },
      weeklyTrends: [],
      mostCommonConcerns: [],
      resourceUsage: 0,
      appointmentStatistics: { total: 0, booked: 0, completed: 0, cancelled: 0 },
      peerSupportActivity: { roomsActive: 0, posts: 0 },
    } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all users (aggregated/anonymized)
router.get('/users', authenticateToken, async (req, res) => {
  try {
    // In a full implementation, would return aggregated data only, with min cell size 5
    res.json({ success: true, users: [] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get audit logs
router.get('/audit-logs', authenticateToken, async (req, res) => {
  try {
    // In a full implementation, would fetch audit logs from DB with filters
    res.json({ success: true, auditLogs: [] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// CSV export of aggregates
router.get('/export', authenticateToken, async (req, res) => {
  try {
    // In a full implementation, would export CSV from DB aggregates
    res.json({ success: true, csv: '' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// CMS: Edit resource
router.put('/resources/:resourceId', authenticateToken, async (req, res) => {
  try {
    // In a full implementation, would update resource in DB with audit log
    res.json({ success: true, resource: { id: req.params.resourceId, ...req.body }, message: 'Resource updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Crisis resources editor
router.put('/crisis-resources', authenticateToken, async (req, res) => {
  try {
    // In a full implementation, would update crisis resources in DB with audit log
    res.json({ success: true, message: 'Crisis resources updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get fuzzy config (read-only)
router.get('/fuzzy-config', authenticateToken, async (req, res) => {
  try {
    // In a full implementation, would read from config file with versioning
    res.json({ success: true, fuzzyConfig: { version: '1.0', sets: {}, rules: {} } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Audit log viewer
router.get('/audit-logs', authenticateToken, async (req, res) => {
  try {
    // In a full implementation, would fetch from DB with filters and min cell size
    res.json({ success: true, auditLogs: [] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;