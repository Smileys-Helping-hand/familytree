import React, { useState, useEffect } from 'react';
// Simple custom tabs implementation
import { memberAPI } from '../services/api';
import { aiAPI } from '../services/ai';
import { useFileUpload } from '../hooks/useFileUpload';

export default function MemberDetailsPanel({ member, isOpen, onClose, isReadOnly }) {
  const [memories, setMemories] = useState([]);
  const [tab, setTab] = useState(0);
  const { uploadFile } = useFileUpload();

  useEffect(() => {
    if (member?.id && isOpen) {
      memberAPI.getMemories(member.id)
        .then(res => setMemories(res.data.memories || []))
        .catch(() => setMemories([]));
    } else {
      setMemories([]);
    }
  }, [member, isOpen]);

  const handleUpload = async (file) => {
    const url = await uploadFile(file);
    await memberAPI.addMemory(member.id, {
      type: 'photo',
      title: file.name,
      mediaUrl: url,
      date: new Date()
    });
    memberAPI.getMemories(member.id).then(res => setMemories(res.data.memories));
  };

  const handleAddEvent = async (event) => {
    await memberAPI.addMemory(member.id, {
      type: 'event',
      title: event.title,
      description: event.description,
      date: event.date
    });
    memberAPI.getMemories(member.id).then(res => setMemories(res.data.memories));
  };

  return (
    <div className={`fixed top-0 right-0 w-[420px] h-full bg-white shadow-2xl z-50 transform transition-transform ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
      <button className="absolute top-4 right-4 text-gray-500 hover:text-gray-900" onClick={onClose}>×</button>
      {!member ? null : (
      <div className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <img src={member.photo || '/default-avatar.png'} alt="Profile" className="w-20 h-20 rounded-full border-2 border-primary-200" />
          <div>
            <h2 className="text-2xl font-bold">{member.firstName} {member.lastName}</h2>
            <div className="text-gray-500 text-sm">{member.birthDate ? new Date(member.birthDate).getFullYear() : '?'}{member.deathDate ? ` - ${new Date(member.deathDate).getFullYear()}` : ''}</div>
          </div>
        </div>
        {/* Custom Tabs */}
        <div className="flex gap-4 border-b mb-4">
          <button className={`py-2 px-4 font-semibold ${tab === 0 ? 'border-b-2 border-primary-500' : ''}`} onClick={() => setTab(0)}>Timeline</button>
          <button className={`py-2 px-4 font-semibold ${tab === 1 ? 'border-b-2 border-primary-500' : ''}`} onClick={() => setTab(1)}>Gallery</button>
        </div>
        {tab === 0 ? (
          <div className="space-y-4">
            {memories.filter(m => m.type === 'event').map(event => (
              <div key={event.id} className="border-l-4 border-primary-500 pl-4 mb-4">
                <div className="font-bold text-lg">{event.title}</div>
                <div className="text-gray-500 text-sm">{event.date ? new Date(event.date).toLocaleDateString() : ''}</div>
                <div className="text-gray-700 mt-1">{event.description}</div>
              </div>
            ))}
            {!isReadOnly && (
              <button className="btn btn-primary mt-2" onClick={() => {/* open add event modal */}}>Add Event</button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {memories.filter(m => m.type === 'photo').map(photo => (
              <img key={photo.id} src={photo.mediaUrl} alt={photo.title} className="rounded-lg border shadow" />
            ))}
            {!isReadOnly && (
              <div className="mt-4">
                <input type="file" accept="image/*" onChange={e => handleUpload(e.target.files[0])} />
                <button className="btn btn-primary ml-2">Upload Photo</button>
              </div>
            )}
          </div>
        )}
      </div>
      )}
    </div>
  );
}
