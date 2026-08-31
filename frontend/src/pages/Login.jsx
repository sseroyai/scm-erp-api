import React, { useState } from 'react';
import { Lock, User, ArrowRight } from 'lucide-react';
import WiaLogo from '../components/WiaLogo';

import { addAuditLog } from '../utils/auditLogger';

export default function Login({ onLogin }) {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    const id = userId.trim();
    const pw = password.trim();

    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: id, password: pw })
      });

      const data = await res.json();

      if (!res.ok) {
        addAuditLog('Failed Login (Invalid Credentials)', id || 'unknown', 'Failed');
        setError(data.detail || '아이디 또는 비밀번호가 올바르지 않습니다.');
        return;
      }

      addAuditLog('User Login', data.username, 'Success');
      onLogin(data.role, data.username);

    } catch (err) {
      setError('서버와 통신할 수 없습니다.');
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100vw', backgroundColor: 'var(--bg-primary)' }}>

      {/* Left Area - Login Form */}
      <div style={{ flex: '1', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '40px' }}>
        <div style={{ width: '100%', maxWidth: '400px' }}>
          <div style={{ marginBottom: '48px', textAlign: 'center' }}>
            <WiaLogo size="large" />
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', marginTop: '50px', gap: '12px' }}>
              <h1 style={{ fontSize: '2rem', color: 'var(--text-primary)', margin: 0, fontWeight: '300' }}>
                WME SCM
              </h1>
              <img src="/A-machine.ico" alt="Machine" style={{ width: '52px', height: '52px', objectFit: 'contain' }} />
            </div>
          </div>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {error && (
              <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'rgba(230,0,18,0.1)', color: 'var(--wia-red)', fontSize: '0.9rem', textAlign: 'center' }}>
                {error}
              </div>
            )}

            <div style={{ position: 'relative', width: '60%', margin: '0 auto' }}>
              <User size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Username"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                style={{
                  width: '100%', padding: '12px 16px 12px 48px', borderRadius: '12px',
                  border: '1px solid var(--border-color)', outline: 'none',
                  fontSize: '1rem', backgroundColor: 'var(--bg-input)'
                }}
                required
              />
            </div>

            <div style={{ position: 'relative', width: '60%', margin: '0 auto' }}>
              <Lock size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%', padding: '12px 16px 12px 48px', borderRadius: '12px',
                  border: '1px solid var(--border-color)', outline: 'none',
                  fontSize: '1rem', backgroundColor: 'var(--bg-input)'
                }}
                required
              />
            </div>

            <button type="submit" className="sign-in-btn" style={{
              width: '60%', padding: '12px 16px', borderRadius: '12px', border: 'none',
              color: 'white', fontSize: '1.1rem',
              fontWeight: '700', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px',
              margin: '16px auto 0', transition: 'background-color 0.2s'
            }}>
              Sign In <ArrowRight size={20} />
            </button>
          </form>

          <div style={{ marginTop: '12px', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Forgot your password?
          </div>
        </div>
      </div>

      {/* Right Area - Attached Image Banner */}
      <div style={{
        flex: '1.2',
        display: 'none',
        '@media (minWidth: 768px)': {
          display: 'block'
        },
        backgroundColor: '#f4f4f4', // Fallback background matching the image
        position: 'relative',
        overflow: 'hidden'
      }} className="login-banner-container">
        {/* Placeholder for the user's attached image */}
        <img
          src="/login-bg.png"
          alt="Our Way of Working Core Value"
          style={{ width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'center', opacity: 0.85 }}
          onError={(e) => {
            e.target.style.display = 'none';
            e.target.nextSibling.style.display = 'flex';
          }}
        />
        <div style={{
          display: 'none', width: '100%', height: '100%', flexDirection: 'column',
          justifyContent: 'center', alignItems: 'center', padding: '40px', textAlign: 'center',
          color: 'var(--text-muted)'
        }}>
          <p>첨부해주신 코어 밸류 이미지를 frontend/public 폴더에<br /><b>login-bg.png</b> 라는 이름으로 저장해주세요.</p>
        </div>
      </div>

      <style>{`
        @media (min-width: 768px) {
          .login-banner-container {
            display: block !important;
          }
        }
        .sign-in-btn {
          background-color: var(--wia-blue);
        }
        .sign-in-btn:hover {
          background-color: rgb(205, 170, 125);
        }
      `}</style>
    </div>
  );
}
