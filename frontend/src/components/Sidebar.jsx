import React, { useState, useRef } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import { LayoutDashboard, BarChart3, FileSpreadsheet, Tag, Package, Truck, ShieldAlert, X, FolderOpen, Smartphone, Monitor, RefreshCw, User, LogOut } from 'lucide-react';
import WiaLogo from './WiaLogo';

export default function Sidebar({ activeTab, setActiveTab, currentRole, currentUserId, isMobileOpen, onClose, isActualMobileView, simulateMobile, setSimulateMobile, onProfileClick, onLogout }) {
  const { t } = useTranslation();
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const diffX = touchStartX.current - currentX;
    const diffY = touchStartY.current - currentY;

    // 가로 스와이프가 세로 스크롤보다 크고, 왼쪽으로 50px 이상 이동했을 때 닫기
    if (Math.abs(diffX) > Math.abs(diffY)) {
      if (diffX > 50) {
        if (onClose) onClose();
        touchStartX.current = null;
        touchStartY.current = null;
      }
    }
  };

  const handleTouchEnd = () => {
    touchStartX.current = null;
    touchStartY.current = null;
  };

  // SCM-ADMIN & RSM 용 메뉴 구조 (V7 기준)
  const adminMenuItems = [
    {
      id: 'admin-dashboard',
      label: t('sidebar.admin_menu.dashboard'),
      icon: <LayoutDashboard size={20} />
    },
    {
      id: 'admin-inventory',
      label: t('sidebar.admin_menu.inventory'),
      icon: <Package size={20} />
    },
    {
      id: 'admin-promotion',
      label: t('sidebar.admin_menu.promotion'),
      icon: <Tag size={20} />
    },
    {
      id: 'management',
      label: t('sidebar.admin_menu.management'),
      icon: <FileSpreadsheet size={20} />
    },
    {
      id: 'admin-dispatch',
      label: t('sidebar.admin_menu.dispatch'),
      icon: <Truck size={20} />
    },
    {
      id: 'admin-sales-archive',
      label: t('sidebar.admin_menu.sales_archive'),
      icon: <FileSpreadsheet size={20} />
    },
    {
      id: 'analytics',
      label: t('sidebar.admin_menu.analytics'),
      icon: <BarChart3 size={20} />
    },
    {
      id: 'admin-library',
      label: t('sidebar.admin_menu.library'),
      icon: <FolderOpen size={20} />
    },
    {
      id: 'admin-users',
      label: t('sidebar.admin_menu.users'),
      icon: <ShieldAlert size={20} />
    }
  ];

  // DEALER 용 메뉴 구조 (V7 기준)
  const dealerMenuItems = [
    {
      id: 'dealer-dashboard',
      label: t('sidebar.dealer_menu.dashboard'),
      icon: <LayoutDashboard size={20} />
    },
    {
      id: 'dealer-orders',
      label: t('sidebar.dealer_menu.orders'),
      icon: <Truck size={20} />
    },
    {
      id: 'dealer-sales-archive',
      label: t('sidebar.dealer_menu.sales_archive'),
      icon: <FileSpreadsheet size={20} />
    },
    {
      id: 'dealer-inventory',
      label: t('sidebar.dealer_menu.inventory'),
      icon: <Package size={20} />
    },
    {
      id: 'dealer-promotion',
      label: t('sidebar.dealer_menu.promotion'),
      icon: <Tag size={20} />
    },
    {
      id: 'dealer-library',
      label: t('sidebar.dealer_menu.library'),
      icon: <FolderOpen size={20} />
    }
  ];

  // RSM 용 메뉴 구조 (V7 기준)
  const rsmMenuItems = [
    {
      id: 'admin-dashboard',
      label: t('sidebar.rsm_menu.admin_dashboard'),
      icon: <LayoutDashboard size={20} />
    },
    {
      id: 'admin-inventory',
      label: t('sidebar.rsm_menu.inventory'),
      icon: <Package size={20} />
    },
    {
      id: 'admin-promotion',
      label: t('sidebar.rsm_menu.promotion'),
      icon: <Tag size={20} />
    },
    {
      id: 'admin-library',
      label: t('sidebar.rsm_menu.library'),
      icon: <FolderOpen size={20} />
    },
    {
      id: 'rsm-dashboard',
      label: t('sidebar.rsm_menu.dashboard'),
      icon: <LayoutDashboard size={20} />
    }
  ];

  const menuItems = currentRole === 'DEALER' ? dealerMenuItems : (currentRole === 'RSM' ? rsmMenuItems : adminMenuItems);

  const handleMenuClick = (id) => {
    setActiveTab(id);
    if (onClose) onClose();
  };

  return (
    <>
      {/* 모바일 배경 오버레이 (클릭 시 닫힘) */}
      <div
        className={`sidebar-overlay ${isMobileOpen ? 'active' : ''}`}
        onClick={onClose}
      />

      <aside
        className={`sidebar ${isMobileOpen ? 'mobile-open' : ''}`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="sidebar-header" style={{ width: '100%', justifyContent: 'space-between', height: '74px', padding: '12px 20px', borderBottom: '1px solid rgba(205, 170, 125)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
            <WiaLogo
              variant="vertical"
              size="small"
              style={{ maxWidth: '100%' }}
              onClick={() => {
                if (currentRole === 'DEALER') setActiveTab('dealer-dashboard');
                else if (currentRole === 'RSM') setActiveTab('rsm-dashboard');
                else setActiveTab('admin-dashboard');
                if (onClose) onClose();
              }}
            />
          </div>

          {/* 모바일에서만 표시되는 닫기 버튼 제거됨 (스와이프 닫기 적용) */}
        </div>

        <div className="sidebar-menu">
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'rgb(205, 170, 125)', padding: '0 16px', marginBottom: '8px', letterSpacing: '0.05em', lineHeight: '1.4' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>{currentUserId}</span>
              <button
                className="sidebar-profile-btn"
                onClick={onProfileClick}
                title={t('profile.title')}
              >
                <User size={14} />
              </button>
              <button
                className="sidebar-profile-btn"
                onClick={onLogout}
                title={t('navbar.logout', '로그아웃')}
              >
                <LogOut size={14} />
              </button>
            </div>
            <div>({currentRole === 'DEALER' ? t('sidebar.dealer_portal') : (currentRole === 'RSM' ? t('sidebar.rsm_portal', 'RSM 포털') : t('sidebar.admin_portal'))})</div>
          </div>
          {menuItems.map(item => (
            <button
              key={item.id}
              onClick={() => handleMenuClick(item.id)}
              className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}

          <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>

            {/* Mobile Simulate Controls */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '0 8px', marginBottom: '8px' }}>

              {!isActualMobileView && (
                <button
                  onClick={() => setSimulateMobile(!simulateMobile)}
                  className="btn btn-outline"
                  style={{
                    padding: '6px 14px',
                    fontSize: '0.8rem',
                    borderColor: simulateMobile ? 'var(--accent-cyan)' : 'var(--border-color)',
                    background: simulateMobile ? 'rgba(6, 182, 212, 0.1)' : 'transparent',
                    color: simulateMobile ? 'var(--accent-cyan)' : 'var(--text-primary)',
                    display: 'flex',
                    justifyContent: 'center'
                  }}
                >
                  {simulateMobile ? <Monitor size={16} color="var(--wia-light-gold)" /> : <Smartphone size={16} />}
                  <span>{simulateMobile ? '🖥️ 데스크탑 뷰로 복귀' : '📱 스마트폰 뷰 시뮬레이션'}</span>
                </button>
              )}
            </div>

            <div style={{ padding: '16px', background: 'rgba(6, 182, 212, 0.1)', borderRadius: '12px', border: '1px solid var(--wia-light-gold)', fontSize: '0.8rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--wia-light-gold)', fontWeight: 700, marginBottom: '6px' }}>
                <ShieldAlert size={16} />
                <span>{t('sidebar.data_isolation_title')}</span>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', lineHeight: 1.4 }}>
                <Trans i18nKey="sidebar.data_isolation_desc" values={{ role: currentRole }}>
                  현재 접속하신 <strong>{currentRole}</strong> 권한에 맞춰 데이터가 안전하게 격리 조회됩니다. (V7 격리 모드 활성화)
                </Trans>
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
