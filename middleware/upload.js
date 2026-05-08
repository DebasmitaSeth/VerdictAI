/* middleware/upload.js ────────────────────────────────────── */
'use strict';

const multer = require('multer');
const path   = require('path');
const fs     = require('fs');
require('dotenv').config();

const UPLOAD_DIR    = path.resolve(process.env.UPLOAD_DIR || 'uploads');
const MAX_SIZE_MB   = parseInt(process.env.MAX_FILE_SIZE_MB, 10) || 20;
const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/tiff'];

/* Ensure directory exists */
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ts     = Date.now();
    const safe   = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    const unique = `${ts}_${safe}`;
    cb(null, unique);
  },
});

function fileFilter(_req, file, cb) {
  if (ALLOWED_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(Object.assign(new Error('Only PDF and image files are allowed.'), { status: 415 }));
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_SIZE_MB * 1024 * 1024 },
});

module.exports = { upload, UPLOAD_DIR };