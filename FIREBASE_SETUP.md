# Firebase Storage Setup Guide

## Quick Start

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or select existing project
3. Follow the setup wizard

### 2. Enable Firebase Storage

1. In Firebase Console, click "Storage" from left menu
2. Click "Get Started"
3. Choose "Start in production mode" or "Start in test mode"
4. Select a Cloud Storage location (choose closest to your users)

### 3. Configure Storage Rules

Go to Storage > Rules and update with these secure rules:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Family member photos - authenticated users can write, everyone can read
    match /families/{familyId}/members/{memberId}/{allPaths=**} {
      allow read: if true;  // Public read access for profile photos
      allow write: if request.auth != null  // Only authenticated users can upload
                   && request.resource.size < 5 * 1024 * 1024  // Max 5MB
                   && request.resource.contentType.matches('image/.*');  // Images only
    }
  }
}
```

### 4. Get Firebase Config

1. Go to Project Settings (gear icon) > General
2. Scroll to "Your apps" section
3. Click the web icon (</>) or select existing web app
4. Copy the `firebaseConfig` object values

### 5. Set Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Fill in your Firebase credentials:
   ```env
   VITE_FIREBASE_API_KEY=your-actual-api-key
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
   VITE_FIREBASE_APP_ID=1:123456789012:web:abc123
   ```

3. Restart your dev server:
   ```bash
   npm run dev
   ```

## Features

### ✅ Implemented Features

- **File Upload**: Drag & drop or click to upload profile photos
- **Validation**: 
  - Images only (JPEG, PNG, GIF, WebP)
  - Max 5MB file size
  - Automatic file type checking
- **Progress Tracking**: Real-time upload progress indicator
- **Storage Path**: `families/{familyId}/members/{memberId}/profile_{timestamp}`
- **Auto Cleanup**: Old photos are deleted when new ones are uploaded
- **Error Handling**: User-friendly error messages
- **Preview**: Live preview of uploaded images

### 🎨 UI Components

1. **ImageUploader** (`src/components/ImageUploader.jsx`)
   - Circular avatar preview
   - Click to upload
   - Progress ring animation
   - Remove photo button
   - Error display

2. **useFileUpload Hook** (`src/hooks/useFileUpload.js`)
   - File validation
   - Upload with progress tracking
   - Delete old photos
   - Error handling
   - State management

## Usage

### In AddMemberModal

```jsx
<ImageUploader
  currentPhoto={formData.photo}
  onPhotoChange={(url) => setFormData(prev => ({ ...prev, photo: url }))}
  familyId={familyId}
  memberId={member?.id}
  firstName={formData.firstName}
  lastName={formData.lastName}
/>
```

### Upload Flow

1. User clicks "Edit Member" or "Add Member"
2. Modal opens with ImageUploader component
3. User clicks avatar or "Upload Photo" button
4. File picker opens
5. User selects image
6. File is validated (type, size)
7. Upload starts with progress indicator
8. On success, download URL is saved to form state
9. Old photo is automatically deleted
10. New photo appears immediately on Tree Node

## Security Notes

- ✅ File size limit enforced (5MB)
- ✅ File type validation (images only)
- ✅ Firebase Storage Rules protect uploads
- ✅ Old photos automatically cleaned up
- ✅ Unique filenames with timestamps
- ✅ Environment variables for credentials

## Troubleshooting

### Common Issues

**"Firebase: Error (auth/invalid-api-key)"**
- Check your `.env` file has correct values
- Make sure to restart dev server after changing `.env`

**"Upload failed: Firebase Storage: User does not have permission"**
- Check Firebase Storage Rules are set correctly
- Ensure authentication is working

**"File size must be less than 5MB"**
- Compress image before uploading
- Use online tools like TinyPNG

**Photo not displaying after upload**
- Check browser console for errors
- Verify Firebase Storage URL in database
- Check if Storage Rules allow public read access

## File Structure

```
frontend/
├── .env                          # Your Firebase credentials (git-ignored)
├── .env.example                  # Template for Firebase credentials
├── src/
│   ├── config/
│   │   └── firebase.js          # Firebase initialization
│   ├── hooks/
│   │   └── useFileUpload.js     # Upload logic & state management
│   ├── components/
│   │   └── ImageUploader.jsx    # Upload UI component
│   └── pages/
│       └── FamilyTree.jsx       # Updated with photo upload
```

## Next Steps

1. ✅ Set up Firebase project
2. ✅ Configure environment variables
3. ✅ Test photo upload
4. 🔄 Deploy to production
5. 🔄 Monitor Storage usage in Firebase Console

For more details, visit [Firebase Storage Documentation](https://firebase.google.com/docs/storage)
