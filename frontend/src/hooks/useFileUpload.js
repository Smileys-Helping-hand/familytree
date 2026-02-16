import { useState } from 'react';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../config/firebase';

/**
 * Custom hook for handling file uploads to Firebase Storage
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
   * Upload file to Firebase Storage
   * @param {File} file - File to upload
   * @param {string} familyId - Family ID for path
   * @param {string} memberId - Member ID for path
   * @param {string} oldPhotoUrl - Previous photo URL to delete (optional)
   * @returns {Promise<string>} - Download URL of uploaded file
   */
  const uploadFile = async (file, familyId, memberId, oldPhotoUrl = null) => {
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
      // Create storage reference with timestamp for uniqueness
      const timestamp = Date.now();
      const fileName = `profile_${timestamp}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
      const storagePath = `families/${familyId}/members/${memberId}/${fileName}`;
      const storageRef = ref(storage, storagePath);

      // Upload file with progress tracking
      const uploadTask = uploadBytesResumable(storageRef, file);

      return new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            // Track upload progress
            const progressPercent = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setProgress(progressPercent);
          },
          (error) => {
            // Handle upload error
            console.error('Upload error:', error);
            setError(error.message || 'Upload failed');
            setUploading(false);
            reject(error);
          },
          async () => {
            // Upload completed successfully
            try {
              const url = await getDownloadURL(uploadTask.snapshot.ref);
              setDownloadUrl(url);
              setUploading(false);
              setProgress(100);

              // Delete old photo if it exists and is from Firebase Storage
              if (oldPhotoUrl && oldPhotoUrl.includes('firebasestorage.googleapis.com')) {
                try {
                  await deleteOldPhoto(oldPhotoUrl);
                } catch (deleteError) {
                  console.warn('Failed to delete old photo:', deleteError);
                  // Don't fail the upload if deletion fails
                }
              }

              resolve(url);
            } catch (urlError) {
              setError('Failed to get download URL');
              setUploading(false);
              reject(urlError);
            }
          }
        );
      });
    } catch (err) {
      console.error('Upload initialization error:', err);
      setError(err.message || 'Failed to initialize upload');
      setUploading(false);
      return null;
    }
  };

  /**
   * Delete a file from Firebase Storage
   * @param {string} photoUrl - Firebase Storage URL to delete
   * @returns {Promise<void>}
   */
  const deleteOldPhoto = async (photoUrl) => {
    if (!photoUrl || !photoUrl.includes('firebasestorage.googleapis.com')) {
      return; // Not a Firebase Storage URL
    }

    try {
      // Extract the storage path from the URL
      const decodedUrl = decodeURIComponent(photoUrl);
      const pathMatch = decodedUrl.match(/\/o\/(.+?)\?/);
      
      if (pathMatch && pathMatch[1]) {
        const filePath = pathMatch[1];
        const fileRef = ref(storage, filePath);
        await deleteObject(fileRef);
        console.log('Old photo deleted successfully');
      }
    } catch (error) {
      console.error('Error deleting old photo:', error);
      throw error;
    }
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
