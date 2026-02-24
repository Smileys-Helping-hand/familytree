import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { familyAPI } from '../services/api';
import toast from 'react-hot-toast';

export default function JoinFamily() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token) {
      setError('No invite token provided.');
      return;
    }
  }, [token]);

  const handleAccept = () => {
    setJoining(true);
    familyAPI.joinFamily(token)
      .then(res => {
        toast.success('Joined family successfully!');
        navigate('/family-tree');
      })
      .catch(err => {
        setError(err.response?.data?.error || 'Failed to join family.');
      })
      .finally(() => setJoining(false));
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center">
        <h2 className="text-2xl font-bold">Sign in to join family</h2>
        <p className="text-gray-600">You need to log in or register to accept your family invitation.</p>
        <div className="flex gap-4">
          <button className="btn btn-primary" onClick={() => navigate('/login')}>Login</button>
          <button className="btn btn-secondary" onClick={() => navigate('/register')}>Register</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center">
      {joining ? (
        <div>Joining family...</div>
      ) : error ? (
        <>
          <h2 className="text-2xl font-bold text-red-600">{error}</h2>
          <button className="btn btn-primary mt-4" onClick={() => navigate('/dashboard')}>Go to Dashboard</button>
        </>
      ) : (
        <>
          <h2 className="text-2xl font-bold">Accept your invitation to join the family</h2>
          <button className="btn btn-primary mt-4" onClick={handleAccept} disabled={joining}>
            {joining ? 'Joining...' : 'Accept Invitation'}
          </button>
        </>
      )}
    </div>
  );
}
