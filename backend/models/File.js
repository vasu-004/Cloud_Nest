// models/File.js - Mongoose schema for uploaded file metadata
const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema(
  {
    // Reference to the user who uploaded the file
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    originalName: {
      type: String,
      required: true,
      trim: true,
    },
    // Unique key stored in S3 (uuid-based filename)
    key: {
      type: String,
      required: true,
      unique: true,
    },
    // Public URL to access the file
    url: {
      type: String,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    // Size in bytes
    size: {
      type: Number,
      required: true,
    },
    // Friendly size string (e.g., "2.3 MB")
    sizeFormatted: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Virtual to get file extension from mimeType
fileSchema.virtual('extension').get(function () {
  const parts = this.mimeType.split('/');
  return parts[parts.length - 1] === 'jpeg' ? 'jpg' : parts[parts.length - 1];
});

module.exports = mongoose.model('File', fileSchema);
