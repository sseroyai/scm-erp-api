import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ShieldAlert, Users, Key, Activity, UserPlus, Search, Edit2, Trash2, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { getAuditLogs } from '../../utils/auditLogger';

export default function AdminUsers({ isMobileView }) {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState('users'); // 'users' or 'logs'
  const [logs, setLogs] = useState([]);
  const [users, setUsers] = useState([]);
  const [dealers, setDealers] = useState([]);
  
  // 신규 사용자 등록 상태
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newUserForm, setNewUserForm] = useState({
    username: '',
    email: '',
    role: 'RSM',
    department: '',
    dealer_company_id: ''
  });
  const [creatingUser, setCreatingUser] = useState(false);
  
  // 사용자 수정 상태
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);
  const [editUserForm, setEditUserForm] = useState({
    username: '',
    email: '',
    role: 'RSM',
    department: '',
    dealer_company_id: ''
  });
  const [updatingUser, setUpdatingUser] = useState(false);

  useEffect(() => {
    // Fetch logs always so KPIs work
    const allLogs = getAuditLogs();
    setLogs(allLogs);

    // Fetch users
    const fetchUsers = async () => {
      try {
        const res = await fetch('/api/users');
        if (res.ok) {
          const data = await res.json();
          const transformedUsers = data.map(u => ({
            id: u.id,
            name: u.username,
            email: u.email,
            role: u.role,
            status: 'Active', 
            lastLogin: '-',
            company: u.dealer_company ? u.dealer_company.name : (u.department || 'WIA HQ')
          }));
          setUsers(transformedUsers);
        }
      } catch (err) {
        console.error("Failed to fetch users", err);
      }
    };
    
    const fetchDealers = async () => {
      try {
        const res = await fetch('/api/dealers');
        if (res.ok) setDealers(await res.json());
      } catch (err) {
        console.error("Failed to fetch dealers", err);
      }
    };

    fetchUsers();
    fetchDealers();
  }, []);

  const closeCreateModal = () => {
    setShowCreateModal(false);
    setNewUserForm({ username: '', email: '', role: 'RSM', department: '', dealer_company_id: '' });
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setCreatingUser(true);
    
    const payload = {
      username: newUserForm.username,
      email: newUserForm.email,
      role: newUserForm.role,
      department: ['SCM_ADMIN', 'RSM'].includes(newUserForm.role) ? newUserForm.department : null,
      dealer_company_id: newUserForm.role === 'DEALER' ? (newUserForm.dealer_company_id ? Number(newUserForm.dealer_company_id) : null) : null
    };

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const created = await res.json();
        // UI에 새 유저 추가
        setUsers([...users, {
          id: created.id,
          name: created.username,
          email: created.email,
          role: created.role,
          status: 'Active',
          lastLogin: '-',
          company: created.dealer_company ? created.dealer_company.name : (created.department || 'WIA HQ')
        }]);
        setShowCreateModal(false);
        setNewUserForm({ username: '', email: '', role: 'RSM', department: '', dealer_company_id: '' });
      } else {
        const err = await res.json();
        alert(`생성 실패: ${err.detail || '알 수 없는 오류'}`);
      }
    } catch (err) {
      alert("서버 통신 오류가 발생했습니다.");
    } finally {
      setCreatingUser(false);
    }
  };

  const openEditModal = (user) => {
    setEditingUserId(user.id);
    setEditUserForm({
      username: user.name,
      email: user.email,
      role: user.role,
      department: user.company !== 'WIA HQ' && !dealers.find(d => d.name === user.company) ? user.company : '',
      dealer_company_id: dealers.find(d => d.name === user.company)?.id || ''
    });
    setShowEditModal(true);
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    setUpdatingUser(true);
    
    const payload = {
      username: editUserForm.username,
      email: editUserForm.email,
      role: editUserForm.role,
      department: ['SCM_ADMIN', 'RSM'].includes(editUserForm.role) ? editUserForm.department : null,
      dealer_company_id: editUserForm.role === 'DEALER' ? (editUserForm.dealer_company_id ? Number(editUserForm.dealer_company_id) : null) : null
    };

    try {
      const res = await fetch(`/api/users/${editingUserId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const updated = await res.json();
        // UI에 새 유저 업데이트
        setUsers(users.map(u => u.id === editingUserId ? {
          id: updated.id,
          name: updated.username,
          email: updated.email,
          role: updated.role,
          status: 'Active',
          lastLogin: u.lastLogin,
          company: updated.dealer_company ? updated.dealer_company.name : (updated.department || 'WIA HQ')
        } : u));
        setShowEditModal(false);
      } else {
        const err = await res.json();
        alert(`수정 실패: ${err.detail || '알 수 없는 오류'}`);
      }
    } catch (err) {
      alert("서버 통신 오류가 발생했습니다.");
    } finally {
      setUpdatingUser(false);
    }
  };

  // Compute KPI values
  const activeUsersCount = users.length;
  const pendingUsersCount = 0; // Default pending invitations
  
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const dailyLoginsCount = logs.filter(log => log.action && log.action.includes('Login') && log.time && log.time.startsWith(todayStr)).length;
  
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const securityAlertsCount = logs.filter(log => {
    if (!log.time) return false;
    const logDate = new Date(log.time.replace(' ', 'T'));
    return (log.status === 'Warning' || log.status === 'Failed') && logDate >= sevenDaysAgo;
  }).length;

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Active': return <span style={{ padding: '4px 8px', borderRadius: '4px', background: 'rgba(22, 196, 127, 0.1)', color: '#16C47F', fontSize: '0.8rem', fontWeight: 600 }}>{t('menu6.badge_active')}</span>;
      case 'Inactive': return <span style={{ padding: '4px 8px', borderRadius: '4px', background: 'rgba(128, 130, 133, 0.1)', color: '#808285', fontSize: '0.8rem', fontWeight: 600 }}>{t('menu6.badge_inactive')}</span>;
      case 'Locked': return <span style={{ padding: '4px 8px', borderRadius: '4px', background: 'rgba(230, 0, 18, 0.1)', color: '#E60012', fontSize: '0.8rem', fontWeight: 600 }}>{t('menu6.badge_locked')}</span>;
      default: return null;
    }
  };

  const getLogStatusBadge = (status) => {
    switch (status) {
      case 'Success': return <span style={{ padding: '4px 8px', borderRadius: '4px', background: 'rgba(22, 196, 127, 0.1)', color: '#16C47F', fontSize: '0.8rem', fontWeight: 600 }}><CheckCircle2 size={12} style={{display:'inline', marginRight:'4px'}}/>{t('menu6.badge_success')}</span>;
      case 'Failed': return <span style={{ padding: '4px 8px', borderRadius: '4px', background: 'rgba(230, 0, 18, 0.1)', color: '#E60012', fontSize: '0.8rem', fontWeight: 600 }}><XCircle size={12} style={{display:'inline', marginRight:'4px'}}/>{t('menu6.badge_failed')}</span>;
      case 'Warning': return <span style={{ padding: '4px 8px', borderRadius: '4px', background: 'rgba(205, 170, 125, 0.1)', color: '#CDAA7D', fontSize: '0.8rem', fontWeight: 600 }}><ShieldAlert size={12} style={{display:'inline', marginRight:'4px'}}/>{t('menu6.badge_warning')}</span>;
      default: return null;
    }
  };

  return (
    <div style={{ padding: isMobileView ? '16px' : '32px', animation: 'fadeIn 0.5s ease-out' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', paddingTop: '4px', paddingLeft: '28px' }}>
        <h1 style={{ fontSize: '1.75rem', color: 'var(--wia-blue)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShieldAlert size={28} />
          {t('menu6.page_title')}
        </h1>
        <button 
          onClick={() => setShowCreateModal(true)}
          style={{ 
          background: 'var(--wia-blue)', 
          color: 'white', 
          border: 'none', 
          padding: '8px 16px', 
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          cursor: 'pointer',
          fontWeight: 600
        }}>
          <UserPlus size={18} />
          <span>{t('menu6.btn_invite')}</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        <div className="clean-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', borderLeft: '4px solid #16C47F' }}>
          <div style={{ background: 'rgba(22, 196, 127, 0.1)', padding: '12px', borderRadius: '12px', color: '#16C47F' }}><Users size={24} /></div>
          <div>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{t('menu6.kpi_active')}</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{activeUsersCount}{i18n.language === 'ko' ? ' 명' : ''}</div>
          </div>
        </div>
        <div className="clean-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', borderLeft: '4px solid var(--wia-light-gold)' }}>
          <div style={{ background: 'rgba(205, 170, 125, 0.1)', padding: '12px', borderRadius: '12px', color: 'var(--wia-light-gold)' }}><Key size={24} /></div>
          <div>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{t('menu6.kpi_pending')}</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{pendingUsersCount}{i18n.language === 'ko' ? ' 명' : ''}</div>
          </div>
        </div>
        <div className="clean-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', borderLeft: '4px solid var(--wia-red)' }}>
          <div style={{ background: 'rgba(230, 0, 18, 0.1)', padding: '12px', borderRadius: '12px', color: 'var(--wia-red)' }}><ShieldAlert size={24} /></div>
          <div>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{t('menu6.kpi_security')}</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{securityAlertsCount}{i18n.language === 'ko' ? ' 건' : ''}</div>
          </div>
        </div>
        <div className="clean-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', borderLeft: '4px solid var(--wia-blue)' }}>
          <div style={{ background: 'rgba(10, 28, 143, 0.1)', padding: '12px', borderRadius: '12px', color: 'var(--wia-blue)' }}><Activity size={24} /></div>
          <div>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{t('menu6.kpi_daily')}</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{dailyLoginsCount}{i18n.language === 'ko' ? ' 회' : ''}</div>
          </div>
        </div>
      </div>

      {/* Main Content Tabs */}
      <div className="clean-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', gap: '24px' }}>
          <button 
            onClick={() => setActiveTab('users')}
            style={{
              background: 'none', border: 'none', padding: '12px 0', fontSize: '1rem', fontWeight: 600,
              cursor: 'pointer',
              color: activeTab === 'users' ? 'var(--wia-blue)' : 'var(--text-muted)',
              borderBottom: activeTab === 'users' ? '2px solid var(--wia-blue)' : '2px solid transparent',
              transition: 'all 0.2s'
            }}
          >
            {t('menu6.tab_users')}
          </button>
          <button 
            onClick={() => setActiveTab('logs')}
            style={{
              background: 'none', border: 'none', padding: '12px 0', fontSize: '1rem', fontWeight: 600,
              cursor: 'pointer',
              color: activeTab === 'logs' ? 'var(--wia-blue)' : 'var(--text-muted)',
              borderBottom: activeTab === 'logs' ? '2px solid var(--wia-blue)' : '2px solid transparent',
              transition: 'all 0.2s'
            }}
          >
            {t('menu6.tab_logs')}
          </button>
        </div>

        {activeTab === 'users' && (
          <div style={{ overflowX: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
              <div style={{ position: 'relative', width: '250px' }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="text" 
                  placeholder={t('menu6.search_users')} 
                  style={{ width: '100%', padding: '8px 12px 8px 36px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none' }}
                />
              </div>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 600 }}>{t('menu6.header_user_email')}</th>
                  <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 600 }}>{t('menu6.header_role')}</th>
                  <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 600 }}>{t('menu6.header_department')}</th>
                  <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 600 }}>{t('menu6.header_state')}</th>
                  <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 600 }}>{t('menu6.header_log')}</th>
                  <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 600, textAlign: 'center' }}>{t('menu6.header_edit')}</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '16px' }}>
                      <div style={{ fontWeight: 600 }}>{user.name}</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{user.email}</div>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <span style={{ background: 'var(--bg-secondary)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.85rem', fontWeight: 600 }}>{user.role}</span>
                    </td>
                    <td style={{ padding: '16px', fontSize: '0.9rem' }}>{user.company}</td>
                    <td style={{ padding: '16px' }}>{getStatusBadge(user.status)}</td>
                    <td style={{ padding: '16px', fontSize: '0.9rem', color: 'var(--text-muted)' }}><Clock size={14} style={{display:'inline', marginRight:'4px'}}/>{user.lastLogin}</td>
                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      <button onClick={() => openEditModal(user)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', marginRight: '8px' }}><Edit2 size={16} /></button>
                      <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--wia-red)' }}><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'logs' && (
          <div style={{ overflowX: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
              <div style={{ position: 'relative', width: '250px' }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="text" 
                  placeholder={t('menu6.search_logs')} 
                  style={{ width: '100%', padding: '8px 12px 8px 36px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none' }}
                />
              </div>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 600 }}>{t('menu6.header_date')}</th>
                  <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 600 }}>{t('menu6.header_action')}</th>
                  <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 600 }}>{t('menu6.header_user')}</th>
                  <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 600 }}>{t('menu6.header_ip')}</th>
                  <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 600 }}>{t('menu6.header_state')}</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '16px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>{log.time}</td>
                    <td style={{ padding: '16px', fontWeight: 600 }}>{log.action}</td>
                    <td style={{ padding: '16px', fontSize: '0.9rem' }}>{log.user}</td>
                    <td style={{ padding: '16px', fontSize: '0.9rem', fontFamily: 'monospace' }}>{log.ip}</td>
                    <td style={{ padding: '16px' }}>{getLogStatusBadge(log.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 신규 사용자 등록 모달 */}
      {showCreateModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: '20px'
        }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '500px', padding: '28px', position: 'relative' }}>
            <button
              onClick={closeCreateModal}
              style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
            >
              <XCircle size={24} />
            </button>
            <h2 style={{ fontSize: '1.4rem', marginBottom: '20px', color: 'var(--text-primary)' }}>{t('menu6.modal_title')}</h2>

            <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{t('menu6.label_username')} *</label>
                <input
                  type="text"
                  required
                  value={newUserForm.username}
                  onChange={e => setNewUserForm({ ...newUserForm, username: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{t('menu6.label_email')} *</label>
                <input
                  type="email"
                  required
                  value={newUserForm.email}
                  onChange={e => setNewUserForm({ ...newUserForm, email: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{t('menu6.label_role')} *</label>
                <select
                  required
                  value={newUserForm.role}
                  onChange={e => setNewUserForm({ ...newUserForm, role: e.target.value, dealer_company_id: '', department: '' })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)' }}
                >
                  <option value="SCM_ADMIN">SCM_ADMIN</option>
                  <option value="RSM">RSM</option>
                  <option value="DEALER">DEALER</option>
                </select>
              </div>

              {newUserForm.role === 'DEALER' && (
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{t('menu6.label_dealer')} *</label>
                  <select
                    required
                    value={newUserForm.dealer_company_id}
                    onChange={e => setNewUserForm({ ...newUserForm, dealer_company_id: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)' }}
                  >
                    <option value="">-- {t('menu6.label_dealer')} --</option>
                    {dealers.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {['SCM_ADMIN', 'RSM'].includes(newUserForm.role) && (
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{t('menu6.label_department')}</label>
                  <input
                    type="text"
                    value={newUserForm.department}
                    onChange={e => setNewUserForm({ ...newUserForm, department: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)' }}
                  />
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px', marginTop: '16px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={closeCreateModal} className="btn btn-outline">{t('menu6.btn_cancel')}</button>
                <button type="submit" disabled={creatingUser} className="btn btn-primary">
                  {creatingUser ? '...' : t('menu6.btn_register')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 사용자 정보 수정 모달 */}
      {showEditModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: '20px'
        }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '500px', padding: '28px', position: 'relative' }}>
            <button
              onClick={() => setShowEditModal(false)}
              style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
            >
              <XCircle size={24} />
            </button>
            <h2 style={{ fontSize: '1.4rem', marginBottom: '20px', color: 'var(--text-primary)' }}>{t('menu6.edit_modal_title')}</h2>

            <form onSubmit={handleUpdateUser} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{t('menu6.label_username')} *</label>
                <input
                  type="text"
                  required
                  value={editUserForm.username}
                  onChange={e => setEditUserForm({ ...editUserForm, username: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{t('menu6.label_email')} *</label>
                <input
                  type="email"
                  required
                  value={editUserForm.email}
                  onChange={e => setEditUserForm({ ...editUserForm, email: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{t('menu6.label_role')} *</label>
                <select
                  required
                  value={editUserForm.role}
                  onChange={e => setEditUserForm({ ...editUserForm, role: e.target.value, dealer_company_id: '', department: '' })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)' }}
                >
                  <option value="SCM_ADMIN">SCM_ADMIN</option>
                  <option value="RSM">RSM</option>
                  <option value="DEALER">DEALER</option>
                </select>
              </div>

              {editUserForm.role === 'DEALER' && (
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{t('menu6.label_dealer')} *</label>
                  <select
                    required
                    value={editUserForm.dealer_company_id}
                    onChange={e => setEditUserForm({ ...editUserForm, dealer_company_id: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)' }}
                  >
                    <option value="">-- {t('menu6.label_dealer')} --</option>
                    {dealers.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {['SCM_ADMIN', 'RSM'].includes(editUserForm.role) && (
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{t('menu6.label_department')}</label>
                  <input
                    type="text"
                    value={editUserForm.department}
                    onChange={e => setEditUserForm({ ...editUserForm, department: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)' }}
                  />
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px', marginTop: '16px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowEditModal(false)} className="btn btn-outline">{t('menu6.btn_cancel')}</button>
                <button type="submit" disabled={updatingUser} className="btn btn-primary">
                  {updatingUser ? '...' : t('menu6.btn_save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
