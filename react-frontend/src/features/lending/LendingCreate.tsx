import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase';

type ListingType = 'money' | 'essentials';

const LendingCreate: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  const [title, setTitle] = useState('');
  const [locationArea, setLocationArea] = useState('');
  const [type, setType] = useState<ListingType>('essentials');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitDisabled = useMemo(() => {
    if (loading) return true;
    return !user || submitting || title.trim().length === 0 || locationArea.trim().length === 0;
  }, [loading, user, submitting, title, locationArea]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSubmitting(true);
    setError(null);

    try {
      await addDoc(collection(db, 'listings'), {
        title: title.trim(),
        locationArea: locationArea.trim(),
        type,
        status: 'active',
        ownerId: user.uid,
        createdAt: serverTimestamp(),
      });

      navigate('/lending');
    } catch (err) {
      setError((err as Error)?.message || 'Failed to create listing');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: '30px', backgroundColor: '#F8F6F5', minHeight: '100%' }}>
      <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#111', marginBottom: '10px' }}>
        Create Lending Request
      </h1>
      <p style={{ marginBottom: '25px', color: '#555' }}>
        Post what you need to borrow or lend. Only VIT students can create listings.
      </p>

      <form onSubmit={handleSubmit} style={{ maxWidth: '720px' }}>
        {error && (
          <div
            style={{
              marginBottom: '16px',
              padding: '12px 14px',
              backgroundColor: 'rgba(239,45,45,0.08)',
              border: '1px solid #EF2D2D',
              color: '#EF2D2D',
              borderRadius: '10px',
            }}
          >
            {error}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontWeight: 600 }}>Title</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Looking for charger"
              style={{
                padding: '14px 16px',
                borderRadius: '12px',
                border: '2px solid #e0e0e0',
                backgroundColor: 'white',
              }}
            />
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontWeight: 600 }}>Type</span>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as ListingType)}
              style={{
                padding: '14px 16px',
                borderRadius: '12px',
                border: '2px solid #e0e0e0',
                backgroundColor: 'white',
              }}
            >
              <option value="essentials">Essentials</option>
              <option value="money">Money</option>
            </select>
          </label>
        </div>

        <label style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
          <span style={{ fontWeight: 600 }}>Location / Area</span>
          <input
            value={locationArea}
            onChange={(e) => setLocationArea(e.target.value)}
            placeholder="e.g., Hostel A"
            style={{
              padding: '14px 16px',
              borderRadius: '12px',
              border: '2px solid #e0e0e0',
              backgroundColor: 'white',
            }}
          />
        </label>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            type="button"
            onClick={() => navigate('/lending')}
            style={{
              backgroundColor: 'white',
              border: '1px solid #e0e0e0',
              borderRadius: '12px',
              padding: '12px 16px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={submitDisabled}
            style={{
              backgroundColor: submitDisabled ? '#d94a4a' : '#EF2D2D',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              padding: '12px 16px',
              fontWeight: 700,
              cursor: submitDisabled ? 'not-allowed' : 'pointer',
              flex: 1,
            }}
          >
            {submitting ? 'Creating...' : 'Post'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default LendingCreate;

