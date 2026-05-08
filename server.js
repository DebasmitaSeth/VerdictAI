/* server.js ──────────────────────────────────────────────────
   VerdictAI · AI Judgment Intelligence Platform
   Express entry point — middleware, routes, error handling
─────────────────────────────────────────────────────────── */
'use strict';

require('dotenv').config();

const express      = require('express');
const helmet       = require('helmet');
const cors         = require('cors');
const morgan       = require('morgan');
const rateLimit    = require('express-rate-limit');
const path         = require('path');

const { connectDB }   = require('./config/db');
const { notFound, globalError } = require('./middleware/errorHandler');

/* ── Route modules ─────────────────────────────────────── */
const authRouter         = require('./routes/auth');
const casesRouter        = require('./routes/cases');
const uploadRouter       = require('./routes/upload');
const extractionRouter   = require('./routes/extraction');
const actionplanRouter   = require('./routes/actionplan');
const verificationRouter = require('./routes/verification');
const verifiedRouter     = require('./routes/verified');
const adminRouter        = require('./routes/admin');

const app  = express();
const PORT = process.env.PORT || 5000;

/* ══════════════════════════════════════════════════════════
   1. SECURITY MIDDLEWARE
══════════════════════════════════════════════════════════ */
app.use(helmet({
  // Allow serving uploaded PDFs inline
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

app.use(cors({
  origin:      process.env.CLIENT_ORIGIN || 'http://localhost:3000',
  credentials: true,
  methods:     ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

/* ══════════════════════════════════════════════════════════
   2. RATE LIMITING
══════════════════════════════════════════════════════════ */

// Strict limit on auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,   // 15 minutes
  max:      20,
  message:  { success: false, message: 'Too many auth attempts. Try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders:   false,
});

// General API limit
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,   // 1 minute
  max:      200,
  message:  { success: false, message: 'Too many requests. Please slow down.' },
});

/* ══════════════════════════════════════════════════════════
   3. BODY PARSING & LOGGING
══════════════════════════════════════════════════════════ */
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

/* ══════════════════════════════════════════════════════════
   4. STATIC FILES
   Serve uploaded PDFs for the in-app document viewer
══════════════════════════════════════════════════════════ */
app.use('/uploads', express.static(path.resolve(process.env.UPLOAD_DIR || 'uploads')));

/* ══════════════════════════════════════════════════════════
   5. ROUTES
══════════════════════════════════════════════════════════ */
app.get('/api/health', (_req, res) => {
  res.json({ success: true, status: 'ok', timestamp: new Date().toISOString(), service: 'CCMS API' });
});

app.use('/api/auth',         authLimiter, authRouter);
app.use('/api/cases',        apiLimiter, casesRouter);
app.use('/api/upload',       apiLimiter, uploadRouter);
app.use('/api/extraction',   apiLimiter, extractionRouter);
app.use('/api/actionplan',   apiLimiter, actionplanRouter);
app.use('/api/verification', apiLimiter, verificationRouter);
app.use('/api/verified',     apiLimiter, verifiedRouter);
app.use('/api/admin',        apiLimiter, adminRouter);

/* ══════════════════════════════════════════════════════════
   6. ERROR HANDLING
══════════════════════════════════════════════════════════ */
app.use(notFound);
app.use(globalError);

/* ══════════════════════════════════════════════════════════
   7. START
══════════════════════════════════════════════════════════ */
async function start() {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`\n🚀  CCMS API running on http://localhost:${PORT}`);
    console.log(`🌍  Environment : ${process.env.NODE_ENV || 'development'}`);
    console.log(`📁  Uploads dir  : ${path.resolve(process.env.UPLOAD_DIR || 'uploads')}`);
    console.log(`\n📡  Endpoints:`);
    console.log(`    POST   /api/auth/signin`);
    console.log(`    POST   /api/auth/signup`);
    console.log(`    GET    /api/cases`);
    console.log(`    POST   /api/upload/judgment`);
    console.log(`    GET    /api/extraction/:caseId`);
    console.log(`    GET    /api/actionplan/:caseId`);
    console.log(`    GET    /api/verification/queue`);
    console.log(`    POST   /api/verification/queue/:id/approve`);
    console.log(`    GET    /api/verified`);
    console.log(`    GET    /api/health\n`);
  });
}

start().catch(err => {
  console.error('❌  Server failed to start:', err);
  process.exit(1);
});

module.exports = app;   // export for testing