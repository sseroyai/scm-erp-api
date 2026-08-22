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
            <h1 style={{ fontSize: '1.5rem', color: 'var(--text-primary)', marginTop: '24px', fontWeight: '700' }}>
              SCM ERP 시스템
            </h1>
            <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>계정에 로그인하여 계속하세요</p>
          </div>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {error && (
              <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'rgba(230,0,18,0.1)', color: 'var(--wia-red)', fontSize: '0.9rem', textAlign: 'center' }}>
                {error}
              </div>
            )}
            
            <div style={{ position: 'relative' }}>
              <User size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                placeholder="아이디 (ex. admin, dealer...)" 
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                style={{ 
                  width: '100%', padding: '14px 16px 14px 48px', borderRadius: '12px', 
                  border: '1px solid var(--border-color)', outline: 'none',
                  fontSize: '1rem', backgroundColor: 'var(--bg-input)'
                }}
                required
              />
            </div>

            <div style={{ position: 'relative' }}>
              <Lock size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="password" 
                placeholder="비밀번호" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ 
                  width: '100%', padding: '14px 16px 14px 48px', borderRadius: '12px', 
                  border: '1px solid var(--border-color)', outline: 'none',
                  fontSize: '1rem', backgroundColor: 'var(--bg-input)'
                }}
                required
              />
            </div>

            <button type="submit" style={{
              width: '100%', padding: '16px', borderRadius: '12px', border: 'none',
              backgroundColor: 'var(--wia-blue)', color: 'white', fontSize: '1.1rem',
              fontWeight: '700', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px',
              marginTop: '16px', transition: 'background-color 0.2s'
            }}>
              로그인 <ArrowRight size={20} />
            </button>
          </form>

          <div style={{ marginTop: '32px', textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            비밀번호를 잊으셨나요? 관리자에게 문의하세요.
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
        backgroundColor: '#f5f6f8', // Fallback background matching the image
        position: 'relative',
        overflow: 'hidden'
      }} className="login-banner-container">
        {/* Placeholder for the user's attached image */}
        <img 
          src="/login-bg.png" 
          alt="Our Way of Working Core Value" 
          style={{ width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'center' }}
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
          <p>첨부해주신 코어 밸류 이미지를 frontend/public 폴더에<br/><b>login-bg.png</b> 라는 이름으로 저장해주세요.</p>
        </div>
      </div>

      <style>{`
        @media (min-width: 768px) {
          .login-banner-container {
            display: block !important;
          }
        }
      `}</style>
    </div>
  );
}
