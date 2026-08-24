import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import ScrollButtons from './components/ScrollButtons';

// Auth Page
import Login from './pages/Login';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminInventory from './pages/admin/AdminInventory';
import AdminDispatch from './pages/admin/AdminDispatch';
import AdminSalesArchive from './pages/admin/AdminSalesArchive';
import SalesAnalytics from './pages/SalesAnalytics';
import AdminPromotion from './pages/admin/AdminPromotion';
import UploadSettings from './pages/admin/UploadSettings';
import AdminUsers from './pages/admin/AdminUsers';
import ProductLibrary from './pages/ProductLibrary';

// Dealer Pages
import DealerDashboard from './pages/dealer/DealerDashboard';
import DealerOrders from './pages/dealer/DealerOrders';
import DealerSalesArchive from './pages/dealer/DealerSalesArchive';
import DealerInventory from './pages/dealer/DealerInventory';
import DealerPromotion from './pages/dealer/DealerPromotion';

// RSM Pages
import RsmDashboard from './pages/rsm/RsmDashboard';

// Common Pages
import UserProfile from './pages/UserProfile';

const INACTIVITY_TIME = 30 * 60 * 1000; // 30 minutes in milliseconds

export default function App() {
  const [authState] = useState(() => {
    try {
      const stored = localStorage.getItem('erp_auth');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Date.now() - parsed.lastActivity < INACTIVITY_TIME) {
          return parsed;
        }
        localStorage.removeItem('erp_auth');
      }
    } catch (e) {
      console.error('Failed to parse auth state');
    }
    return null;
  });

  const [isAuthenticated, setIsAuthenticated] = useState(authState ? true : false);
  const [currentRole, setCurrentRole] = useState(authState?.currentRole || 'SCM_ADMIN');
  const [currentUserId, setCurrentUserId] = useState(authState?.currentUserId || '');
  // Default tabs based on role
  const [activeTab, setActiveTab] = useState(authState?.activeTab || 'admin-dashboard');
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);

  // Sync state to localStorage
  useEffect(() => {
    if (isAuthenticated) {
      localStorage.setItem('erp_auth', JSON.stringify({
        currentRole,
        currentUserId,
        activeTab,
        lastActivity: Date.now()
      }));
    } else {
      localStorage.removeItem('erp_auth');
    }
  }, [isAuthenticated, currentRole, activeTab]);

  // Handle inactivity auto-logout
  useEffect(() => {
    let intervalId;
    let lastUpdate = Date.now();
    
    const updateActivity = () => {
      const now = Date.now();
      // Throttle localStorage updates to once every 10 seconds
      if (now - lastUpdate < 10000) return;
      lastUpdate = now;

      if (isAuthenticated) {
        const stored = localStorage.getItem('erp_auth');
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            if (now - parsed.lastActivity >= INACTIVITY_TIME) {
              setIsAuthenticated(false);
              alert('30분 동안 활동이 없어 자동으로 로그아웃 되었습니다.');
              return;
            }
            parsed.lastActivity = now;
            localStorage.setItem('erp_auth', JSON.stringify(parsed));
          } catch (e) {}
        }
      }
    };

    const checkInactivity = () => {
      if (isAuthenticated) {
        const stored = localStorage.getItem('erp_auth');
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            if (Date.now() - parsed.lastActivity >= INACTIVITY_TIME) {
              setIsAuthenticated(false);
              alert('30분 동안 활동이 없어 자동으로 로그아웃 되었습니다.');
            }
          } catch (e) {}
        }
      }
    };

    if (isAuthenticated) {
      window.addEventListener('mousemove', updateActivity);
      window.addEventListener('keydown', updateActivity);
      window.addEventListener('click', updateActivity);
      window.addEventListener('scroll', updateActivity);

      intervalId = setInterval(checkInactivity, 60 * 1000); // Check every 1 minute
    }

    return () => {
      window.removeEventListener('mousemove', updateActivity);
      window.removeEventListener('keydown', updateActivity);
      window.removeEventListener('click', updateActivity);
      window.removeEventListener('scroll', updateActivity);
      if (intervalId) clearInterval(intervalId);
    };
  }, [isAuthenticated]);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // When role changes, switch to the default tab for that role to prevent blank screens
  useEffect(() => {
    if (activeTab === 'profile') return; // Allow profile tab for all roles

    if (currentRole === 'DEALER') {
      if (!activeTab.startsWith('dealer-')) setActiveTab('dealer-dashboard');
    } else if (currentRole === 'RSM') {
      if (!['rsm-dashboard', 'admin-inventory', 'admin-promotion', 'admin-library', 'admin-dashboard'].includes(activeTab)) {
        setActiveTab('admin-dashboard');
      }
    } else {
      if (!activeTab.startsWith('admin-') && activeTab !== 'analytics' && activeTab !== 'management') {
        setActiveTab('admin-dashboard');
      }
    }
  }, [currentRole, activeTab]);

  const isActualMobileView = windowWidth <= 768;
  const [simulateMobile, setSimulateMobile] = useState(false);
  const isMobileView = isActualMobileView || simulateMobile;
  const isDesktopOptimized = windowWidth >= 1024;

  const handleLogin = (role, userId) => {
    setCurrentRole(role);
    setCurrentUserId(userId);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  const handleHomeClick = () => {
    if (currentRole === 'DEALER') setActiveTab('dealer-dashboard');
    else setActiveTab('admin-dashboard');
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="app-container">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        currentRole={currentRole}
        isMobileOpen={isMobileOpen}
        onClose={() => setIsMobileOpen(false)}
        isActualMobileView={isActualMobileView}
        simulateMobile={simulateMobile}
        setSimulateMobile={setSimulateMobile}
      />

      <div className="main-content">
        <Navbar 
          currentRole={currentRole}
          currentUserId={currentUserId}
          isMobileView={isMobileView}
          setCurrentRole={setCurrentRole} 
          onOpenMobileSidebar={() => setIsMobileOpen(true)}
          onLogout={handleLogout}
          onHomeClick={handleHomeClick}
          onProfileClick={() => setActiveTab('profile')}
        />

        <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {/* Common Routing */}
          {activeTab === 'profile' && <UserProfile currentUserId={currentUserId} isMobileView={isMobileView} onClose={handleHomeClick} />}

          {/* RSM Routing */}
          {activeTab === 'rsm-dashboard' && currentRole === 'RSM' && <RsmDashboard isMobileView={isMobileView} currentUserId={currentUserId} />}

          {/* Admin Routing */}
          {activeTab === 'admin-dashboard' && (currentRole === 'SCM_ADMIN' || currentRole === 'RSM') && <AdminDashboard isMobileView={isMobileView} currentRole={currentRole} />}
          {activeTab === 'admin-inventory' && (currentRole === 'SCM_ADMIN' || currentRole === 'RSM') && <AdminInventory isMobileView={isMobileView} />}
          {activeTab === 'admin-dispatch' && currentRole !== 'RSM' && <AdminDispatch isMobileView={isMobileView} />}
          {activeTab === 'admin-sales-archive' && currentRole !== 'RSM' && <AdminSalesArchive isMobileView={isMobileView} />}
          {activeTab === 'admin-users' && currentRole !== 'RSM' && <AdminUsers isMobileView={isMobileView} />}
          {activeTab === 'analytics' && currentRole !== 'RSM' && <SalesAnalytics isMobileView={isMobileView} isDesktopOptimized={isDesktopOptimized} />}
          {activeTab === 'admin-promotion' && (currentRole === 'SCM_ADMIN' || currentRole === 'RSM') && <AdminPromotion isMobileView={isMobileView} />}
          {activeTab === 'management' && currentRole !== 'RSM' && <UploadSettings />}
          {activeTab === 'admin-library' && (currentRole === 'SCM_ADMIN' || currentRole === 'RSM') && <ProductLibrary currentRole={currentRole} isMobileView={isMobileView} />}

          {/* Dealer Routing */}
          {activeTab === 'dealer-dashboard' && <DealerDashboard isMobileView={isMobileView} setActiveTab={setActiveTab} />}
          {activeTab === 'dealer-orders' && <DealerOrders isMobileView={isMobileView} />}
          {activeTab === 'dealer-sales-archive' && <DealerSalesArchive isMobileView={isMobileView} />}
          {activeTab === 'dealer-inventory' && <DealerInventory isMobileView={isMobileView} />}
          {activeTab === 'dealer-promotion' && <DealerPromotion isMobileView={isMobileView} />}
          {activeTab === 'dealer-library' && <ProductLibrary currentRole={currentRole} isMobileView={isMobileView} />}
          
          {['admin-dashboard', 'rsm-dashboard', 'admin-inventory', 'admin-promotion', 'admin-users', 'dealer-inventory', 'admin-library', 'dealer-library'].includes(activeTab) && (
            <ScrollButtons />
          )}
        </main>
      </div>
    </div>
  );
}
