import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Shield, RefreshCw, CheckCircle, AlertTriangle, Menu, Smartphone, Monitor, Globe, User } from 'lucide-react';
import WiaLogo from './WiaLogo';

export default function Navbar({ currentRole, currentUserId, isMobileView, setCurrentRole, onOpenMobileSidebar, onLogout, onHomeClick, onProfileClick }) {
  const { t, i18n } = useTranslation();
  const [notification, setNotification] = useState(null);

  const toggleLanguage = () => {
    const newLang = i18n.language.startsWith('ko') ? 'en' : 'ko';
    i18n.changeLanguage(newLang);
  };

  const handleRoleChange = (role) => {
    setCurrentRole(role);
    showNotice(t('navbar.role_change_msg', { role }));
  };

  const showNotice = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  return (
    <header className="top-navbar" style={{ borderBottom: '1px solid rgba(205, 170, 125)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: isMobileView ? '8px' : '16px', flexWrap: 'nowrap', whiteSpace: 'nowrap' }}>
        {/* 모바일 환경 전용 햄버거 메뉴 버튼 */}
        <button
          onClick={onOpenMobileSidebar}
          className="mobile-hamburger-btn"
          title="사이드바 메뉴 열기 (모바일 드로어)"
        >
          <Menu size={22} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <WiaLogo variant="compact" size="medium" onClick={onHomeClick} />
          <div>
            <h2 className="navbar-title">
              <span style={{ fontFamily: 'SUITE, sans-serif', fontWeight: 800 }}>
                {isMobileView ? 'WME SCM' : t('navbar.title')}
              </span>
            </h2>
          </div>
        </div>

        {notification && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            background: 'var(--wia-blue)', border: '1px solid var(--border-color)',
            padding: '4px 14px', borderRadius: '8px', fontSize: '0.8rem', color: '#FFFFFF', boxShadow: 'var(--glass-shadow)'
          }}>
            <CheckCircle size={14} color="var(--wia-light-gold)" />
            <span>{notification}</span>
          </div>
        )}
      </div>

      <div className="navbar-actions">

        {currentUserId && (
          <span style={{ color: '#88796A', fontWeight: 600, fontSize: '0.82rem' }}>
            {currentUserId}
          </span>
        )}

        <button
          onClick={onProfileClick}
          className="btn btn-outline"
          style={{ padding: '6px 10px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}
          title={t('profile.title')}
        >
          <User size={14} />
          <span style={{ fontWeight: 700, display: 'none' }} className="d-sm-inline">{t('profile.title')}</span>
        </button>

        <button
          onClick={toggleLanguage}
          className="btn btn-outline"
          style={{ padding: '6px 10px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}
          title="Toggle Language (KR/EN)"
        >
          <Globe size={14} />
          <span style={{ fontWeight: 700 }}>{i18n.language.startsWith('ko') ? 'KR' : 'EN'}</span>
        </button>

        {onLogout && (
          <button
            className="btn btn-outline"
            onClick={onLogout}
            style={{
              padding: '6px 11px', fontSize: '0.8rem',
              minWidth: isMobileView ? 'auto' : '85px', justifyContent: 'center'
            }}
            title={t('navbar.logout')}
          >
            {isMobileView ? (
              <img src="/exit-favicon.svg" alt="Logout" style={{ width: '16px', height: '16px' }} />
            ) : (
              <span style={{ fontWeight: 700 }}>{t('navbar.logout')}</span>
            )}
          </button>
        )}
      </div>
    </header>
  );
}
