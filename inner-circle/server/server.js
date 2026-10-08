/* Inner Circle v2 Server - Full End-to-End Implementation */
"use strict";

require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const helmet = require('helmet');
const cors = require('cors');
const bodyParser = require('body-parser');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173', credentials: true }));
app.use(mongoSanitize());
app.use(xss());
app.use(hpp({ whitelist: [] }));

// Body parsing
app.use(bodyParser.json({ limit: '10kb' }));
app.use(bodyParser.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100, message: 'Too many requests from this IP, please try again later.' });
app.use('/api/', limiter);

// ============================================
// ROUTES
// ============================================

// Auth routes
app.use('/api/auth', require('./src/routes/auth/auth.routes'));

// Screening routes
app.use('/api/screening', require('./src/routes/screening/screening.routes'));

// Chat routes
app.use('/api/chat', require('./src/routes/chat/chat.routes'));

// Appointment routes
app.use('/api/appointments', require('./src/routes/appointments/appointments.routes'));

// Resource routes
app.use('/api/resources', require('./src/routes/resources/resources.routes'));

// Professional routes
app.use('/api/professional', require('./src/routes/professional/professional.routes'));

// Admin routes
app.use('/api/admin', require('./src/routes/admin/admin.routes'));

// ============================================
// DATABASE CONNECTION
// ============================================

const port = process.env.PORT || 4000;

;(async () => {
  try {
    await mongoose.connect('mongodb+srv://ridhigolchha23_db_user:<db_password>@cluster0.jyev14c.mongodb.net/?appName=Cluster0');
    console.info('Connected to MongoDB Atlas');
  } catch (e) {
    console.error('MongoDB connection error:', e.message.substring(0, 200));
  }
})();

app.listen(port, () => console.info(`Inner Circle API listening on http://localhost:${port}`));
console.info('Inner Circle v2 Server Started');