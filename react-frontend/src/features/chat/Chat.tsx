import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  addDoc,
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase';

type ChatMessage = {
  id: string;
  senderId: string;
  text: string;
  createdAt?: { toDate: () => Date };
};

type ChatDoc = {
  participants: string[];
  updatedAt?: unknown;
};

const Chat: React.FC = () => {
  const { chatId } = useParams<{ chatId: string }>();
  const { user, loading } = useAuth();

  const [chat, setChat] = useState<(ChatDoc & { id: string }) | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!chatId) return;

    const unsub = onSnapshot(doc(db, 'chats', chatId), (snap) => {
      if (!snap.exists()) {
        setChat(null);
        return;
      }

      setChat({ id: snap.id, ...(snap.data() as ChatDoc) });
    });

    return () => unsub();
  }, [chatId]);

  useEffect(() => {
    if (!chatId) return;

    const msgsQuery = query(
      collection(db, 'chats', chatId, 'messages'),
      orderBy('createdAt', 'desc'),
      limit(100)
    );

    const unsub = onSnapshot(msgsQuery, (snap) => {
      const next: ChatMessage[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<ChatMessage, 'id'>),
      }));
      setMessages(next);
    });

    return () => unsub();
  }, [chatId]);

  useEffect(() => {
    // Scroll to bottom on new messages.
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const isParticipant = useMemo(() => {
    if (!user || !chat?.participants) return false;
    return chat.participants.includes(user.uid);
  }, [user, chat]);

  const handleSend = async () => {
    if (!chatId) return;
    if (!user) return;
    if (sending) return;

    const trimmed = text.trim();
    if (!trimmed) return;

    setSending(true);
    setError(null);

    try {
      if (!chat?.participants?.includes(user.uid)) {
        throw new Error('You are not a participant of this chat.');
      }

      await addDoc(collection(db, 'chats', chatId, 'messages'), {
        senderId: user.uid,
        text: trimmed,
        createdAt: serverTimestamp(),
      });

      // Helps the sidebar/queries using updatedAt.
      await updateDoc(doc(db, 'chats', chatId), {
        updatedAt: serverTimestamp(),
      });

      setText('');
    } catch (err) {
      setError((err as Error)?.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  if (loading) return <div style={{ padding: 30 }}>Loading...</div>;
  if (!chatId) return <div style={{ padding: 30 }}>Missing chat id.</div>;
  if (!chat) return <div style={{ padding: 30 }}>Chat not found.</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 0 }}>
      <div
        style={{
          padding: '20px 30px',
          backgroundColor: '#111',
          color: 'white',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <h2 style={{ margin: 0, fontSize: 18 }}>Chat</h2>
        <div style={{ marginTop: 6, opacity: 0.8, fontSize: 13 }}>
          {isParticipant ? 'Send messages to the other participant.' : 'You are not allowed to send.'}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 30px', backgroundColor: '#F8F6F5' }}>
        {messages.length === 0 ? (
          <div style={{ color: '#666' }}>No messages yet.</div>
        ) : (
          // We queried DESC, so reverse for natural top-to-bottom chat reading.
          messages
            .slice()
            .reverse()
            .map((m) => {
              const mine = m.senderId === user?.uid;
              return (
                <div
                  key={m.id}
                  style={{
                    display: 'flex',
                    justifyContent: mine ? 'flex-end' : 'flex-start',
                    marginBottom: 12,
                  }}
                >
                  <div
                    style={{
                      maxWidth: '70%',
                      padding: '10px 14px',
                      borderRadius: 16,
                      backgroundColor: mine ? '#EF2D2D' : '#ffffff',
                      color: mine ? 'white' : '#111',
                      border: mine ? 'none' : '1px solid #e8e8e8',
                      whiteSpace: 'pre-wrap',
                      lineHeight: 1.4,
                    }}
                  >
                    {m.text}
                  </div>
                </div>
              );
            })
        )}
        <div ref={messagesEndRef} />
      </div>

      <div style={{ padding: '14px 30px', borderTop: '1px solid #e8e8e8', backgroundColor: 'white' }}>
        {error && (
          <div style={{ marginBottom: 10, color: '#EF2D2D', fontWeight: 600, fontSize: 13 }}>{error}</div>
        )}

        <div style={{ display: 'flex', gap: 12 }}>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={isParticipant ? 'Type a message...' : 'Not allowed'}
            disabled={!isParticipant || sending}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                void handleSend();
              }
            }}
            style={{
              flex: 1,
              padding: '12px 14px',
              borderRadius: 12,
              border: '2px solid #e0e0e0',
              backgroundColor: '#fff',
              outline: 'none',
            }}
          />
          <button
            onClick={() => void handleSend()}
            disabled={!isParticipant || sending}
            style={{
              backgroundColor: !isParticipant ? '#ddd' : '#EF2D2D',
              color: 'white',
              border: 'none',
              borderRadius: 12,
              padding: '12px 16px',
              fontWeight: 700,
              cursor: !isParticipant ? 'not-allowed' : 'pointer',
              minWidth: 110,
            }}
          >
            {sending ? 'Sending...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chat;

