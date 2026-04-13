// src/services/fileService.js - File API calls
import api from './api';

// ─── Upload a file with progress tracking ───────────────────────────────────
export const uploadFile = async (file, onUploadProgress) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post('/files/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (progressEvent) => {
      const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
      if (onUploadProgress) onUploadProgress(percent);
    },
  });
};

// ─── Fetch all files for the logged-in user ─────────────────────────────────
export const getFiles = async () => {
  return api.get('/files');
};

// ─── Delete a file by its MongoDB _id ───────────────────────────────────────
export const deleteFile = async (fileId) => {
  return api.delete(`/files/${fileId}`);
};

