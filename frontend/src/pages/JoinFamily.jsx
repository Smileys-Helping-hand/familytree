import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { familyAPI } from '../services/api';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Users, CheckCircle, AlertCircle, LogIn, UserPlus } from 'lucide-react';

export default function JoinFamily() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [joining, setJoining] = useState(false);
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token) {
      setError('No invite token was found in this link. Please check the link you received and try again.');
    }
  }, [token]);

  const handleAccept = async () => {
    setJoining(true);
    setError(null);
    try {
      await familyAPI.joinFamily(token);
      setJoined(true);
      toast.success('Welcome to the family! 🎉');
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to join family. The invite link may have expired.';
      setError(msg);
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-pink-50">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 rounded-full border-4 border-indigo-600 border-t-transparent"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-pink-50 px-4 py-12">
      {/* Brand */}
      <motion.div
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="mb-8 text-center"
      >
        <Link to="/" className="inline-block">
          <div className="text-4xl font-bold text-indigo-600 flex items-center gap-2 justify-center">
            <span>🌳</span>
            <span>Family Tree</span>
          </div>
        </Link>
      </motion.div>

      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
      >
        {/* Header strip */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-8 py-8 text-center">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Family Invitation</h1>
          <p className="text-indigo-200 text-sm mt-1">You've been invited to join a family tree</p>
        </div>

        <div className="px-8 py-8">
          {/* Success state */}
          {joined ? (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center"
            >
              <CheckCircle size={56} className="text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">You're in! 🎉</h2>
              <p className="text-gray-600 mb-6">
                You've successfully joined the family. Your family tree is ready to explore.
              </p>
              <button
                className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-bold text-lg hover:opacity-90 transition-opacity"
                onClick={() => navigate('/family-tree')}
              >
                View Family Tree →
              </button>
              <button
                className="w-full mt-3 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                onClick={() => navigate('/dashboard')}
              >
                Go to Dashboard
              </button>
            </motion.div>
          ) : error ? (
            /* Error state */
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center"
            >
              <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-red-700 mb-2">Something Went Wrong</h2>
              <p className="text-gray-600 mb-2">{error}</p>
              <p className="text-sm text-gray-500 mb-6">
                Common causes: the link has expired (links are valid for 7 days), or you're already a member of this family.
              </p>
              <button
                className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                onClick={() => navigate('/dashboard')}
              >
                Go to Dashboard
              </button>
            </motion.div>
          ) : !user ? (
            /* Not logged in */
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center"
            >
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-left">
                <p className="text-sm font-semibold text-amber-800 mb-1">🔐 Sign in to accept your invitation</p>
                <p className="text-sm text-amber-700">
                  You need to be logged in to join a family. Don't have an account? Register for free — it only takes 30 seconds!
                </p>
              </div>

              <div className="space-y-3">
                <Link
                  to={`/login?redirect=${encodeURIComponent(`/join/${token}`)}`}
                  className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-bold text-lg hover:opacity-90 transition-opacity"
                >
                  <LogIn size={20} />
                  Log In to Accept
                </Link>
                <Link
                  to={`/register?redirect=${encodeURIComponent(`/join/${token}`)}`}
                  className="flex items-center justify-center gap-2 w-full py-3 bg-white border-2 border-indigo-400 text-indigo-600 rounded-xl font-bold text-lg hover:bg-indigo-50 transition-colors"
                >
                  <UserPlus size={20} />
                  Register for Free
                </Link>
              </div>

              <p className="text-xs text-gray-400 mt-4">
                After signing in, you'll be taken back here to accept your invitation.
              </p>
            </motion.div>
          ) : (
            /* Logged in — ready to accept */
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center"
            >
              <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-6 text-left">
                <p className="text-sm font-semibold text-indigo-800 mb-1">👋 Hi {user.name?.split(' ')[0]}!</p>
                <p className="text-sm text-indigo-700">
                  You've been invited to join a family tree. Click the button below to accept and see everyone in the family.
                </p>
              </div>

              <button
                onClick={handleAccept}
                disabled={joining}
                className="w-full py-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-bold text-xl hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-3"
              >
                {joining ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-5 h-5 rounded-full border-2 border-white border-t-transparent"
                    />
                    Joining...
                  </>
                ) : (
                  <>
                    <CheckCircle size={24} />
                    Accept Invitation ✅
                  </>
                )}
              </button>

              <p className="text-xs text-gray-400 mt-4">
                By accepting, you'll become a member of this family tree and can view its contents.
              </p>
            </motion.div>
          )}
        </div>
      </motion.div>

      <p className="text-xs text-gray-400 mt-6 text-center max-w-sm">
        Didn't expect this invitation? You can safely ignore this page. No action will be taken unless you click "Accept Invitation".
      </p>
    </div>
  );
}

