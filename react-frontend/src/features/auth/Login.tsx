import React, { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../../firebase';

const Login: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);

  const handleEmailAuth = async () => {
    if (!email || !password) return;
    if (!email.toLowerCase().endsWith('@vitstudent.ac.in')) {
      setErrorMessage('Use your VIT email (@vitstudent.ac.in)');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      } else {
        await createUserWithEmailAndPassword(auth, email.trim(), password);
      }
    } catch (e: any) {
      setErrorMessage(e.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (e: any) {
      setErrorMessage(e.message || 'Google sign in failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      backgroundColor: '#1A1A1A',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px'
    }}>
      <div style={{
        maxWidth: '450px',
        width: '100%',
        backgroundColor: '#2A2A2A',
        borderRadius: '20px',
        padding: '40px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          marginBottom: '30px'
        }}>
          <div style={{
            backgroundColor: '#3A3A3A',
            borderRadius: '50%',
            padding: '30px',
            boxShadow: '0 8px 20px rgba(0,0,0,0.3)'
          }}>
            <span style={{ fontSize: '56px', color: '#EF2D2D' }}>🎓</span>
          </div>
        </div>

        <h1 style={{
          textAlign: 'center',
          color: 'white',
          fontSize: '32px',
          fontWeight: 'bold',
          letterSpacing: '4px',
          marginBottom: '10px'
        }}>
          UNIUNION
        </h1>
        <p style={{
          textAlign: 'center',
          color: 'rgba(255,255,255,0.6)',
          fontSize: '14px',
          letterSpacing: '2px',
          marginBottom: '50px'
        }}>
          BORROW. RETURN. TRUST.
        </p>

        <div style={{ marginBottom: '20px' }}>
          <input
            type="email"
            placeholder="VIT Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              width: '100%',
              padding: '18px 20px',
              backgroundColor: '#3A3A3A',
              border: '2px solid transparent',
              borderRadius: '12px',
              color: 'white',
              fontSize: '16px',
              boxSizing: 'border-box',
              outline: 'none',
              transition: 'border-color 0.2s'
            }}
            onFocus={(e) => e.target.style.borderColor = '#EF2D2D'}
            onBlur={(e) => e.target.style.borderColor = 'transparent'}
          />
        </div>

        <div style={{ marginBottom: '30px' }}>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              width: '100%',
              padding: '18px 20px',
              backgroundColor: '#3A3A3A',
              border: '2px solid transparent',
              borderRadius: '12px',
              color: 'white',
              fontSize: '16px',
              boxSizing: 'border-box',
              outline: 'none',
              transition: 'border-color 0.2s'
            }}
            onFocus={(e) => e.target.style.borderColor = '#EF2D2D'}
            onBlur={(e) => e.target.style.borderColor = 'transparent'}
          />
        </div>

        {isLoading ? (
          <div style={{
            textAlign: 'center',
            marginBottom: '20px',
            padding: '20px',
            color: '#EF2D2D',
            fontSize: '16px',
            fontWeight: 'bold'
          }}>
            Loading...
          </div>
        ) : (
          <>
            <button
              onClick={handleEmailAuth}
              style={{
                width: '100%',
                padding: '18px',
                backgroundColor: '#EF2D2D',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '18px',
                fontWeight: 'bold',
                marginBottom: '15px',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#d02525'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#EF2D2D'}
            >
              {isLogin ? 'Sign In with College Email' : 'Create Account'}
            </button>

            <button
              onClick={handleGoogleSignIn}
              style={{
                width: '100%',
                padding: '18px',
                backgroundColor: 'transparent',
                color: 'white',
                border: '2px solid rgba(255,255,255,0.3)',
                borderRadius: '12px',
                fontSize: '16px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#EF2D2D';
                e.currentTarget.style.backgroundColor = 'rgba(239,45,45,0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)';
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <span style={{ fontSize: '20px', marginRight: '10px' }}>G</span>
              Continue with Google
            </button>
          </>
        )}

        {errorMessage && (
          <div style={{
            marginTop: '20px',
            padding: '15px',
            backgroundColor: 'rgba(239,45,45,0.1)',
            border: '1px solid #EF2D2D',
            borderRadius: '8px',
            color: '#EF2D2D',
            textAlign: 'center',
            fontSize: '14px',
            fontWeight: '500'
          }}>
            {errorMessage}
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: '30px' }}>
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setErrorMessage(null);
              setEmail('');
              setPassword('');
            }}
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(255,255,255,0.7)',
              cursor: 'pointer',
              fontSize: '14px',
              textDecoration: 'underline',
              transition: 'color 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'white'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}
          >
            {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;