import React, { useEffect, useMemo, useState } from 'react';
import {
  Timestamp,
  addDoc,
  collection,
  increment,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  doc,
} from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase';

type EmptyClassPost = {
  id: string;
  block: string;
  room: string;
  notes?: string;
  capacity?: number | null;
  authorId: string;
  spottedAt?: Timestamp;
  expiresAt?: Timestamp;
  confirmationsCount?: number;
  reportsCount?: number;
};

const Locator: React.FC = () => {
  const { user, loading } = useAuth();

  const [posts, setPosts] = useState<EmptyClassPost[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [block, setBlock] = useState('');
  const [room, setRoom] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [notes, setNotes] = useState('');
  const [capacity, setCapacity] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user || loading) return;

    setError(null);

    const q = query(collection(db, 'empty_class_posts'), orderBy('expiresAt', 'asc'));

    const unsub = onSnapshot(
      q,
      (snap) => {
        const next: EmptyClassPost[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<EmptyClassPost, 'id'>),
        }));
        setPosts(next);
      },
      (e) => setError(e.message)
    );

    return () => unsub();
  }, [user, loading]);

  const activePosts = useMemo(() => {
    return posts.filter((p) => {
      if (!p.expiresAt) return true;
      return p.expiresAt.toMillis() >= Date.now();
    });
  }, [posts]);

  const formatTimeWindow = (p: EmptyClassPost) => {
    if (!p.spottedAt || !p.expiresAt) return '';
    try {
      const start = p.spottedAt.toDate();
      const end = p.expiresAt.toDate();
      return `${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}–${end.toLocaleTimeString(
        [],
        { hour: '2-digit', minute: '2-digit' }
      )}`;
    } catch {
      return '';
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const trimmedBlock = block.trim();
    const trimmedRoom = room.trim();
    if (!trimmedBlock || !trimmedRoom) return;

    setSubmitting(true);
    setError(null);

    try {
      const now = new Date();
      const expires = new Date(now.getTime() + durationMinutes * 60 * 1000);

      await addDoc(collection(db, 'empty_class_posts'), {
        authorId: user.uid,
        block: trimmedBlock,
        room: trimmedRoom,
        notes: notes.trim(),
        capacity: capacity.trim() ? Number(capacity) : null,
        spottedAt: serverTimestamp(),
        expiresAt: Timestamp.fromDate(expires),
        confirmationsCount: 0,
        reportsCount: 0,
      });

      setBlock('');
      setRoom('');
      setDurationMinutes(60);
      setNotes('');
      setCapacity('');
    } catch (err) {
      setError((err as Error)?.message || 'Failed to add empty room');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirm = async (post: EmptyClassPost) => {
    try {
      await updateDoc(doc(db, 'empty_class_posts', post.id), {
        confirmationsCount: increment(1),
      });
    } catch (err) {
      setError((err as Error)?.message || 'Failed to confirm');
    }
  };

  const handleReport = async (post: EmptyClassPost) => {
    try {
      await updateDoc(doc(db, 'empty_class_posts', post.id), {
        reportsCount: increment(1),
      });
    } catch (err) {
      setError((err as Error)?.message || 'Failed to report');
    }
  };

  if (loading) return <div style={{ padding: 30 }}>Loading...</div>;

  return (
    <div style={{ padding: '30px', backgroundColor: '#F8F6F5', minHeight: '100vh' }}>
      <h1 style={{ fontSize: 32, fontWeight: 800, color: '#111', marginBottom: 8 }}>RoomRadar</h1>
      <p style={{ fontSize: 16, color: '#555', marginBottom: 24 }}>
        Crowd‑sourced empty classroom reports. Add a new empty room and confirm or report posts from others.
      </p>

      {error && (
        <div
          style={{
            marginBottom: 18,
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

      <form
        onSubmit={handleCreate}
        style={{
          backgroundColor: 'white',
          borderRadius: 18,
          padding: 18,
          border: '1px solid #e9ecef',
          marginBottom: 26,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 14,
          alignItems: 'flex-end',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontWeight: 700, fontSize: 13 }}>Block</label>
          <input
            value={block}
            onChange={(e) => setBlock(e.target.value)}
            placeholder="e.g., MB, AB, TT"
            style={{ padding: '10px 12px', borderRadius: 10, border: '2px solid #e0e0e0', backgroundColor: 'white' }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontWeight: 700, fontSize: 13 }}>Room</label>
          <input
            value={room}
            onChange={(e) => setRoom(e.target.value)}
            placeholder="e.g., 203"
            style={{ padding: '10px 12px', borderRadius: 10, border: '2px solid #e0e0e0', backgroundColor: 'white' }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontWeight: 700, fontSize: 13 }}>Free for</label>
          <select
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(Number(e.target.value))}
            style={{ padding: '10px 12px', borderRadius: 10, border: '2px solid #e0e0e0', backgroundColor: 'white' }}
          >
            <option value={30}>30 minutes</option>
            <option value={60}>1 hour</option>
            <option value={90}>1.5 hours</option>
            <option value={120}>2 hours</option>
          </select>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontWeight: 700, fontSize: 13 }}>Capacity (optional)</label>
          <input
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
            placeholder="e.g., 40"
            style={{ padding: '10px 12px', borderRadius: 10, border: '2px solid #e0e0e0', backgroundColor: 'white' }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 220 }}>
          <label style={{ fontWeight: 700, fontSize: 13 }}>Notes (optional)</label>
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g., Projector, AC"
            style={{ padding: '10px 12px', borderRadius: 10, border: '2px solid #e0e0e0', backgroundColor: 'white' }}
          />
        </div>

        <button
          type="submit"
          disabled={submitting || !block.trim() || !room.trim()}
          style={{
            backgroundColor: submitting ? '#d94a4a' : '#EF2D2D',
            color: 'white',
            border: 'none',
            borderRadius: 12,
            padding: '12px 18px',
            fontWeight: 800,
            cursor: submitting ? 'not-allowed' : 'pointer',
            minWidth: 170,
          }}
        >
          {submitting ? 'Posting...' : 'Post Empty Room'}
        </button>
      </form>

      {activePosts.length === 0 ? (
        <div style={{ color: '#666' }}>No active empty-room posts yet.</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 18 }}>
          {activePosts.map((post) => (
            <div
              key={post.id}
              style={{
                backgroundColor: 'white',
                borderRadius: 16,
                border: '1px solid #e9ecef',
                padding: 18,
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 800, color: '#EF2D2D', textTransform: 'uppercase' }}>{post.block}</div>
                  <div style={{ fontSize: 20, fontWeight: 800, marginTop: 4 }}>Room {post.room}</div>
                </div>
                <div style={{ fontSize: 12, color: '#666' }}>{formatTimeWindow(post)}</div>
              </div>

              {post.capacity ? <div style={{ color: '#555', fontSize: 14 }}>Capacity approx. {post.capacity} seats</div> : null}
              {post.notes ? <div style={{ color: '#333', fontSize: 14, lineHeight: 1.4 }}>{post.notes}</div> : null}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, gap: 12 }}>
                <div style={{ fontSize: 13, color: '#555' }}>
                  ✅ {post.confirmationsCount ?? 0} &nbsp;|&nbsp; ⚠️ {post.reportsCount ?? 0}
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => void handleConfirm(post)}
                    style={{
                      borderRadius: 999,
                      border: '1px solid #d1e7dd',
                      backgroundColor: '#e9f7ef',
                      color: '#146c43',
                      padding: '6px 10px',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Still empty
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleReport(post)}
                    style={{
                      borderRadius: 999,
                      border: '1px solid #f8d7da',
                      backgroundColor: '#fcebec',
                      color: '#b02a37',
                      padding: '6px 10px',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Taken
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Locator;

