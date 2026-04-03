import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase';

const Profile: React.FC = () => {
  const { user } = useAuth();

  const handleSignOut = async () => {
    await signOut(auth);
  };

  return (
    <div style={{ padding: '40px' }}>
      <h1 style={{
        fontSize: '32px',
        fontWeight: 'bold',
        color: '#333',
        marginBottom: '30px'
      }}>
        Profile
      </h1>

      {user && (
        <div style={{
          backgroundColor: '#f8f9fa',
          padding: '40px',
          borderRadius: '12px',
          border: '1px solid #e9ecef',
          maxWidth: '600px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '30px'
          }}>
            <img
              src={user.photoURL || "https://i.pravatar.cc/150?img=11"}
              alt="Profile"
              style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                marginRight: '20px',
                border: '3px solid #e9ecef'
              }}
            />
            <div>
              <h2 style={{
                fontSize: '24px',
                fontWeight: 'bold',
                color: '#333',
                margin: '0 0 5px 0'
              }}>
                {user.displayName || 'Student'}
              </h2>
              <p style={{
                fontSize: '16px',
                color: '#666',
                margin: 0
              }}>
                {user.email}
              </p>
            </div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '20px',
            marginBottom: '30px'
          }}>
            <div style={{
              backgroundColor: 'white',
              padding: '20px',
              borderRadius: '8px',
              border: '1px solid #e9ecef',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '24px', marginBottom: '5px' }}>📚</div>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#333' }}>5</div>
              <div style={{ fontSize: '14px', color: '#666' }}>Items Lent</div>
            </div>

            <div style={{
              backgroundColor: 'white',
              padding: '20px',
              borderRadius: '8px',
              border: '1px solid #e9ecef',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '24px', marginBottom: '5px' }}>🤝</div>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#333' }}>12</div>
              <div style={{ fontSize: '14px', color: '#666' }}>Items Borrowed</div>
            </div>

            <div style={{
              backgroundColor: 'white',
              padding: '20px',
              borderRadius: '8px',
              border: '1px solid #e9ecef',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '24px', marginBottom: '5px' }}>⭐</div>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#333' }}>4.8</div>
              <div style={{ fontSize: '14px', color: '#666' }}>Trust Score</div>
            </div>
          </div>

          <button
            onClick={handleSignOut}
            style={{
              backgroundColor: '#EF2D2D',
              color: 'white',
              border: 'none',
              padding: '15px 30px',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'background-color 0.2s',
              width: '100%'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#d02525'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#EF2D2D'}
          >
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
};

export default Profile;