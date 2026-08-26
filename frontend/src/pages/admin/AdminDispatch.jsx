import React, { useState, useEffect } from 'react';
import { Search, Clock, CheckCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const getAgingStatus = (etd) => {
  if (!etd) return { status: '일반', days: 0, color: 'var(--status-stock)', bg: 'rgba(16, 185, 129, 0.1)' };
  const etdDate = new Date(etd);
  const today = new Date();
  const diffTime = Math.abs(today - etdDate);
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays <= 180) return { status: '일반', days: diffDays, color: 'var(--status-stock)', bg: 'rgba(16, 185, 129, 0.1)' };
  if (diffDays <= 360) return { status: '장기', days: diffDays, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' };
  return { status: '악성', days: diffDays, color: 'var(--accent-red)', bg: 'rgba(239, 68, 68, 0.1)' };
};

export default function AdminDispatch({ isMobileView }) {
  const { t } = useTranslation();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [agingFilter, setAgingFilter] = useState('ALL');
  const [stockTypeFilter, setStockTypeFilter] = useState('ALL');
  
  const [selectedOrderForHistory, setSelectedOrderForHistory] = useState(null);
  const [orderHistory, setOrderHistory] = useState([]);

  const fetchDispatchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/orders?status_filter=IN_STOCK');
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

  const handleDispatchOrder = async (orderId) => {
    if (!window.confirm("이 장비를 출고 처리하시겠습니까? (출고 처리 시 창고 리스트에서 제외됩니다)")) return;
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to_status: 'DISPATCHED',
          direction: 'FORWARD',
          changed_by_id: 1 // Default to 1 for simplicity here
        })
      });
      if (res.ok) {
        fetchDispatchOrders();
      } else {
        alert("출고 처리 중 오류가 발생했습니다.");
      }
    } catch (e) {
      console.error(e);
      alert("출고 처리 중 오류가 발생했습니다.");
    }
  };

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
    const po = o.reference_no ? o.reference_no.toLowerCase() : '';
    const matchesSearch = sn.includes(s) || mn.includes(s) || po.includes(s);
    if (!matchesSearch) return false;

    if (agingFilter === 'LONG_DEAD') {
      const aging = getAgingStatus(o.etd);
      if (aging.status === '일반') return false;
    }

    if (stockTypeFilter !== 'ALL') {
      const type = o.stock_type || 'AVAILABLE';
      if (type !== stockTypeFilter) return false;
    }

    return true;
  });

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h2>WIA 창고</h2>
          <p>물류 및 SCM 담당자가 입고된 장비의 상태를 관리합니다.</p>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="card full-width">
          <div className="card-header">
            <h3>입고된 장비 목록 ({filteredOrders.length})</h3>
            <div className="table-controls" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <div className="search-bar">
                <Search size={18} className="search-icon" />
                <input
                  type="text"
                  placeholder="S/N, 모델, P/O 검색"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
              <select 
                value={agingFilter} 
                onChange={(e) => setAgingFilter(e.target.value)}
                className="select-input"
                style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)' }}
              >
                <option value="ALL">전체 재고 (에이징)</option>
                <option value="LONG_DEAD">장기/악성 재고만 보기</option>
              </select>
              <select 
                value={stockTypeFilter} 
                onChange={(e) => setStockTypeFilter(e.target.value)}
                className="select-input"
                style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)' }}
              >
                <option value="ALL">전체 타입</option>
                <option value="AVAILABLE">판매가능 (AVAILABLE)</option>
                <option value="RENTAL">임대 (RENTAL)</option>
                <option value="SHOWROOM">전시 (SHOWROOM)</option>
                <option value="PROMOTION">프로모션 (PROMOTION)</option>
              </select>
            </div>
          </div>

          <div className="table-responsive">
            {loading ? (
              <div style={{ padding: '20px', textAlign: 'center' }}>데이터를 불러오는 중...</div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>모델</th>
                    <th>NC</th>
                    <th>P/O</th>
                    <th>S/N</th>
                    <th>선적일자(ETD)</th>
                    <th>입고일자</th>
                    <th style={{ textAlign: 'center' }}>재고상태(악성)</th>
                    <th>재고타입</th>
                    <th style={{ textAlign: 'center' }}>출고완료</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.length > 0 ? (
                    filteredOrders.map(order => {
                      const aging = getAgingStatus(order.etd);
                      const displayType = order.stock_type || 'AVAILABLE';
                      
                      return (
                        <tr key={order.id}>
                          <td>
                            <div style={{ fontWeight: 600 }}>{order.product_model?.model_name || '-'}</div>
                          </td>
                          <td>{order.nc || '-'}</td>
                          <td>{order.reference_no || '-'}</td>
                          <td>{order.serial_number || '-'}</td>
                          <td>{order.etd ? new Date(order.etd).toLocaleDateString() : '-'}</td>
                          <td>{order.current_status_changed_at ? new Date(order.current_status_changed_at).toLocaleDateString() : '-'}</td>
                          <td style={{ textAlign: 'center' }}>
                            <span style={{ 
                              display: 'inline-block', 
                              padding: '4px 8px', 
                              borderRadius: '12px', 
                              fontSize: '0.8rem', 
                              fontWeight: 600, 
                              color: aging.color,
                              background: aging.bg
                            }}>
                              {aging.status} ({aging.days}일)
                            </span>
                          </td>
                          <td>
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                              {displayType}
                            </span>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <button
                              onClick={() => handleDispatchOrder(order.id)}
                              className="btn btn-primary"
                              style={{ padding: '4px 8px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            >
                              <CheckCircle size={14} /> 출고 처리
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="9" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>조건에 맞는 입고 장비가 없습니다.</td>
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
