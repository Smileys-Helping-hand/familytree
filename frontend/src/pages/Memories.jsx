import { useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { familyAPI, memoryAPI } from '../services/api';
import { motion } from 'framer-motion';
import { Image, Video, FileText, Upload, Plus, Search, Grid, List, ChevronDown, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Memories() {
  const { familyId } = useParams();
  const [selectedFamilyId, setSelectedFamilyId] = useState(familyId || null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'photo',
    date: new Date().toISOString().slice(0, 10),
    tags: ''
  });
  const [files, setFiles] = useState([]);
  const queryClient = useQueryClient();

  // Fetch all families
  const { data: familiesData, isLoading: loadingFamilies } = useQuery({
    queryKey: ['families'],
    queryFn: familyAPI.getAll,
  });

  const families = familiesData?.data?.families || [];
  const { data: memoriesData } = useQuery({
    queryKey: ['memories', selectedFamilyId],
    queryFn: () => memoryAPI.getAll(selectedFamilyId),
    enabled: !!selectedFamilyId
  });

  const memories = memoriesData?.data?.memories || [];

  const filteredMemories = useMemo(() => {
    return memories.filter((memory) => {
      const matchesQuery = `${memory.title} ${memory.description || ''}`
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesType = filterType === 'all' || memory.type === filterType;
      return matchesQuery && matchesType;
    });
  }, [memories, searchQuery, filterType]);

  const createMemoryMutation = useMutation({
    mutationFn: (payload) => memoryAPI.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries(['memories', selectedFamilyId]);
      queryClient.invalidateQueries(['activity']);
      toast.success('Memory created successfully');
      setShowCreateModal(false);
      setFormData({
        title: '',
        description: '',
        type: 'photo',
        date: new Date().toISOString().slice(0, 10),
        tags: ''
      });
      setFiles([]);
    },
    onError: (error) => {
      const message = error.response?.data?.error || 'Failed to create memory';
      toast.error(message);
    }
  });

  const handleCreateMemory = (e) => {
    e.preventDefault();

    if (!selectedFamilyId) {
      toast.error('Select a family first');
      return;
    }

    if (!formData.title.trim()) {
      toast.error('Memory title is required');
      return;
    }

    const payload = new FormData();
    payload.append('familyId', selectedFamilyId);
    payload.append('title', formData.title.trim());
    payload.append('description', formData.description.trim());
    payload.append('type', formData.type);
    payload.append('date', formData.date);
    payload.append('tags', JSON.stringify(formData.tags
      .split(',')
      .map(tag => tag.trim())
      .filter(Boolean)));

    files.forEach((file) => payload.append('files', file));

    createMemoryMutation.mutate(payload);
  };

  if (loadingFamilies) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent"
        />
      </div>
    );
  }

  // No families exist
  if (families.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <motion.div
          className="card text-center py-16"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Image size={80} className="mx-auto text-primary-300 mb-6" />
          </motion.div>
          <h2 className="text-3xl font-bold gradient-text mb-4">
            Preserve Your Family Memories
          </h2>
          <p className="text-gray-600 text-lg mb-8 max-w-2xl mx-auto">
            Create a family first to start uploading and preserving precious photos, 
            videos, and stories that capture your family's unique journey.
          </p>
          
          <div className="grid md:grid-cols-3 gap-6 max-w-3xl mx-auto mb-8">
            <motion.div
              className="bg-primary-50 rounded-lg p-6"
              whileHover={{ y: -5 }}
            >
              <div className="w-12 h-12 bg-primary-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Image className="text-white" size={24} />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Photos</h3>
              <p className="text-sm text-gray-600">
                Upload and organize family photos with tags and descriptions
              </p>
            </motion.div>

            <motion.div
              className="bg-purple-50 rounded-lg p-6"
              whileHover={{ y: -5 }}
            >
              <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Video className="text-white" size={24} />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Videos</h3>
              <p className="text-sm text-gray-600">
                Share special video moments and family celebrations
              </p>
            </motion.div>

            <motion.div
              className="bg-pink-50 rounded-lg p-6"
              whileHover={{ y: -5 }}
            >
              <div className="w-12 h-12 bg-pink-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                <FileText className="text-white" size={24} />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Stories</h3>
              <p className="text-sm text-gray-600">
                Write and preserve family stories and memories
              </p>
            </motion.div>
          </div>

          <Link to="/create-family" className="btn btn-primary inline-flex items-center gap-2">
            <Plus size={20} />
            Create a Family to Get Started
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <div className="flex-1">
          <h1 className="text-3xl font-bold gradient-text mb-2">Family Memories</h1>
          <p className="text-gray-600">Preserve and share your family's precious moments</p>
        </div>
        
        <div className="flex gap-3">
          {/* Family Selector */}
          <div className="relative">
            <select
              value={selectedFamilyId || ''}
              onChange={(e) => setSelectedFamilyId(e.target.value)}
              className="input min-w-[200px] appearance-none pr-10"
            >
              <option value="">Select a family...</option>
              {families.map(family => (
                <option key={family.id} value={family.id}>
                  {family.name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary inline-flex items-center gap-2"
            disabled={!selectedFamilyId}
          >
            <Plus size={18} />
            Upload Memory
          </button>
        </div>
      </motion.div>

      {!selectedFamilyId ? (
        <motion.div
          className="card text-center py-16"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          <Image size={64} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Select a family to view memories
          </h3>
          <p className="text-gray-600 mb-6">
            Choose a family from the dropdown above to explore their memories
          </p>
        </motion.div>
      ) : (
        <>
          {/* Search and Filter Bar */}
          <motion.div
            className="flex flex-col sm:flex-row gap-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search memories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            
            <div className="flex gap-2">
              {[
                { value: 'all', label: 'all' },
                { value: 'photo', label: 'photos' },
                { value: 'video', label: 'videos' },
                { value: 'story', label: 'stories' },
                { value: 'document', label: 'docs' },
                { value: 'audio', label: 'audio' }
              ].map((type) => (
                <motion.button
                  key={type.value}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setFilterType(type.value)}
                  className={`px-4 py-2 rounded-lg capitalize transition-colors ${
                    filterType === type.value
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {type.label}
                </motion.button>
              ))}
              
              <button
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                {viewMode === 'grid' ? <List size={20} /> : <Grid size={20} />}
              </button>
            </div>
          </motion.div>

          {filteredMemories.length === 0 ? (
            <motion.div
              className="card text-center py-16"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
            >
              <motion.div
                animate={{ y: [0, -10, 0], rotate: [0, 5, -5, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="mb-6"
              >
                <Image size={80} className="mx-auto text-primary-300" />
              </motion.div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Start Building Your Memory Collection
              </h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                Upload photos, videos, and stories to preserve your family's precious moments.
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowCreateModal(true)}
                className="btn btn-primary inline-flex items-center gap-2"
              >
                <Upload size={18} />
                Upload Your First Memory
              </motion.button>
            </motion.div>
          ) : (
            <div className={viewMode === 'grid' ? 'grid md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
              {filteredMemories.map((memory) => (
                <motion.div
                  key={memory.id}
                  whileHover={{ y: -4, scale: 1.01 }}
                  className="card"
                >
                  {memory.media?.[0]?.url && (
                    <div className="mb-4 overflow-hidden rounded-lg">
                      <img
                        src={memory.media[0].url}
                        alt={memory.title}
                        className="w-full h-40 object-cover"
                      />
                    </div>
                  )}
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{memory.title}</h3>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{memory.description || 'No description'}</p>
                  <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                    <span className="px-2 py-1 rounded-full bg-primary-50 text-primary-700">{memory.type}</span>
                    <span>{new Date(memory.date).toLocaleDateString()}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowCreateModal(false)} />
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative bg-white rounded-2xl shadow-2xl max-w-xl w-full p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Upload Memory</h3>
              <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateMemory} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                <input
                  type="text"
                  className="input"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  className="input resize-none"
                  rows="3"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                  <select
                    className="input"
                    value={formData.type}
                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                  >
                    <option value="photo">Photo</option>
                    <option value="video">Video</option>
                    <option value="story">Story</option>
                    <option value="document">Document</option>
                    <option value="audio">Audio</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                  <input
                    type="date"
                    className="input"
                    value={formData.date}
                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tags (comma separated)</label>
                <input
                  type="text"
                  className="input"
                  value={formData.tags}
                  onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Files</label>
                <input
                  type="file"
                  multiple
                  className="input"
                  onChange={(e) => setFiles(Array.from(e.target.files || []))}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" className="btn btn-secondary flex-1" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary flex-1" disabled={createMemoryMutation.isLoading}>
                  {createMemoryMutation.isLoading ? 'Uploading...' : 'Upload Memory'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
