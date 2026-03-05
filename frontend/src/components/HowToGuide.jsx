import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronDown, ChevronUp, Users, UserPlus, Mail, Link, Check, Trees } from 'lucide-react';

const steps = [
  {
    icon: '🌳',
    title: 'Create Your Family',
    color: 'from-green-400 to-emerald-500',
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-700',
    description: 'Click "Create Family" on your Dashboard. Give it a name like "The Smith Family" and an optional description.',
    tips: ['You can create multiple families (e.g. your mother\'s side and father\'s side)', 'You are automatically set as the Admin of any family you create']
  },
  {
    icon: '👤',
    title: 'Add Family Members',
    color: 'from-blue-400 to-indigo-500',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-700',
    description: 'Go to your Family Tree page and click "Add Member". Fill in name, birth date, gender, and any other details you know.',
    tips: ['You can add a profile photo for each member', 'Add as many members as you like (15 on free plan, unlimited on Premium)', 'You can always edit member details later by clicking on them in the tree']
  },
  {
    icon: '🔗',
    title: 'Connect Relationships',
    color: 'from-purple-400 to-violet-500',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    text: 'text-purple-700',
    description: 'Use the Relationship Builder at the bottom of the Family Tree page to connect members. Choose who is a Parent, Child, Spouse, or Sibling of whom.',
    tips: ['Select Member A → choose a relationship type → select Member B → click "Create Relationship"', 'You can also drag connections directly between members on the tree canvas', 'Start from the oldest generation (grandparents) and work down for the clearest tree']
  },
  {
    icon: '📧',
    title: 'Invite Family Members',
    color: 'from-pink-400 to-rose-500',
    bg: 'bg-pink-50',
    border: 'border-pink-200',
    text: 'text-pink-700',
    description: 'Click the "Invite" button on the Family Tree page. Enter your family member\'s email address. They\'ll receive an email with a link to join.',
    tips: ['Invited members will receive a personal email with a one-click join button', 'You can assign them as a Viewer (can look), Editor (can add/edit), or Admin (full control)', 'The invite link is valid for 7 days — if it expires, just send a new one', 'You can also copy the invite link and share it via WhatsApp, SMS, or any other app']
  },
  {
    icon: '✅',
    title: 'Accept an Invitation',
    color: 'from-orange-400 to-amber-500',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    text: 'text-orange-700',
    description: 'When you receive an invite, click the link in the email (or paste it in your browser). Log in or register first if needed, then click "Accept Invitation".',
    tips: ['If you don\'t have an account yet, register first — it\'s free!', 'Once accepted, you\'ll see the family in your Dashboard', "If the link is expired, ask the family admin to send you a new one"]
  },
  {
    icon: '📸',
    title: 'Add Memories & Events',
    color: 'from-teal-400 to-cyan-500',
    bg: 'bg-teal-50',
    border: 'border-teal-200',
    text: 'text-teal-700',
    description: 'Use the "Memories" and "Events" sections to store photos, stories, and important dates for your family.',
    tips: ['Upload photos, write captions, and attach them to specific family members', 'Add birthdays, anniversaries, reunions, and other important events', 'Everyone in the family can see and add memories']
  }
];

export function HowToGuideModal({ isOpen, onClose }) {
  const [expandedStep, setExpandedStep] = useState(null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🌳</span>
            <div>
              <h2 className="text-xl font-bold text-gray-900">How to Build Your Family Tree</h2>
              <p className="text-sm text-gray-500">Follow these steps to get started</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-3">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.06 }}
              className={`rounded-xl border ${step.border} ${step.bg} overflow-hidden`}
            >
              <button
                className="w-full flex items-center gap-4 p-4 text-left"
                onClick={() => setExpandedStep(expandedStep === index ? null : index)}
              >
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${step.color} flex items-center justify-center text-white font-bold text-lg shadow flex-shrink-0`}>
                  {step.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold ${step.text} bg-white/70 px-2 py-0.5 rounded-full`}>
                      Step {index + 1}
                    </span>
                  </div>
                  <p className={`font-semibold ${step.text} mt-0.5`}>{step.title}</p>
                </div>
                {expandedStep === index ? (
                  <ChevronUp size={18} className={step.text} />
                ) : (
                  <ChevronDown size={18} className={step.text} />
                )}
              </button>
              <AnimatePresence>
                {expandedStep === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 pt-0 pl-[72px]">
                      <p className="text-gray-700 text-sm mb-3">{step.description}</p>
                      <ul className="space-y-1.5">
                        {step.tips.map((tip, tipIndex) => (
                          <li key={tipIndex} className="flex items-start gap-2 text-sm text-gray-600">
                            <Check size={14} className={`${step.text} mt-0.5 flex-shrink-0`} />
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

        <div className="px-6 pb-6">
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <span className="text-xl">✨</span>
              <div>
                <p className="font-semibold text-indigo-900 text-sm">Pro Tip: Use AI to build faster!</p>
                <p className="text-indigo-700 text-sm mt-1">
                  On the Family Tree page, click <strong>"✨ Auto-Generate with AI"</strong> and describe your family in plain text.
                  The AI will add all the members and connections for you instantly.
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export function InviteGuideCard() {
  return (
    <div className="bg-gradient-to-r from-pink-50 to-indigo-50 border border-pink-200 rounded-xl p-5">
      <h3 className="font-bold text-gray-900 text-base mb-3 flex items-center gap-2">
        <Mail size={18} className="text-pink-500" />
        How to Invite Family Members
      </h3>
      <ol className="space-y-3">
        {[
          { icon: '1', text: 'Click the "Invite" button at the top of your Family Tree page.' },
          { icon: '2', text: "Enter your family member's email address and choose their role (Viewer / Editor / Admin)." },
          { icon: '3', text: 'Click "Send Invite". They will receive an email with a special link.' },
          { icon: '4', text: 'They click the link in the email, log in (or register for free), then click "Accept Invitation".' },
          { icon: '5', text: 'They now appear in your family and can view or edit the tree!' },
        ].map(({ icon, text }) => (
          <li key={icon} className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-pink-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
              {icon}
            </span>
            <span className="text-sm text-gray-700">{text}</span>
          </li>
        ))}
      </ol>
      <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-3">
        <p className="text-xs text-amber-700">
          <strong>💡 Tip:</strong> You can also copy the invite link and share it via WhatsApp, SMS, or email manually.
          The link is valid for <strong>7 days</strong>.
        </p>
      </div>
    </div>
  );
}
