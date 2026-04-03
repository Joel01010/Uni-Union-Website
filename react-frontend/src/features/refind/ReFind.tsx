import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { addDoc, collection, onSnapshot, orderBy, query, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase';

type LostFoundType = 'lost' | 'found';

type LostFoundPost = {
  id: string;
  authorId: string;
  status?: string;
  type: LostFoundType;
  title: string;
  description?: string;
  locationArea?: string;
  createdAt?: { toDate: () => Date };
};

const ReFind: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  const [activeType, setActiveType] = useState<'all' | LostFoundType>('all');
  const [posts, setPosts] = useState<LostFoundPost[]>([]);
  const [error, setError] = useState<string | null>(null);

  // "New lost item add" modal
  const [openModal, setOpenModal] = useState(false);
  const [formType, setFormType] = useState<LostFoundType>('lost');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [locationArea, setLocationArea] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user || loading) return;

    setError(null);

    // Avoid composite where+orderBy index requirements. Order only; filter locally.
    const q = query(collection(db, 'lost_found_posts'), orderBy('createdAt', 'desc'));

    const unsub = onSnapshot(
      q,
      (snap) => {
        const next: LostFoundPost[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<LostFoundPost, 'id'>),
        }));
        setPosts(next);
      },
      (e) => setError(e.message)
    );

    return () => unsub();
  }, [user, loading]);

  const visiblePosts = useMemo(() => {
    let result = posts;
    result = result.filter((p) => p.status === undefined || p.status === 'open');

    if (activeType !== 'all') {
      result = result.filter((p) => p.type === activeType);
    }

    return result;
  }, [activeType, posts]);

  const formatDate = (ts?: { toDate: () => Date }) => {
    if (!ts) return '';
    try {
      return ts.toDate().toLocaleString();
    } catch {
      return '';
    }
  };

  const handleContact = async (post: LostFoundPost) => {
    if (!user) return;
    if (post.authorId === user.uid) return;

    try {
      const chatRef = await addDoc(collection(db, 'chats'), {
        participants: [user.uid, post.authorId],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      navigate(`/chat/${chatRef.id}`);
    } catch (err) {
      setError((err as Error)?.message || 'Failed to start chat');
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const trimmedTitle = title.trim();
    const trimmedLocation = locationArea.trim();
    if (!trimmedTitle || !trimmedLocation) return;

    setSubmitting(true);
    setError(null);

    try {
      await addDoc(collection(db, 'lost_found_posts'), {
        authorId: user.uid,
        status: 'open',
        type: formType,
        title: trimmedTitle,
        description: description.trim(),
        locationArea: trimmedLocation,
        createdAt: serverTimestamp(),
      });

      setOpenModal(false);
      setTitle('');
      setDescription('');
      setLocationArea('');
      setFormType('lost');
    } catch (err) {
      setError((err as Error)?.message || 'Failed to add lost item');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div style={{ padding: 30 }}>Loading...</div>;

  return (
    <div style={{ padding: '30px', backgroundColor: '#F8F6F5', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 800, margin: 0, color: '#111' }}>ReFind</h1>
          <p style={{ marginTop: 8, color: '#555', fontSize: 16 }}>
            Lost and found posts on campus. Add new reports and contact reporters to reunite belongings.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={() => setActiveType('all')}
            style={{
              padding: '10px 18px',
              borderRadius: 999,
              border: activeType === 'all' ? 'none' : '2px solid #e0e0e0',
              backgroundColor: activeType === 'all' ? '#EF2D2D' : 'white',
              color: activeType === 'all' ? 'white' : '#333',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            All
          </button>
          <button
            onClick={() => setActiveType('lost')}
            style={{
              padding: '10px 18px',
              borderRadius: 999,
              border: activeType === 'lost' ? 'none' : '2px solid #e0e0e0',
              backgroundColor: activeType === 'lost' ? '#EF2D2D' : 'white',
              color: activeType === 'lost' ? 'white' : '#333',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Lost
          </button>
          <button
            onClick={() => setActiveType('found')}
            style={{
              padding: '10px 18px',
              borderRadius: 999,
              border: activeType === 'found' ? 'none' : '2px solid #e0e0e0',
              backgroundColor: activeType === 'found' ? '#EF2D2D' : 'white',
              color: activeType === 'found' ? 'white' : '#333',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Found
          </button>
        </div>
      </div>

      {error && (
        <div
          style={{
            marginTop: 16,
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

      <div style={{ marginTop: 22, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))', gap: 16 }}>
        {visiblePosts.length === 0 ? (
          <div style={{ color: '#666' }}>No open posts yet.</div>
        ) : (
          visiblePosts.map((post) => {
            const isMine = post.authorId === user?.uid;
            return (
              <div
                key={post.id}
                style={{
                  backgroundColor: 'white',
                  borderRadius: 16,
                  border: '1px solid #e9ecef',
                  padding: 18,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 800, color: '#EF2D2D', textTransform: 'uppercase' }}>{post.type}</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: '#111', marginTop: 6 }}>{post.title}</div>
                  </div>

                  {!isMine && (
                    <button
                      onClick={() => void handleContact(post)}
                      style={{
                        backgroundColor: '#EF2D2D',
                        border: 'none',
                        color: 'white',
                        padding: '10px 14px',
                        borderRadius: 12,
                        cursor: 'pointer',
                        fontWeight: 800,
                        height: 40,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      Contact
                    </button>
                  )}

                  {isMine && <div style={{ fontSize: 12, fontWeight: 800, color: '#888' }}>Your post</div>}
                </div>

                {post.locationArea && <div style={{ color: '#555' }}>📍 {post.locationArea}</div>}
                {post.description && <div style={{ color: '#333', lineHeight: 1.4 }}>{post.description}</div>}

                <div style={{ marginTop: 4, color: '#888', fontSize: 12 }}>{formatDate(post.createdAt)}</div>
              </div>
            );
          })
        )}
      </div>

      <button
        style={{
          position: 'fixed',
          bottom: 30,
          right: 30,
          width: 60,
          height: 60,
          borderRadius: '50%',
          backgroundColor: '#EF2D2D',
          border: 'none',
          color: 'white',
          fontSize: 28,
          cursor: 'pointer',
          boxShadow: '0 6px 20px rgba(239,45,45,0.4)',
          transition: 'all 0.2s',
          zIndex: 1000,
        }}
        onClick={() => setOpenModal(true)}
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

      {openModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            padding: 18,
          }}
          onClick={() => {
            if (!submitting) setOpenModal(false);
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 720,
              backgroundColor: 'white',
              borderRadius: 18,
              padding: 22,
              boxShadow: '0 18px 50px rgba(0,0,0,0.25)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: '#111' }}>New Lost Item</h2>
                <div style={{ marginTop: 6, color: '#555' }}>Submit a new lost/found post for campus reporting.</div>
              </div>

              <button
                onClick={() => setOpenModal(false)}
                disabled={submitting}
                style={{
                  background: 'transparent',
                  border: '1px solid #e0e0e0',
                  borderRadius: 12,
                  padding: '8px 12px',
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
            </div>

            <form onSubmit={handleCreatePost} style={{ marginTop: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 14 }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <span style={{ fontWeight: 700 }}>Type</span>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as LostFoundType)}
                    style={{ padding: '12px 14px', borderRadius: 12, border: '2px solid #e0e0e0', backgroundColor: 'white' }}
                  >
                    <option value="lost">Lost</option>
                    <option value="found">Found</option>
                  </select>
                </label>

                <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <span style={{ fontWeight: 700 }}>Location / Area</span>
                  <input
                    value={locationArea}
                    onChange={(e) => setLocationArea(e.target.value)}
                    placeholder="e.g., Library Block"
                    style={{ padding: '12px 14px', borderRadius: 12, border: '2px solid #e0e0e0', backgroundColor: 'white' }}
                  />
                </label>
              </div>

              <label style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
                <span style={{ fontWeight: 700 }}>Title</span>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Missing ID card"
                  style={{ padding: '12px 14px', borderRadius: 12, border: '2px solid #e0e0e0', backgroundColor: 'white' }}
                />
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
                <span style={{ fontWeight: 700 }}>Description (optional)</span>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Any additional details to identify the item"
                  rows={4}
                  style={{ padding: '12px 14px', borderRadius: 12, border: '2px solid #e0e0e0', backgroundColor: 'white', resize: 'vertical' }}
                />
              </label>

              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => setOpenModal(false)}
                  style={{
                    backgroundColor: 'white',
                    border: '1px solid #e0e0e0',
                    borderRadius: 12,
                    padding: '12px 16px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    flex: 1,
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting || title.trim().length === 0 || locationArea.trim().length === 0}
                  style={{
                    backgroundColor: submitting ? '#d94a4a' : '#EF2D2D',
                    color: 'white',
                    border: 'none',
                    borderRadius: 12,
                    padding: '12px 16px',
                    fontWeight: 900,
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    flex: 1,
                  }}
                >
                  {submitting ? 'Submitting...' : 'Add Post'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReFind;

