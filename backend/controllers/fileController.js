// controllers/fileController.js - Handles file upload, list, and delete
const { DeleteObjectCommand } = require('@aws-sdk/client-s3');
const s3Client = require('../config/s3');
const File = require('../models/File');
const { formatFileSize } = require('../middleware/upload');

// ─── @route   POST /api/files/upload ─────────────────────────────────────────
// ─── @desc    Upload a file to S3 and save metadata in MongoDB ────────────────
// ─── @access  Private ─────────────────────────────────────────────────────────
const uploadFile = async (req, res) => {
  try {
    // Multer-S3 puts file info on req.file after successful upload
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file provided.' });
    }

    const { originalname, mimetype, size, key, location } = req.file;

    // Save file metadata to MongoDB
    const file = await File.create({
      user: req.user.id,
      originalName: originalname,
      key,            // S3 object key
      url: location,  // Public S3 URL
      mimeType: mimetype,
      size,
      sizeFormatted: formatFileSize(size),
    });

    res.status(201).json({
      success: true,
      message: 'File uploaded successfully.',
      file,
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ success: false, message: 'Error uploading file.' });
  }
};

// ─── @route   GET /api/files ──────────────────────────────────────────────────
// ─── @desc    Get all files uploaded by the logged-in user ───────────────────
// ─── @access  Private ─────────────────────────────────────────────────────────
const { HeadObjectCommand } = require('@aws-sdk/client-s3');

const getFiles = async (req, res) => {
  try {
    const files = await File.find({}).sort({ createdAt: -1 });

    // Synchronization logic: Verify each file exists in S3
    // We check existence in parallel for performance
    const syncResults = await Promise.all(
      files.map(async (file) => {
        try {
          await s3Client.send(
            new HeadObjectCommand({
              Bucket: process.env.AWS_BUCKET_NAME,
              Key: file.key,
            })
          );
          return { file, exists: true };
        } catch (error) {
          if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
            console.log(`🗑️ Sync: File ${file.key} missing in S3, deleting from DB.`);
            await File.findByIdAndDelete(file._id);
            return { file, exists: false };
          }
          // If it's a different error (e.g. network), assume it exists to avoid accidental deletion
          return { file, exists: true };
        }
      })
    );

    // Filter out the files that were deleted during sync
    const activeFiles = syncResults
      .filter((result) => result.exists)
      .map((result) => result.file);

    res.json({
      success: true,
      count: activeFiles.length,
      files: activeFiles,
    });
  } catch (error) {
    console.error('Get files error:', error);
    res.status(500).json({ success: false, message: 'Error fetching files.' });
  }
};

// ─── @route   DELETE /api/files/:id ──────────────────────────────────────────
// ─── @desc    Delete a file from S3 and remove its metadata from MongoDB ─────
// ─── @access  Private ─────────────────────────────────────────────────────────
const deleteFile = async (req, res) => {
  try {
    const file = await File.findById(req.params.id);

    if (!file) {
      return res.status(404).json({ success: false, message: 'File not found.' });
    }

    // Ensure the requesting user owns this file OR is an admin/editor with team-wide delete rights
    const isOwner = file.user.toString() === req.user.id;
    const isManager = ['admin', 'editor'].includes(req.user.role);
    
    if (!isOwner && !isManager) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this file.',
      });
    }

    // Delete from S3 first
    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: file.key,
      })
    );

    // Then remove metadata from MongoDB
    await File.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: 'File deleted successfully.' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ success: false, message: 'Error deleting file.' });
  }
};

module.exports = { uploadFile, getFiles, deleteFile };
