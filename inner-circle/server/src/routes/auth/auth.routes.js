const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');

// JWT configuration
const JWT_SECRET = process.env.JWT_SECRET || 'inner-circle-jwt-secret';

// Helper: hash password
const hashPassword = async (password) => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

// Helper: verify password
const verifyPassword = async (candidatePassword, hash) => {
  return await bcrypt.compare(candidatePassword, hash);
};

// Helper: generate token
const generateToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '24h' });
};

// Register
router.post('/register', async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { realName, email, password, studentId, college, dept, year, alias } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.trim().toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Check if alias already exists
    const existingAlias = await User.findOne({ alias: alias.trim() });
    if (existingAlias) {
      return res.status(400).json({ error: 'Alias already taken' });
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Generate anonymous alias if not provided
    const generatedAlias = alias || `Harmonious${Math.floor(Math.random() * 1000)}`;

    // Create user
    const user = new User({
      realName: realName.trim(),
      email: email.trim().toLowerCase(),
      passwordHash,
      studentId: studentId?.trim(),
      college: college?.trim(),
      dept: dept?.trim(),
      year: year ? Number(year) : undefined,
      alias: generatedAlias,
      role: 'student',
      consent: {
        privacy: false,
        research: false,
        ts: new Date(),
      },
    });

    await user.save();

    // Generate token
    const token = generateToken(user._id);

    // Return user profile without password
    const userResponse = user.getProfileJSON();

    res.status(201).json({ success: true, user: userResponse, token, message: 'Account created successfully. Complete onboarding to continue.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken(user._id);

    // Return user profile without password
    const userResponse = user.getProfileJSON();

    res.json({ success: true, user: userResponse, token, message: 'Logged in successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Forgot password
router.post('/forgot', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) {
      return res.json({ success: true, message: 'If an account with that email exists, password reset instructions have been sent.' });
    }
    res.json({ success: true, message: 'Password reset instructions sent to your email.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;