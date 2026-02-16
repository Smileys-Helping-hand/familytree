import { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Upload, Loader, X, AlertCircle } from 'lucide-react';
import useFileUpload from '../hooks/useFileUpload';

/**
 * ImageUploader Component
 * Handles profile photo uploads with preview, progress, and error handling
 */
export default function ImageUploader({ 
  currentPhoto, 
  onPhotoChange, 
  familyId, 
  memberId,
  firstName = '',
  lastName = ''
}) {
  const fileInputRef = useRef(null);
  const { uploading, progress, error, uploadFile, reset } = useFileUpload();

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // Generate temporary member ID if creating new member
      const tempMemberId = memberId || `temp_${Date.now()}`;
      
      // Upload file
      const downloadUrl = await uploadFile(file, familyId, tempMemberId, currentPhoto);
      
      if (downloadUrl) {
        // Update parent component with new photo URL
        onPhotoChange(downloadUrl);
      }
    } catch (err) {
      console.error('Upload failed:', err);
    }

    // Clear file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemovePhoto = () => {
    onPhotoChange('');
    reset();
  };

  const getInitials = () => {
    const first = firstName?.charAt(0) || '';
    const last = lastName?.charAt(0) || '';
    return `${first}${last}`.toUpperCase() || '?';
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Profile Photo
      </label>

      <div className="flex items-center gap-6">
        {/* Photo Preview */}
        <div className="relative">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="relative group cursor-pointer"
            onClick={handleClick}
          >
            {currentPhoto ? (
              <img
                src={currentPhoto}
                alt="Profile"
                className="w-24 h-24 rounded-full object-cover border-4 border-primary-100 shadow-lg"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary-500 via-purple-500 to-pink-500 flex items-center justify-center text-white text-3xl font-bold border-4 border-primary-100 shadow-lg">
                {getInitials()}
              </div>
            )}

            {/* Overlay */}
            <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Camera className="text-white" size={24} />
            </div>

            {/* Upload Progress Ring */}
            {uploading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <svg className="w-24 h-24 -rotate-90">
                  <circle
                    cx="48"
                    cy="48"
                    r="44"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                    className="text-primary-200"
                  />
                  <circle
                    cx="48"
                    cy="48"
                    r="44"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 44}`}
                    strokeDashoffset={`${2 * Math.PI * 44 * (1 - progress / 100)}`}
                    className="text-primary-600 transition-all duration-300"
                  />
                </svg>
              </div>
            )}
          </motion.div>

          {/* Remove Button */}
          {currentPhoto && !uploading && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => {
                e.stopPropagation();
                handleRemovePhoto();
              }}
              className="absolute -top-1 -right-1 w-7 h-7 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg transition-colors"
              title="Remove photo"
            >
              <X size={14} />
            </motion.button>
          )}
        </div>

        {/* Upload Info */}
        <div className="flex-1 space-y-2">
          <motion.button
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleClick}
            disabled={uploading}
            className="btn btn-outline flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? (
              <>
                <Loader size={18} className="animate-spin" />
                Uploading... {Math.round(progress)}%
              </>
            ) : (
              <>
                <Upload size={18} />
                {currentPhoto ? 'Change Photo' : 'Upload Photo'}
              </>
            )}
          </motion.button>

          <p className="text-xs text-gray-500">
            JPG, PNG, GIF or WebP. Max 5MB.
          </p>

          {/* Progress Bar */}
          {uploading && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full"
            >
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  className="h-full bg-gradient-to-r from-primary-500 to-purple-500 transition-all duration-300"
                />
              </div>
            </motion.div>
          )}

          {/* Error Message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-start gap-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3"
              >
                <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}
