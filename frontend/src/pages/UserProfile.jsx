import React, { useState, useEffect } from 'react';
import { User, Shield, Edit2, Save, X, Lock } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function UserProfile({ currentUserId, isMobileView, onClose }) {
  const { t } = useTranslation();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Edit state
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({
    username: '',
    email: '',
    department: ''
  });
  
  // Password modal state
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/v1/users/me?username=${currentUserId}`);
      if (!res.ok) throw new Error('프로필을 불러올 수 없습니다.');
      const data = await res.json();
      setProfile(data);
      setEditForm({
        username: data.username || '',
        email: data.email || '',
        department: data.department || ''
      });
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUserId) {
      fetchProfile();
    }
  }, [currentUserId]);

  const handleSaveProfile = async () => {
    try {
      const res = await fetch(`/api/v1/users/me?username=${currentUserId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || '프로필 수정에 실패했습니다.');
      }
      const data = await res.json();
      setProfile(data);
      setEditMode(false);
      alert('프로필이 성공적으로 업데이트되었습니다.');
    } catch (error) {
      alert(error.message);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setPasswordError('새 비밀번호가 일치하지 않습니다.');
      return;
    }
    if (passwordForm.new_password.length < 8) {
      setPasswordError('비밀번호는 최소 8자리 이상이어야 합니다.');
      return;
    }

    try {
      const res = await fetch(`/api/v1/users/me/change-password?username=${currentUserId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(passwordForm)
      });
      
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || '비밀번호 변경에 실패했습니다.');
      }
      
      setPasswordSuccess(data.message);
      setTimeout(() => {
        setIsPasswordModalOpen(false);
        setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
        setPasswordSuccess('');
      }, 1500);
    } catch (error) {
      setPasswordError(error.message);
    }
  };

  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Loading...</div>;
  }

  if (!profile) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>프로필 정보를 찾을 수 없습니다.</div>;
  }

  const gridTemplateColumns = isMobileView ? '1fr' : '1fr 1fr';

  return (
    <div style={{ padding: isMobileView ? '16px' : '32px', backgroundColor: 'var(--bg-secondary)', minHeight: '100%' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            {t('profile.title')}
          </h1>
          <button 
            onClick={onClose}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '6px', backgroundColor: '#fff', border: '1px solid var(--border-color)', cursor: 'pointer', color: 'var(--text-secondary)', fontWeight: 600, boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}
          >
            <X size={16} /> 닫기
          </button>
        </div>

        {/* Card 1: Basic Profile */}
        <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <User size={20} color="var(--wia-blue)" /> {t('profile.basic')}
            </h2>
            {!editMode ? (
              <button 
                onClick={() => setEditMode(true)}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '6px', backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-color)', cursor: 'pointer' }}
              >
                <Edit2 size={14} /> {t('profile.edit')}
              </button>
            ) : (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  onClick={() => {
                    setEditMode(false);
                    setEditForm({ username: profile.username || '', email: profile.email || '', department: profile.department || '' });
                  }}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '6px', backgroundColor: '#f5f5f5', border: '1px solid #ddd', cursor: 'pointer' }}
                >
                  <X size={14} /> 취소
                </button>
                <button 
                  onClick={handleSaveProfile}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '6px', backgroundColor: 'var(--wia-blue)', color: 'white', border: 'none', cursor: 'pointer' }}
                >
                  <Save size={14} /> 저장
                </button>
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns, gap: '20px' }}>
            {/* User Name */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>{t('profile.username')}</label>
              {editMode ? (
                <input 
                  type="text" 
                  value={editForm.username} 
                  onChange={e => setEditForm({...editForm, username: e.target.value})}
                  style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none' }}
                />
              ) : (
                <div style={{ padding: '10px', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid transparent' }}>
                  {profile.username}
                </div>
              )}
            </div>

            {/* Company Name (Disabled) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>{t('profile.company')}</label>
              <div style={{ padding: '10px', backgroundColor: '#f0f0f0', color: '#888', borderRadius: '8px', border: '1px solid #e0e0e0', cursor: 'not-allowed' }}>
                {profile.dealer_company?.name || '본사 (HQ)'}
              </div>
              {editMode && <span style={{ fontSize: '0.75rem', color: 'var(--wia-red)' }}>* 소속 회사는 관리자만 수정 가능합니다.</span>}
            </div>

            {/* Department */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>{t('profile.department')}</label>
              {editMode ? (
                <input 
                  type="text" 
                  value={editForm.department} 
                  onChange={e => setEditForm({...editForm, department: e.target.value})}
                  style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none' }}
                  placeholder="소속 부서/팀 입력"
                />
              ) : (
                <div style={{ padding: '10px', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid transparent' }}>
                  {profile.department || '-'}
                </div>
              )}
            </div>

            {/* Email Address */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>{t('profile.email')}</label>
              {editMode ? (
                <input 
                  type="email" 
                  value={editForm.email} 
                  onChange={e => setEditForm({...editForm, email: e.target.value})}
                  style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none' }}
                />
              ) : (
                <div style={{ padding: '10px', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid transparent' }}>
                  {profile.email}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Card 2: Security & Authentication */}
        <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
          <div style={{ marginBottom: '24px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Shield size={20} color="var(--wia-red)" /> {t('profile.security_title')}
            </h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '8px' }}>
              {t('profile.security_desc')}
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns, gap: '20px', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>{t('profile.password')}</label>
              <div style={{ padding: '10px', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid transparent', letterSpacing: '2px', fontSize: '1.2rem', display: 'flex', alignItems: 'center' }}>
                ••••••••
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', height: '100%' }}>
              <button 
                onClick={() => setIsPasswordModalOpen(true)}
                style={{ padding: '10px 16px', borderRadius: '8px', backgroundColor: '#fff', color: 'var(--text-primary)', border: '1px solid var(--border-color)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}
              >
                <Lock size={16} /> {t('profile.password_reset')}
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Password Change Modal */}
      {isPasswordModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999, 
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#fff', borderRadius: '12px', width: '100%', maxWidth: '400px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', overflow: 'hidden'
          }}>
            <div style={{ padding: '20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>비밀번호 변경</h3>
              <button onClick={() => setIsPasswordModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} color="var(--text-muted)" />
              </button>
            </div>
            
            <form onSubmit={handleChangePassword} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {passwordError && <div style={{ padding: '10px', borderRadius: '8px', backgroundColor: 'rgba(230,0,18,0.1)', color: 'var(--wia-red)', fontSize: '0.85rem' }}>{passwordError}</div>}
              {passwordSuccess && <div style={{ padding: '10px', borderRadius: '8px', backgroundColor: 'rgba(0,180,50,0.1)', color: 'green', fontSize: '0.85rem' }}>{passwordSuccess}</div>}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>현재 비밀번호</label>
                <input 
                  type="password" 
                  value={passwordForm.current_password}
                  onChange={e => setPasswordForm({...passwordForm, current_password: e.target.value})}
                  style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)' }}
                  required
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>새 비밀번호 (8자리 이상)</label>
                <input 
                  type="password" 
                  value={passwordForm.new_password}
                  onChange={e => setPasswordForm({...passwordForm, new_password: e.target.value})}
                  style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)' }}
                  required
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>새 비밀번호 확인</label>
                <input 
                  type="password" 
                  value={passwordForm.confirm_password}
                  onChange={e => setPasswordForm({...passwordForm, confirm_password: e.target.value})}
                  style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)' }}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <button 
                  type="button" 
                  onClick={() => setIsPasswordModalOpen(false)}
                  style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: '#fff', cursor: 'pointer', fontWeight: 600 }}
                >
                  취소
                </button>
                <button 
                  type="submit"
                  style={{ flex: 1, padding: '12px', borderRadius: '8px', border: 'none', backgroundColor: 'var(--wia-blue)', color: 'white', cursor: 'pointer', fontWeight: 600 }}
                >
                  변경하기
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
