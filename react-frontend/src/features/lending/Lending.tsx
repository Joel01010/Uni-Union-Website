import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { addDoc, collection, onSnapshot, orderBy, query, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase';

type ListingType = 'money' | 'essentials';

type Listing = {
  id: string;
  title: string;
  locationArea: string;
  type: ListingType;
  ownerId: string;
  status?: string;
  createdAt?: unknown;
  distanceMeters?: number;
};

const Lending: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  const [activeFilter, setActiveFilter] = useState<'all' | 'nearby' | 'urgent'>('all');
  const [searchText, setSearchText] = useState('');
  const [listings, setListings] = useState<Listing[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user || loading) return;

    setError(null);

    // Avoid where+orderBy composite indexes; filter locally instead.
    const q = query(collection(db, 'listings'), orderBy('createdAt', 'desc'));

    const unsub = onSnapshot(
      q,
      (snap) => {
        const next: Listing[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<Listing, 'id'>),
        }));
        setListings(next);
      },
      (e) => setError(e.message)
    );

    return () => unsub();
  }, [user, loading]);

  const visibleListings = useMemo(() => {
    const q = searchText.trim().toLowerCase();

    let result = listings;

    // Match security-rule expectation / original behavior.
    result = result.filter((l) => l.status === undefined || l.status === 'active');

    if (activeFilter === 'urgent') {
      result = result.filter((l) => l.type === 'money');
    }

    if (activeFilter === 'nearby') {
      // If distanceMeters exists, use it. Otherwise fallback to a simple heuristic.
      result = result.filter((l) => {
        if (typeof l.distanceMeters === 'number') return l.distanceMeters <= 500;
        const loc = (l.locationArea || '').toLowerCase();
        return loc.includes('hostel') || loc.includes('block') || loc.includes('library');
      });
    }

    if (q.length > 0) {
      result = result.filter((l) => {
        const inTitle = (l.title || '').toLowerCase().includes(q);
        const inLocation = (l.locationArea || '').toLowerCase().includes(q);
        return inTitle || inLocation;
      });
    }

    return result;
  }, [activeFilter, listings, searchText]);

  const handleAccept = async (listing: Listing) => {
    if (!user) return;
    if (acceptingId === listing.id) return;

    setAcceptingId(listing.id);
    setError(null);

    try {
      const chatRef = await addDoc(collection(db, 'chats'), {
        participants: [user.uid, listing.ownerId],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      navigate(`/chat/${chatRef.id}`);
    } catch (err) {
      setError((err as Error)?.message || 'Failed to accept');
    } finally {
      setAcceptingId(null);
    }
  };

  const FilterPill: React.FC<{ label: string; isSelected: boolean; onClick: () => void }> = ({ label, isSelected, onClick }) => (
    <button
      onClick={onClick}
      style={{
        padding: '12px 24px',
        backgroundColor: isSelected ? '#EF2D2D' : 'white',
        color: isSelected ? 'white' : '#333',
        border: isSelected ? 'none' : '2px solid #e0e0e0',
        borderRadius: '25px',
        fontWeight: '600',
        fontSize: '14px',
        cursor: 'pointer',
        transition: 'all 0.2s',
        boxShadow: isSelected ? '0 4px 12px rgba(239,45,45,0.3)' : 'none',
      }}
    >
      {label}
    </button>
  );

  const ListingCard: React.FC<{ listing: Listing }> = ({ listing }) => (
    <div
      style={{
        height: '280px',
        borderRadius: '20px',
        background: 'linear-gradient(135deg, #2C3E50, #000000)',
        boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        padding: '25px',
        color: 'white',
        transition: 'transform 0.2s, box-shadow 0.2s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-5px)';
        e.currentTarget.style.boxShadow = '0 12px 35px rgba(0,0,0,0.2)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)';
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          backgroundColor: 'rgba(0,0,0,0.7)',
          padding: '8px 16px',
          borderRadius: '15px',
          fontSize: '11px',
          fontWeight: 'bold',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}
      >
        {listing.type === 'money' ? 'URGENT' : 'ESSENTIALS'}
      </div>

      <h3 style={{ margin: '0 0 8px 0', fontSize: '22px', fontWeight: 'bold', lineHeight: '1.2' }}>
        {listing.title}
      </h3>

      <p style={{ margin: '0 0 20px 0', fontSize: '16px', opacity: 0.8, lineHeight: '1.4' }}>
        {listing.locationArea}
      </p>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', fontSize: '14px', opacity: 0.8 }}>
          <span style={{ marginRight: '6px', fontSize: '16px' }}>📍</span>
          200m away
        </div>

        <button
          style={{
            backgroundColor: '#EF2D2D',
            color: 'white',
            border: 'none',
            padding: '14px 28px',
            borderRadius: '25px',
            fontWeight: 'bold',
            fontSize: '16px',
            cursor: acceptingId === listing.id ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.2s',
            opacity: acceptingId === listing.id ? 0.7 : 1,
          }}
          onClick={(e) => {
            e.stopPropagation();
            void handleAccept(listing);
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#d02525')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#EF2D2D')}
          disabled={acceptingId === listing.id}
        >
          {acceptingId === listing.id ? 'Accepting...' : 'Accept'}
        </button>
      </div>
    </div>
  );

  if (loading) return <div style={{ padding: 30 }}>Loading...</div>;

  return (
    <div style={{ backgroundColor: '#F8F6F5', minHeight: '100vh', padding: '20px' }}>
      <div style={{ padding: '20px 0 0 0', marginBottom: '30px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ color: '#EF2D2D', marginRight: '12px', fontSize: '24px' }}>📍</span>
            <span style={{ fontWeight: 'bold', fontSize: '20px' }}>VIT Chennai</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <button
              style={{
                backgroundColor: 'white',
                border: '1px solid #e0e0e0',
                borderRadius: '50%',
                width: '48px',
                height: '48px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '20px',
              }}
              // Notifications are UI-only for now.
            >
              🔔
            </button>
            <img
              src="https://i.pravatar.cc/150?img=11"
              alt="Profile"
              style={{ width: '48px', height: '48px', borderRadius: '50%', cursor: 'pointer', border: '2px solid #e0e0e0' }}
              onClick={() => navigate('/profile')}
            />
          </div>
        </div>
      </div>

      <div style={{ padding: '30px 0', marginBottom: '30px' }}>
        <div style={{ display: 'flex', gap: '20px', marginBottom: '30px', alignItems: 'center' }}>
          <FilterPill label="All Requests" isSelected={activeFilter === 'all'} onClick={() => setActiveFilter('all')} />
          <FilterPill label="Nearby" isSelected={activeFilter === 'nearby'} onClick={() => setActiveFilter('nearby')} />
          <FilterPill label="Urgent" isSelected={activeFilter === 'urgent'} onClick={() => setActiveFilter('urgent')} />
        </div>

        <div style={{ maxWidth: '500px' }}>
          <input
            type="text"
            placeholder="Search for items..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{
              width: '100%',
              padding: '16px 20px',
              borderRadius: '12px',
              border: '2px solid #e0e0e0',
              backgroundColor: 'white',
              fontSize: '16px',
              boxSizing: 'border-box',
              outline: 'none',
              transition: 'border-color 0.2s',
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = '#EF2D2D')}
            onBlur={(e) => (e.currentTarget.style.borderColor = '#e0e0e0')}
          />
        </div>
      </div>

      {error && (
        <div
          style={{
            marginBottom: 16,
            padding: 12,
            backgroundColor: 'rgba(239,45,45,0.08)',
            border: '1px solid #EF2D2D',
            color: '#EF2D2D',
            borderRadius: 10,
          }}
        >
          {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '25px' }}>
        {visibleListings.map((listing) => (
          <ListingCard key={listing.id} listing={listing} />
        ))}
      </div>

      <button
        style={{
          position: 'fixed',
          bottom: '30px',
          right: '30px',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          backgroundColor: '#EF2D2D',
          border: 'none',
          color: 'white',
          fontSize: '28px',
          cursor: 'pointer',
          boxShadow: '0 6px 20px rgba(239,45,45,0.4)',
          transition: 'all 0.2s',
          zIndex: 1000,
        }}
        onClick={() => navigate('/lending/create')}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.1)';
          e.currentTarget.style.boxShadow = '0 8px 25px rgba(239,45,45,0.5)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = '0 6px 20px rgba(239,45,45,0.4)';
        }}
      >
        +
      </button>
    </div>
  );
};

export default Lending;

