// routes/fileRoutes.js - File management API routes
const express = require('express');
const { uploadFile, getFiles, deleteFile } = require('../controllers/fileController');
const { protect, authorizeRoles } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

const router = express.Router();

// All file routes are protected - user must be logged in
router.use(protect);

// ─── Multer error handler wrapper ─────────────────────────────────────────────
// Wraps multer to catch upload errors (file type, size) and return JSON
const handleUpload = (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      // MulterError (e.g., file too large)
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({
          success: false,
          message: `File too large. Maximum size is ${(parseInt(process.env.MAX_FILE_SIZE) / (1024 * 1024)).toFixed(0)}MB.`,
        });
      }
      // Our custom file filter error or other errors
      return res.status(400).json({ success: false, message: err.message });
    }
    next();
  });
};

// ─── Routes ──────────────────────────────────────────────────────────────────
router.get('/', getFiles);                        // GET  /api/files
router.post('/upload', authorizeRoles('admin', 'editor', 'uploader'), handleUpload, uploadFile); // POST /api/files/upload
router.delete('/:id', authorizeRoles('admin', 'editor'), deleteFile);                // DELETE /api/files/:id

module.exports = router;
