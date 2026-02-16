import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { familyAPI } from '../services/api';
import { ArrowLeft, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

export default function CreateFamily() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  const createFamilyMutation = useMutation({
    mutationFn: familyAPI.create,
    onSuccess: (data) => {
      queryClient.invalidateQueries(['families']);
      toast.success('Family created successfully!');
      navigate('/dashboard');
    },
    onError: (error) => {
      const message = error.response?.data?.error || 'Failed to create family';
      toast.error(message);
    },
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Family name is required');
      return;
    }

    createFamilyMutation.mutate(formData);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft size={20} className="mr-2" />
            Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold gradient-text mb-2">Create Your Family Tree</h1>
          <p className="text-gray-600">
            Start building your family history by creating a new family tree
          </p>
        </div>

        {/* Form Card */}
        <motion.div
          className="card"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-6">
            <Users className="text-primary-600" size={32} />
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Family Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Family Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="input"
                placeholder="e.g., The Smith Family"
                required
                autoFocus
              />
              <p className="mt-1 text-sm text-gray-500">
                Choose a name that represents your family tree
              </p>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description (Optional)
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="4"
                className="input resize-none"
                placeholder="Tell us about your family history, heritage, or what makes your family special..."
              />
              <p className="mt-1 text-sm text-gray-500">
                Add a brief description or story about your family
              </p>
            </div>

            {/* Info Box */}
            <motion.div
              className="bg-primary-50 border border-primary-200 rounded-lg p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <h4 className="font-semibold text-primary-900 mb-2">What's Next?</h4>
              <ul className="text-sm text-primary-800 space-y-1">
                <li>• Add family members to build your tree</li>
                <li>• Upload photos and memories</li>
                <li>• Create events and milestones</li>
                <li>• Invite family members to collaborate</li>
              </ul>
            </motion.div>

            {/* Submit Button */}
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="btn btn-secondary flex-1"
                disabled={createFamilyMutation.isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary flex-1"
                disabled={createFamilyMutation.isLoading}
              >
                {createFamilyMutation.isLoading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating...
                  </span>
                ) : (
                  'Create Family Tree'
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </div>
  );
}
