import { useState } from 'react';
import api from '../services/api';

/**
 * Custom hook for handling file uploads via backend API
 * @returns {Object} - Upload state and functions
 */
export const useFileUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [downloadUrl, setDownloadUrl] = useState(null);

  /**
   * Validate file before upload
   * @param {File} file - File to validate
   * @returns {Object} - { valid: boolean, error: string }
   */
  const validateFile = (file) => {
    // Check if file exists
    if (!file) {
      return { valid: false, error: 'No file selected' };
    }

    // Check file type (images only)
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      return { valid: false, error: 'Only image files (JPEG, PNG, GIF, WebP) are allowed' };
    }

    // Check file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      return { valid: false, error: 'File size must be less than 5MB' };
    }

    return { valid: true, error: null };
  };

  /**
   * Upload file through backend -> Cloudinary
   * @param {File} file - File to upload
   * @param {string} familyId - Family ID for foldering
   * @param {string} memberId - Member ID for foldering
   * @returns {Promise<string>} - Uploaded file URL
   */
  const uploadFile = async (file, familyId, memberId) => {
    // Validate file
    const validation = validateFile(file);
    if (!validation.valid) {
      setError(validation.error);
      return null;
    }

    setUploading(true);
    setProgress(0);
    setError(null);
    setDownloadUrl(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      if (familyId) formData.append('familyId', familyId);
      if (memberId) formData.append('memberId', memberId);

      const response = await api.post('/members/upload-photo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (event) => {
          if (!event.total) return;
          const progressPercent = (event.loaded / event.total) * 100;
          setProgress(progressPercent);
        }
      });

      const url = response?.data?.url;
      if (!url) {
        throw new Error('Upload did not return a file URL');
      }

      setDownloadUrl(url);
      setUploading(false);
      setProgress(100);
      return url;
    } catch (err) {
      console.error('Upload initialization error:', err);
      setError(err?.response?.data?.error || err.message || 'Failed to initialize upload');
      setUploading(false);
      return null;
    }
  };

  /**
   * No-op placeholder for backward compatibility.
   * @param {string} photoUrl - Previously uploaded URL
   * @returns {Promise<void>}
   */
  // eslint-disable-next-line no-unused-vars
  const deleteOldPhoto = async (photoUrl) => {
    return;
  };

  /**
   * Reset upload state
   */
  const reset = () => {
    setUploading(false);
    setProgress(0);
    setError(null);
    setDownloadUrl(null);
  };

  return {
    uploading,
    progress,
    error,
    downloadUrl,
    uploadFile,
    deleteOldPhoto,
    reset,
  };
};

export default useFileUpload;
