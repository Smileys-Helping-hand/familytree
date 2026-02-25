import React, { useState } from 'react';
import Modal from 'react-modal';

const EXAMPLE_PROMPT = `My grandfather is Arthur, he married Martha. They had two kids: my dad John and my aunt Sarah. John married Jane, and they had me, Alex.`;

export default function AIGeneratorModal({ isOpen, onClose, onGenerate }) {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    setLoading(true);
    setError('');
    try {
      await onGenerate(prompt);
      setPrompt('');
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to generate family tree.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      className="fixed inset-0 flex items-center justify-center z-50"
      overlayClassName="fixed inset-0 bg-black bg-opacity-40 z-40"
      ariaHideApp={false}
    >
      <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-lg relative">
        <button
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-2xl"
          onClick={onClose}
        >
          ×
        </button>
        <h2 className="text-2xl font-bold mb-4 text-center">✨ AI Family Tree Generator</h2>
        <textarea
          className="w-full border rounded-lg p-3 mb-4 min-h-[100px] focus:outline-none focus:ring-2 focus:ring-blue-400"
          placeholder="Describe your family in natural language..."
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          disabled={loading}
        />
        <button
          className="w-full py-3 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold text-lg shadow-md hover:from-blue-600 hover:to-purple-600 transition disabled:opacity-60"
          onClick={handleGenerate}
          disabled={loading || !prompt.trim()}
        >
          {loading ? (
            <span>
              <span className="animate-spin inline-block mr-2">🔄</span>
              {prompt.trim() ? 'Analyzing prompt...' : 'Loading...'}
            </span>
          ) : (
            'Generate Family Tree'
          )}
        </button>
        {error && <div className="text-red-500 mt-2 text-center">{error}</div>}
        <div className="mt-6 text-sm text-gray-500">
          <div className="font-semibold mb-1">Example prompt:</div>
          <div className="bg-gray-100 rounded p-2 text-xs">{EXAMPLE_PROMPT}</div>
        </div>
      </div>
    </Modal>
  );
}
