import React, { useState, useEffect } from 'react';
import { Search, Truck, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function AdminDispatch({ isMobileView }) {
  const { t } = useTranslation();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrderForHistory, setSelectedOrderForHistory] = useState(null);
  const [orderHistory, setOrderHistory] = useState([]);

  const fetchDispatchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/orders?status_filter=DISPATCHED');
      const data = await res.json();
      if (Array.isArray(data)) {
        setOrders(data);
      }
    } catch (err) {
      console.error("Failed to fetch dispatch orders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDispatchOrders();
  }, []);

  const handleViewHistory = async (order) => {
    setSelectedOrderForHistory(order);
    try {
      const res = await fetch(`/api/orders/${order.id}/history`);
      if (res.ok) {
        setOrderHistory(await res.json());
      } else {
        setOrderHistory([]);
      }
    } catch (e) {
      console.error(e);
      setOrderHistory([]);
    }
  };

  const closeHistory = () => {
    setSelectedOrderForHistory(null);
    setOrderHistory([]);
  };

  const filteredOrders = orders.filter(o => {
    const s = searchQuery.toLowerCase();
    const sn = o.serial_number ? o.serial_number.toLowerCase() : '';
    const mn = o.product_model ? o.product_model.model_name.toLowerCase() : '';
    const dn = o.dealer_company ? o.dealer_company.name.toLowerCase() : '';
    return sn.includes(s) || mn.includes(s) || dn.includes(s);
  });

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h2>출고완료 리스트</h2>
          <p>물류 및 SCM 담당자가 창고를 빠져나간 장비의 출고 이력을 관리합니다.</p>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="card full-width">
          <div className="card-header">
            <h3>출고된 장비 목록 ({filteredOrders.length})</h3>
            <div className="table-controls">
              <div className="search-bar">
                <Search size={18} className="search-icon" />
                <input 
                  type="text" 
                  placeholder="S/N, 모델, 딜러명 검색..." 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="table-responsive">
            {loading ? (
              <div style={{ padding: '20px', textAlign: 'center' }}>데이터를 불러오는 중...</div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>{t('sidebar.admin_menu.models', '모델명')}</th>
                    <th>{t('sidebar.admin_menu.sn', 'S/N')}</th>
                    <th>{t('sidebar.admin_menu.dealer', '배정된 딜러')}</th>
                    <th>출고 완료 일시</th>
                    <th style={{ textAlign: 'center' }}>상세 보기</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.length > 0 ? (
                    filteredOrders.map(order => (
                      <tr key={order.id}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{order.product_model ? order.product_model.model_name : '-'}</div>
                        </td>
                        <td>{order.serial_number || '-'}</td>
                        <td>{order.dealer_company ? order.dealer_company.name : '-'}</td>
                        <td>{new Date(order.current_status_changed_at).toLocaleString()}</td>
                        <td style={{ textAlign: 'center' }}>
                          <button
                            onClick={() => handleViewHistory(order)}
                            className="btn btn-outline"
                            style={{ padding: '4px 8px', fontSize: '11px', borderColor: 'var(--accent-blue)', color: 'var(--accent-blue)' }}
                          >
                            <Clock size={14} style={{ marginRight: '4px' }} />
                            타임라인 뷰
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: '30px' }}>출고된 장비가 없습니다.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {selectedOrderForHistory && (
        <div className="modal-overlay" onClick={closeHistory}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3 style={{ margin: 0 }}>타임라인 뷰 (진행 이력)</h3>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                {selectedOrderForHistory.product_model?.model_name} (S/N: {selectedOrderForHistory.serial_number || '미배정'})
              </p>
            </div>
            <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto', padding: '20px' }}>
              {orderHistory.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {orderHistory.map((hist, idx) => (
                    <div key={hist.id} style={{ display: 'flex', gap: '12px', borderLeft: '2px solid var(--border-color)', paddingLeft: '16px', position: 'relative' }}>
                      <div style={{
                        position: 'absolute', left: '-7px', top: '0', width: '12px', height: '12px', 
                        borderRadius: '50%', background: idx === 0 ? 'var(--accent-blue)' : 'var(--border-color)',
                        border: '2px solid white'
                      }}></div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                          {hist.from_status} → <span style={{ color: 'var(--accent-blue)' }}>{hist.to_status}</span>
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                          {new Date(hist.changed_at).toLocaleString()}
                        </div>
                        {hist.reason && (
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                            사유: {hist.reason}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>이력 데이터가 없습니다.</div>
              )}
            </div>
            <div className="modal-footer" style={{ borderTop: '1px solid var(--border-color)', padding: '16px 20px', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={closeHistory} className="btn btn-outline">닫기</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
