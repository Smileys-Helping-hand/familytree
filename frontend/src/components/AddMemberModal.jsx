
import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { memberAPI } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Calendar, FileText, Mail, Phone } from 'lucide-react';
import toast from 'react-hot-toast';
import ImageUploader from '../components/ImageUploader';
import { syncMemberToFamilyVerse } from '../utils/familyverseSync';

export default function AddMemberModal({ isOpen, onClose, familyId, member }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    gender: 'other',
    birthDate: '',
    deathDate: '',
    isLiving: true,
    email: '',
    phone: '',
    photo: '',
    biography: '',
  });

  useEffect(() => {
    if (member) {
      setFormData({
        firstName: member.firstName || '',
        lastName: member.lastName || '',
        gender: member.gender || 'other',
        birthDate: member.birthDate ? member.birthDate.slice(0, 10) : '',
        deathDate: member.deathDate ? member.deathDate.slice(0, 10) : '',
        isLiving: member.isLiving !== undefined ? member.isLiving : true,
        email: member.email || '',
        phone: member.phone || '',
        photo: member.photo || '',
        biography: member.biography || '',
      });
    } else {
      setFormData({
        firstName: '',
        lastName: '',
        gender: 'other',
        birthDate: '',
        deathDate: '',
        isLiving: true,
        email: '',
        phone: '',
        photo: '',
        biography: '',
      });
    }
  }, [member, isOpen]);

  const createMemberMutation = useMutation({
    mutationFn: (data) => memberAPI.create({ ...data, familyId }),
    onSuccess: async (response, variables) => {
      // Sync to FamilyVerse after successful creation
      // Use response?.data if available, otherwise use variables (formData)
      const memberData = response?.data || { ...variables, familyId };
      await syncMemberToFamilyVerse(memberData);

      queryClient.invalidateQueries(['family-members', familyId]);
      queryClient.invalidateQueries(['families']);
      toast.success('Family member added successfully!');
      onClose();
      setFormData({
        firstName: '',
        lastName: '',
        gender: 'other',
        birthDate: '',
        deathDate: '',
        isLiving: true,
        email: '',
        phone: '',
        photo: '',
        biography: '',
      });
    },
    onError: (error) => {
      const message = error.response?.data?.error || 'Failed to add family member';
      toast.error(message);
    },
  });

  const updateMemberMutation = useMutation({
    mutationFn: (data) => memberAPI.update(member.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['family-members', familyId]);
      queryClient.invalidateQueries(['member', member?.id]);
      toast.success('Family member updated successfully!');
      onClose();
    },
    onError: (error) => {
      const message = error.response?.data?.error || 'Failed to update family member';
      toast.error(message);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.firstName.trim()) {
      toast.error('First name is required');
      return;
    }

    if (member) {
      updateMemberMutation.mutate(formData);
    } else {
      createMemberMutation.mutate(formData);
    }
  };

  // Auto-mark as deceased when a death date is entered
  const handleChange = (e) => {
    const { name, value, type: inputType, checked } = e.target;
    const newValue = inputType === 'checkbox' ? checked : value;
    setFormData((prev) => {
      const updated = { ...prev, [name]: newValue };
      if (name === 'deathDate' && value) updated.isLiving = false;
      if (name === 'deathDate' && !value) updated.isLiving = true;
      return updated;
    });
  };

  if (!isOpen) return null;

  const isSaving = createMemberMutation.isPending || updateMemberMutation.isPending;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        />

        <div className="flex min-h-full items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                  <User className="text-primary-600" size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {member ? 'Edit Family Member' : 'Add Family Member'}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {member ? 'Update details for this person' : 'Add a new person to your family tree'}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Quick-start hint for new members */}
              {!member && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-700">
                  <span className="font-semibold">Tip:</span> Only <span className="font-semibold">First Name</span> is required. After saving, use the <span className="font-semibold">Relationship Builder</span> below the tree to connect this person to others.
                </div>
              )}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    className="input"
                    placeholder="John"
                    required
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    className="input"
                    placeholder="Smith"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gender
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: 'male', label: 'Male', emoji: '👨' },
                    { value: 'female', label: 'Female', emoji: '👩' },
                    { value: 'other', label: 'Other', emoji: '🧑' }
                  ].map((option) => (
                    <label
                      key={option.value}
                      className={`flex items-center justify-center gap-2 px-4 py-3 border-2 rounded-lg cursor-pointer transition-all ${
                        formData.gender === option.value
                          ? 'border-primary-600 bg-primary-50 text-primary-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="gender"
                        value={option.value}
                        checked={formData.gender === option.value}
                        onChange={handleChange}
                        className="sr-only"
                      />
                      <span className="text-2xl">{option.emoji}</span>
                      <span className="font-medium">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="inline mr-1" size={16} />
                    Birth Date
                  </label>
                  <input
                    type="date"
                    name="birthDate"
                    value={formData.birthDate}
                    onChange={handleChange}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="inline mr-1" size={16} />
                    Death Date <span className="text-gray-400 font-normal">(leave blank if living)</span>
                  </label>
                  <input
                    type="date"
                    name="deathDate"
                    value={formData.deathDate}
                    onChange={handleChange}
                    className="input"
                  />
                </div>
              </div>

              {/* Living status — auto-toggled by deathDate, can override */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <input
                  type="checkbox"
                  id="isLiving"
                  name="isLiving"
                  checked={formData.isLiving}
                  onChange={handleChange}
                  className="w-4 h-4 accent-primary-600"
                />
                <label htmlFor="isLiving" className="text-sm font-medium text-gray-700 cursor-pointer select-none">
                  Currently living
                </label>
                <span className="text-xs text-gray-400">(auto-unchecked when a death date is entered)</span>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Mail className="inline mr-1" size={16} />
                    Email <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="input"
                    placeholder="john@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Phone className="inline mr-1" size={16} />
                    Phone <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="input"
                    placeholder="+27 82 123 4567"
                  />
                </div>
              </div>

              <ImageUploader
                currentPhoto={formData.photo}
                onPhotoChange={(url) => setFormData(prev => ({ ...prev, photo: url }))}
                familyId={familyId}
                memberId={member?.id}
                firstName={formData.firstName}
                lastName={formData.lastName}
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FileText className="inline mr-1" size={16} />
                  Biography (optional)
                </label>
                <textarea
                  name="biography"
                  value={formData.biography}
                  onChange={handleChange}
                  rows="4"
                  className="input resize-none"
                  placeholder="Tell their story... Where were they born? What did they do? What are their interests?"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Share stories, accomplishments, and memories
                </p>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={onClose}
                  className="btn btn-secondary flex-1"
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary flex-1"
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving...' : (member ? 'Save Changes' : 'Add Family Member')}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
}
