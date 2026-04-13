// middleware/upload.js - Multer + S3 upload configuration
const multer = require('multer');
const multerS3 = require('multer-s3');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const s3Client = require('../config/s3');

// ─── Tier-based MIME type mapping ──────────────────────────────────────────────
const TIER_MIMETYPES = {
  lite: [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf', 'text/plain', 'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ],
  plus: [
    'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/midi', 'audio/x-midi', 'audio/webm',
    'audio/aac', 'audio/flac'
  ],
  pro: [
    'video/mp4', 'video/mpeg', 'video/ogg', 'video/webm', 'video/quicktime',
    'video/x-msvideo', 'video/x-flv'
  ]
};

// ─── File filter: validate type based on user tier ──────────────────────────────
const fileFilter = (req, file, cb) => {
  // Ensure req.user exists (set by protect middleware)
  if (!req.user) {
    return cb(new Error('Authentication required for upload.'), false);
  }

  const userTier = req.user.tier || 'lite';
  const userRole = req.user.role || 'member';
  
  // Lite includes basic files
  const allowedLite = TIER_MIMETYPES.lite;
  // Plus includes Lite + Audio
  const allowedPlus = [...allowedLite, ...TIER_MIMETYPES.plus];
  // Pro includes everything
  const allowedPro = [...allowedPlus, ...TIER_MIMETYPES.pro];

  let isAllowed = false;
  let requiredTier = 'Nest Lite';

  if (allowedLite.includes(file.mimetype)) {
    isAllowed = true;
  } else if (allowedPlus.includes(file.mimetype)) {
    isAllowed = userTier === 'plus' || userTier === 'pro';
    requiredTier = 'Nest Plus';
  } else if (allowedPro.includes(file.mimetype)) {
    isAllowed = userTier === 'pro';
    requiredTier = 'Nest Pro';
  } else {
    return cb(new Error('Unsupported file format. Please use standard Images, PDF, Audio, or Video.'), false);
  }

  if (isAllowed) {
    cb(null, true);
  } else {
    console.log(`[Tier Enforcement] ${userRole.toUpperCase()} upload blocked for ${file.mimetype}. Required tier: ${requiredTier}`);
    cb(new Error(`UPGRADE_REQUIRED:${requiredTier}`), false);
  }
};

// ─── Multer-S3 storage engine ──────────────────────────────────────────────────
const storage = multerS3({
  s3: s3Client,
  bucket: process.env.AWS_BUCKET_NAME,
  // NOTE: ACL removed — "Bucket owner enforced" Object Ownership disables ACLs.
  // Make sure your S3 bucket has public access enabled via Bucket Policy instead.
  contentType: multerS3.AUTO_CONTENT_TYPE,
  metadata: (req, file, cb) => {
    // Store uploader's user ID as metadata on the S3 object
    cb(null, { uploadedBy: req.user.id });
  },
  key: (req, file, cb) => {
    // Get clean filename without spaces
    const cleanName = file.originalname.replace(/\s+/g, '-');
    
    // Use a timestamp to keep it unique but recognizable
    // Result: uploads/<userId>/171275454-example-file.png
    const uniqueKey = `uploads/${req.user.id}/${Date.now()}-${cleanName}`;
    cb(null, uniqueKey);
  },
});

// ─── Main upload middleware ────────────────────────────────────────────────────
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // Default 10MB
  },
});

// ─── Helper: format bytes to human-readable string ────────────────────────────
const formatFileSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

module.exports = { upload, formatFileSize };
