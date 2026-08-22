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

  const [refreshKey, setRefreshKey] = useState(0);

  const handleSeedReload = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleLogin = (role, userId) => {
    setCurrentRole(role);
    setCurrentUserId(userId);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  const handleHomeClick = () => {
    setActiveTab(currentRole === 'DEALER' ? 'dealer-dashboard' : 'admin-dashboard');
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
        onSeedReload={handleSeedReload}
      />

      <div className="main-content">
        <Navbar 
          currentRole={currentRole} 
          setCurrentRole={setCurrentRole} 
          onSeedReload={handleSeedReload}
          onOpenMobileSidebar={() => setIsMobileOpen(true)}
          onLogout={handleLogout}
          onHomeClick={handleHomeClick}
          onProfileClick={() => setActiveTab('profile')}
        />

        <main key={refreshKey} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {/* Common Routing */}
          {activeTab === 'profile' && <UserProfile currentUserId={currentUserId} isMobileView={isMobileView} onClose={handleHomeClick} />}

          {/* Admin Routing */}
          {activeTab === 'admin-dashboard' && <AdminDashboard isMobileView={isMobileView} />}
          {activeTab === 'admin-inventory' && <AdminInventory isMobileView={isMobileView} />}
          {activeTab === 'admin-dispatch' && <AdminDispatch isMobileView={isMobileView} />}
          {activeTab === 'admin-sales-archive' && <AdminSalesArchive isMobileView={isMobileView} />}
          {activeTab === 'admin-users' && <AdminUsers isMobileView={isMobileView} />}
          {activeTab === 'analytics' && <SalesAnalytics isMobileView={isMobileView} isDesktopOptimized={isDesktopOptimized} />}
          {activeTab === 'admin-promotion' && <AdminPromotion isMobileView={isMobileView} />}
          {activeTab === 'management' && <UploadSettings />}
          {activeTab === 'admin-library' && <ProductLibrary currentRole={currentRole} isMobileView={isMobileView} />}

          {/* Dealer Routing */}
          {activeTab === 'dealer-dashboard' && <DealerDashboard isMobileView={isMobileView} />}
          {activeTab === 'dealer-orders' && <DealerOrders isMobileView={isMobileView} />}
          {activeTab === 'dealer-sales-archive' && <DealerSalesArchive isMobileView={isMobileView} />}
          {activeTab === 'dealer-inventory' && <DealerInventory isMobileView={isMobileView} />}
          {activeTab === 'dealer-promotion' && <DealerPromotion isMobileView={isMobileView} />}
          {activeTab === 'dealer-library' && <ProductLibrary currentRole={currentRole} isMobileView={isMobileView} />}
          
          {['admin-dashboard', 'admin-inventory', 'admin-promotion', 'admin-users', 'dealer-inventory', 'admin-library', 'dealer-library'].includes(activeTab) && (
            <ScrollButtons />
          )}
        </main>
      </div>
    </div>
  );
}
