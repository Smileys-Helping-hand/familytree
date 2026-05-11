import React, { useState, useEffect, useCallback } from 'react';
import { memberAPI } from '../services/api';
import { useFileUpload } from '../hooks/useFileUpload';

export default function MemberDetailsPanel({ member, isOpen, onClose, isReadOnly = false }) {
  const [memories, setMemories] = useState([]);
  const [tab, setTab] = useState(0);
  const [uploading, setUploading] = useState(false);
  const { uploadFile } = useFileUpload();

  const refreshMemories = useCallback(() => {
    if (member?.id) {
      memberAPI.getMemories(member.id)
        .then(res => setMemories(res.data.memories || []))
        .catch(() => setMemories([]));
    }
  }, [member?.id]);

  useEffect(() => {
    if (member?.id && isOpen) {
      refreshMemories();
    } else {
      setMemories([]);
    }
  }, [member?.id, isOpen, refreshMemories]);

  const handleUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadFile(file);
      await memberAPI.addMemory(member.id, {
        type: 'photo',
        title: file.name,
        mediaUrl: url,
        date: new Date()
      });
      refreshMemories();
    } catch {
      // upload error is handled by uploadFile
    } finally {
      setUploading(false);
    }
  };

  const handleAddEvent = async (event) => {
    await memberAPI.addMemory(member.id, {
      type: 'event',
      title: event.title,
      description: event.description,
      date: event.date
    });
    refreshMemories();
  };

  return (
    <div className={`fixed top-0 right-0 w-[420px] h-full bg-white shadow-2xl z-50 transform transition-transform ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
      <button className="absolute top-4 right-4 text-gray-500 hover:text-gray-900 text-xl leading-none" onClick={onClose}>×</button>
      {!member ? null : (
      <div className="p-6 overflow-y-auto h-full pb-20">
        <div className="flex items-center gap-4 mb-6">
          <img src={member.photo || '/default-avatar.png'} alt="Profile" className="w-20 h-20 rounded-full border-2 border-primary-200 object-cover" />
          <div>
            <h2 className="text-2xl font-bold">{member.firstName} {member.lastName}</h2>
            <div className="text-gray-500 text-sm">
              {member.birthDate ? new Date(member.birthDate).getFullYear() : '?'}
              {member.deathDate ? ` – ${new Date(member.deathDate).getFullYear()}` : (member.isLiving !== false ? ' (Living)' : '')}
            </div>
          </div>
        </div>
        {/* Tabs */}
        <div className="flex gap-4 border-b mb-4">
          <button className={`py-2 px-4 font-semibold ${tab === 0 ? 'border-b-2 border-primary-500 text-primary-600' : 'text-gray-500'}`} onClick={() => setTab(0)}>Timeline</button>
          <button className={`py-2 px-4 font-semibold ${tab === 1 ? 'border-b-2 border-primary-500 text-primary-600' : 'text-gray-500'}`} onClick={() => setTab(1)}>Gallery</button>
        </div>
        {tab === 0 ? (
          <div className="space-y-4">
            {memories.filter(m => m.type === 'event').length === 0 && (
              <p className="text-gray-400 text-sm text-center py-6">No timeline events yet.</p>
            )}
            {memories.filter(m => m.type === 'event').map(event => (
              <div key={event.id} className="border-l-4 border-primary-500 pl-4 mb-4">
                <div className="font-bold text-lg">{event.title}</div>
                <div className="text-gray-500 text-sm">{event.date ? new Date(event.date).toLocaleDateString() : ''}</div>
                <div className="text-gray-700 mt-1">{event.description}</div>
              </div>
            ))}
          </div>
        ) : (
          <div>
            <div className="grid grid-cols-3 gap-3 mb-4">
              {memories.filter(m => m.type === 'photo').length === 0 && (
                <p className="col-span-3 text-gray-400 text-sm text-center py-6">No photos yet.</p>
              )}
              {memories.filter(m => m.type === 'photo').map(photo => (
                <img key={photo.id} src={photo.mediaUrl} alt={photo.title} className="rounded-lg border shadow aspect-square object-cover" />
              ))}
            </div>
            {!isReadOnly && (
              <label className="flex items-center gap-2 cursor-pointer mt-2">
                <span className={`btn btn-primary text-sm ${uploading ? 'opacity-60 pointer-events-none' : ''}`}>
                  {uploading ? 'Uploading…' : 'Upload Photo'}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploading}
                  onChange={e => {
                    const file = e.target.files[0];
                    if (file) handleUpload(file);
                    e.target.value = '';
                  }}
                />
              </label>
            )}
          </div>
        )}
      </div>
      )}
    </div>
  );
}
