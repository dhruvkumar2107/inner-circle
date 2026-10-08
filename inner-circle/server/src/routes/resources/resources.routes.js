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
});

// Resource data (original 4 cards + additional resources)
const originalResources = [
  {
    category: 'Relaxation Guides',
    title: 'Relaxation Guides',
    description: 'Guided breathing, mindfulness scripts, and grounding routines to help you reset.',
    items: [
      { title: 'Guided breathing audio set', desc: 'Follow immersive breathing sessions curated by Inner Circle mentors.' },
      { title: 'Mindful moments journal prompts', desc: 'Download prompts that anchor your reflections in calm and gratitude.' },
    ],
    tags: ['Stress', 'Anxiety'],
    concerns: ['Stress', 'Anxiety'],
    tiers: ['Low', 'Moderate', 'High'],
    languages: ['en', 'hi', 'kn'],
  },
  {
    category: 'Music Therapy',
    title: 'Music Therapy',
    description: 'Curated soundscapes and playlists matched to mood, focus, and relaxation goals.',
    items: [
      { title: 'Lo-fi focus sessions', desc: 'Hand-picked beats to help you stay grounded while you study or create.' },
      { title: 'Sleep & unwind melodies', desc: 'Gentle ambient tracks to calm the nervous system before bedtime.' },
      { title: 'Confidence boosting affirmations', desc: 'Daily mantras voiced by therapists to reinforce self-belief.' },
    ],
    tags: ['Sleep', 'Focus'],
    concerns: ['Sleep', 'Focus'],
    tiers: ['Low', 'Moderate', 'High'],
    languages: ['en', 'hi', 'kn'],
  },
  {
    category: 'Gamified Activities',
    title: 'Gamified Activities',
    description: 'Interactive challenges that build resilience, gratitude, and emotional regulation skills.',
    items: [
      { title: 'Zen puzzle flow', desc: 'Play a calming block puzzle that encourages steady breathing and focus.' },
      { title: 'Affirmation typing quest', desc: 'Type uplifting words to guide your character through a mindful adventure.' },
      { title: 'Gratitude badge builder', desc: 'Earn digital badges by completing quick gratitude quests and reflection prompts.' },
    ],
    tags: ['Self-esteem', 'Stress'],
    concerns: ['Self-esteem', 'Stress'],
    tiers: ['Low', 'Moderate', 'High'],
    languages: ['en', 'hi', 'kn'],
  },
  {
    category: 'Mini Library',
    title: 'Mini Library',
    description: 'Short reads, printable worksheets, and expert-backed toolkits for your mental wellness journey.',
    items: [
      { title: 'How We Learn — Benedict Carey', desc: 'A friendly read about learning, memory, and finding study approaches that work for you.' },
      { title: 'Atomic Habits — James Clear', desc: 'Small, practical ideas for making helpful routines easier to begin.' },
      { title: 'Self-Compassion — Dr. Kristin Neff', desc: 'An introduction to treating yourself with the kindness you offer a friend.' },
    ],
    tags: ['Academic pressure', 'Relationships'],
    concerns: ['Academic pressure', 'Relationships'],
    tiers: ['Low', 'Moderate', 'High'],
    languages: ['en', 'hi', 'kn'],
  },
];

const additionalResources = [
  {
    category: 'Anxiety',
    title: 'Anxiety Toolkit',
    description: 'Practical strategies to manage anxiety symptoms and calm your nervous system.',
    items: [
      { title: 'Box breathing exercise', desc: '4-4-4-4 breathing pattern for immediate calm.' },
      { title: '5-4-3-2-1 grounding', desc: 'Notice 5 things you see, 4 you feel, 3 you hear, 2 you smell, 1 you taste.' },
    ],
    tags: ['Anxiety', 'Stress'],
    concerns: ['Anxiety', 'Stress'],
    tiers: ['Low', 'Moderate'],
    languages: ['en', 'hi'],
  },
  {
    category: 'Depression',
    title: 'Depression Support',
    description: 'Resources for coping with low mood and finding moments of joy.',
    items: [
      { title: 'Activity scheduling', desc: 'Gentle planner to schedule small pleasant activities daily.' },
      { title: 'Self-compassion practice', desc: 'Guided exercise to treat yourself with kindness.' },
    ],
    tags: ['Depression', 'Low mood'],
    concerns: ['Depression', 'Low mood'],
    tiers: ['Moderate', 'High'],
    languages: ['en', 'hi', 'kn'],
  },
  {
    category: 'Stress',
    title: 'Stress Management',
    description: 'Techniques to reduce and manage stress in academic and personal life.',
    items: [
      { title: 'Progressive muscle relaxation', desc: 'Tense and release muscle groups to reduce physical tension.' },
      { title: 'Study-break timer', desc: 'Pomodoro-style timer with stretching reminders.' },
    ],
    tags: ['Stress', 'Academic pressure'],
    concerns: ['Stress', 'Academic pressure'],
    tiers: ['Low', 'Moderate'],
    languages: ['en', 'hi'],
  },
  {
    category: 'Academic Pressure',
    title: 'Study Skills',
    description: 'Effective study techniques and time management strategies.',
    items: [
      { title: 'Active recall guide', desc: 'How to use active recall for more effective learning.' },
      { title: 'Time management matrix', desc: 'Eisenhower matrix for prioritizing tasks.' },
    ],
    tags: ['Academic pressure', 'Study'],
    concerns: ['Academic pressure'],
    tiers: ['Low', 'Moderate'],
    languages: ['en'],
  },
  {
    category: 'Relationships',
    title: 'Relationship Guide',
    description: 'Navigating friendships, roommate dynamics, and romantic relationships.',
    items: [
      { title: 'Communication skills', desc: 'Assertive communication techniques.' },
      { title: 'Setting boundaries', desc: 'How to set and maintain healthy boundaries.' },
    ],
    tags: ['Relationships', 'Social'],
    concerns: ['Relationships'],
    tiers: ['Low', 'Moderate'],
    languages: ['en', 'hi'],
  },
  {
    category: 'Sleep',
    title: 'Sleep Hygiene',
    description: 'Improve your sleep quality with evidence-based practices.',
    items: [
      { title: 'Wind-down routine', desc: 'Step-by-step guide to a relaxing pre-bed routine.' },
      { title: 'Sleep environment audit', desc: 'Checklist for optimizing your sleep space.' },
    ],
    tags: ['Sleep', 'Insomnia'],
    concerns: ['Sleep'],
    tiers: ['Low', 'Moderate'],
    languages: ['en'],
  },
  {
    category: 'Self-esteem',
    title: 'Self-Esteem Booster',
    description: 'Activities and reflections to build self-worth and confidence.',
    items: [
      { title: 'Strengths identification', desc: 'Exercise to identify your personal strengths.' },
      { title: 'Positive affirmations', desc: 'Daily mantra practice for confidence building.' },
    ],
    tags: ['Self-esteem', 'Confidence'],
    concerns: ['Self-esteem'],
    tiers: ['Low', 'Moderate'],
    languages: ['en', 'hi'],
  },
  {
    category: 'Exam Stress',
    title: 'Exam Stress Support',
    description: 'Resources specifically for exam preparation and test anxiety.',
    items: [
      { title: 'Exam preparation checklist', desc: 'Everything you need to prepare for exams.' },
      { title: 'Test anxiety breathing', desc: 'Targeted breathing for exam situations.' },
    ],
    tags: ['Exam stress', 'Anxiety'],
    concerns: ['Exam stress', 'Anxiety'],
    tiers: ['Low', 'Moderate'],
    languages: ['en'],
  },
];

// Get all resources
router.get('/', authenticateToken, async (req, res) => {
  try {
    res.json({ success: true, resources: [...originalResources, ...additionalResources] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get resources by concern
router.get('/concern/:concern', authenticateToken, async (req, res) => {
  try {
    const { concern } = req.params;
    const filtered = [...originalResources, ...additionalResources].filter(r => r.concerns.includes(concern));
    res.json({ success: true, resources: filtered });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get recommended resources
router.get('/recommended', authenticateToken, async (req, res) => {
  try {
    // In a full implementation, would use the recommendation engine
    res.json({ success: true, recommendations: [] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get saved resources
router.get('/saved', authenticateToken, async (req, res) => {
  try {
    res.json({ success: true, saved: [] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;