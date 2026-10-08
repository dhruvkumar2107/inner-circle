const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Auth middleware
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

// Crisis phrases database
const CRISIS_PHRASES = {
  english: ['suicide', 'kill myself', 'end my life', 'hurt myself', 'die', 'death', 'self-harm', 'cutting', 'overdose'],
  hindi: ['suicide', 'marna', 'maar dena', 'atma-hatya'],
  kannada: ['suicide', 'marana', 'ghataka', 'atma-hathya'],
  transliterated: ['suicid', 'kill myself', 'end my life', 'hurt myself', 'aatma hatya', 'maar dena']
};

const checkCrisisLanguage = (message) => {
  const normalized = message.normalize('NFD').replace(/\u0300-\u036f/g, '').toLowerCase();
  const detected = [];

  for (const phrase of CRISIS_PHRASES.english) {
    if (normalized.includes(phrase)) detected.push({ language: 'english', phrase });
  }
  for (const phrase of CRISIS_PHRASES.hindi) {
    if (normalized.includes(phrase)) detected.push({ language: 'hindi', phrase });
  }
  for (const phrase of CRISIS_PHRASES.kannada) {
    if (normalized.includes(phrase)) detected.push({ language: 'kannada', phrase });
  }
  for (const phrase of CRISIS_PHRASES.transliterated) {
    if (normalized.includes(phrase)) detected.push({ language: 'transliterated', phrase });
  }

  if (detected.length === 0) return { isCrisis: false, type: 'none', detectedPhrase: null, severity: 'low' };

  const highSeverity = ['suicide', 'overdose', 'self-harm'];
  const mediumSeverity = ['cannot go on', 'marna', 'maar dena'];
  const hasHigh = detected.some(d => highSeverity.includes(d.phrase));
  const hasMedium = detected.some(d => mediumSeverity.includes(d.phrase));
  const severity = hasHigh ? 'high' : hasMedium ? 'medium' : 'low';
  const type = hasHigh ? 'self-harm' : 'crisis-language';

  return { isCrisis: true, type, detectedPhrase: detected[0]?.phrase, severity, language: detected[0]?.language || 'none' };
};

const generateCrisisResponse = () => {
  return 'I am hearing that you are going through a very difficult time. Please know that you do not have to face this alone. Contact Tele-MANAS at 14416 or emergency services at 112.';
};

// Send message
router.post('/send', authenticateToken, async (req, res) => {
  try {
    const { message } = req.body;
    const crisisCheck = checkCrisisLanguage(message);

    let reply;
    if (crisisCheck.isCrisis) {
      reply = generateCrisisResponse();
    } else {
      // Simple rule-based response
      const lower = message.toLowerCase();
      if (/anxious|worry|overwhelm/.test(lower)) {
        reply = 'It sounds like a lot is asking for your attention right now. We can take this one small moment at a time. Try a grounding pause: name 5 things you can see, 4 things you can feel, 3 sounds you can hear.';
      } else if /sleep/.test(lower) {
        reply = 'A busy mind can make rest feel far away. Try a slow exhale that is a little longer than your inhale. What has your evenings been like lately?';
      } else {
        reply = 'Thank you for sharing that with me. I am here to support you. What else is on your mind?';
      }
    }

    res.json({ success: true, reply, crisis: crisisCheck, message });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get chat history
router.get('/history', authenticateToken, async (req, res) => {
  try {
    res.json({ success: true, messages: [] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;