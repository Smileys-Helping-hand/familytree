import React, { useState } from 'react';
import Modal from 'react-modal';
import { ChevronDown, ChevronUp, Zap, BookOpen, Users } from 'lucide-react';

const PROMPT_EXAMPLES = [
  {
    category: 'Simple Family',
    icon: '👨‍👩‍👧',
    prompts: [
      {
        label: 'Nuclear family',
        text: 'My father is James and my mother is Linda. They have two children: me (Sarah) and my brother Tom. Tom is married to Kate.',
      },
      {
        label: 'Single parent',
        text: 'Maria is a single mother with three children: Carlos, Luis, and Ana. Carlos is the oldest and Ana is the youngest.',
      },
    ],
  },
  {
    category: 'Multi-Generation',
    icon: '🌳',
    prompts: [
      {
        label: 'Three generations',
        text: 'My grandparents are William and Rose. They had two sons: my father David and my uncle Robert. David married Susan and they had me (Emily) and my sister Claire. Robert married Patricia and they have one son, Mark.',
      },
      {
        label: 'Four generations',
        text: 'Great-grandparents Henry and Edna had a son called George. George married Martha and had two children: my grandfather Frank and his sister Dorothy. Frank married Alice and they had my father Ron and aunt Peg. Ron married my mother Joan and they had me, Oliver.',
      },
    ],
  },
  {
    category: 'Extended Family',
    icon: '🏡',
    prompts: [
      {
        label: 'Blended family',
        text: 'John and Mary are married. John has a daughter Lisa from a previous marriage to Helen. Mary has a son Ben from her first marriage to Peter. John and Mary also have two children together: twins Sophie and Michael.',
      },
      {
        label: 'Large family',
        text: 'Patriarch Antonio married Rosa and had five children: Marco, Lucia, Enzo, Nina, and Pia. Marco married Elena and has three kids: Giulia, Luca, and Mia. Lucia married Stefan and has no children yet. Enzo is unmarried. Nina married Carlos and has a daughter, Isabella. Pia is the youngest and still a child.',
      },
    ],
  },
];

const PROMPT_TIPS = [
  'Name every person clearly — first and last names work best.',
  'Describe relationships explicitly: "X is the father of Y", "X married Y".',
  'Mention whether people are living or deceased if known.',
  'Include generation context: grandparents → parents → children.',
  'Keep it factual — avoid vague pronouns like "they had kids".',
];

export default function AIGeneratorModal({
  isOpen,
  onClose,
  onGenerate,
  memberCount = 0,
  freeLimit = 15,
  isPremium = false,
}) {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showGuide, setShowGuide] = useState(true);
  const [activeCategory, setActiveCategory] = useState(0);

  const isAtLimit = !isPremium && memberCount >= freeLimit;
  const remaining = isPremium ? null : Math.max(0, freeLimit - memberCount);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setError('');
    try {
      await onGenerate(prompt.trim());
      setPrompt('');
      onClose();
    } catch (err) {
      const msg = err?.response?.data?.error || err?.message || 'Failed to generate family tree.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleExampleClick = (text) => {
    setPrompt(text);
    setShowGuide(false);
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      overlayClassName="fixed inset-0 bg-black bg-opacity-50 z-40"
      ariaHideApp={false}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl relative max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-t-2xl px-6 py-5">
          <button
            className="absolute top-4 right-4 text-white/80 hover:text-white text-2xl leading-none"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
          <div className="flex items-center gap-3">
            <Zap size={28} className="text-yellow-300" />
            <div>
              <h2 className="text-xl font-bold text-white">AI Family Tree Generator</h2>
              <p className="text-indigo-200 text-sm mt-0.5">
                Describe your family in plain text — AI will build the tree for you
              </p>
            </div>
          </div>

          {/* Free plan indicator */}
          {!isPremium && (
            <div className="mt-3 bg-white/10 rounded-lg px-3 py-2 flex items-center justify-between">
              <span className="text-white text-sm">
                Free plan: <strong>{memberCount}</strong> / <strong>{freeLimit}</strong> members used
              </span>
              {isAtLimit ? (
                <a href="/pricing" className="text-yellow-300 hover:text-yellow-100 text-xs font-semibold underline">
                  Upgrade for unlimited
                </a>
              ) : (
                <span className="text-indigo-200 text-xs">{remaining} slot{remaining !== 1 ? 's' : ''} remaining</span>
              )}
            </div>
          )}
        </div>

        <div className="p-6 space-y-5">
          {/* Limit warning */}
          {isAtLimit && (
            <div className="bg-amber-50 border border-amber-300 rounded-lg p-4 text-center">
              <p className="font-semibold text-amber-800">Free plan limit reached</p>
              <p className="text-sm text-amber-700 mt-1">
                You've used all {freeLimit} free member slots.{' '}
                <a href="/pricing" className="text-amber-900 font-semibold underline">Upgrade to Premium</a>
                {' '}for unlimited members.
              </p>
            </div>
          )}

          {/* Prompt textarea */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Describe your family
            </label>
            <textarea
              className="w-full border border-gray-300 rounded-xl p-3 min-h-[130px] text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-y disabled:bg-gray-50 disabled:text-gray-400"
              placeholder="e.g. My grandfather Arthur married Martha. They had two children: my dad John and aunt Sarah. John married Jane and they had me, Alex..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={loading || isAtLimit}
            />
            <div className="flex justify-between items-center mt-1">
              <span className="text-xs text-gray-400">{prompt.length} characters</span>
              {prompt.length > 0 && (
                <button
                  type="button"
                  onClick={() => setPrompt('')}
                  className="text-xs text-gray-400 hover:text-gray-600"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Generate button */}
          <button
            className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold text-base shadow hover:from-indigo-600 hover:to-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            onClick={handleGenerate}
            disabled={loading || !prompt.trim() || isAtLimit}
          >
            {loading ? (
              <>
                <span className="animate-spin inline-block">⏳</span>
                Analyzing your family description…
              </>
            ) : (
              <>
                <Zap size={18} />
                Generate Family Tree
              </>
            )}
          </button>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm text-center">
              {error}
            </div>
          )}

          {/* Prompt Guide (collapsible) */}
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <button
              type="button"
              className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition text-sm font-semibold text-gray-700"
              onClick={() => setShowGuide((v) => !v)}
            >
              <span className="flex items-center gap-2">
                <BookOpen size={16} className="text-indigo-500" />
                Prompt Guide &amp; Examples
              </span>
              {showGuide ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {showGuide && (
              <div className="p-4 space-y-4">
                {/* Tips */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Writing tips</p>
                  <ul className="space-y-1.5">
                    {PROMPT_TIPS.map((tip, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                        <span className="text-indigo-400 font-bold mt-0.5">✓</span>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Category tabs */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Example prompts</p>
                  <div className="flex gap-2 mb-3 flex-wrap">
                    {PROMPT_EXAMPLES.map((cat, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setActiveCategory(i)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${
                          activeCategory === i
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {PROMPT_EXAMPLES[i].icon} {PROMPT_EXAMPLES[i].category}
                      </button>
                    ))}
                  </div>

                  <div className="space-y-3">
                    {PROMPT_EXAMPLES[activeCategory].prompts.map((example, i) => (
                      <div
                        key={i}
                        className="border border-gray-200 rounded-lg p-3 hover:border-indigo-300 hover:bg-indigo-50 transition cursor-pointer group"
                        onClick={() => handleExampleClick(example.text)}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-semibold text-indigo-600">{example.label}</span>
                          <span className="text-xs text-gray-400 group-hover:text-indigo-500">
                            Click to use →
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 leading-relaxed">{example.text}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Format reference */}
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">What the AI extracts</p>
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                    <div className="flex items-center gap-1"><span className="text-indigo-400">●</span> Full name</div>
                    <div className="flex items-center gap-1"><span className="text-indigo-400">●</span> Gender</div>
                    <div className="flex items-center gap-1"><span className="text-indigo-400">●</span> Living / deceased</div>
                    <div className="flex items-center gap-1"><span className="text-indigo-400">●</span> Parent relationships</div>
                    <div className="flex items-center gap-1"><span className="text-indigo-400">●</span> Spouse relationships</div>
                    <div className="flex items-center gap-1"><span className="text-indigo-400">●</span> Sibling relationships</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}

