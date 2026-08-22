import React, { useState, useEffect } from 'react';
import { Search, Package, CheckCircle2 } from 'lucide-react';

export default function DealerInventory({ isMobileView }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const [expandedRows, setExpandedRows] = useState(new Set());

  const toggleRow = (orderId) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  };

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/orders?is_corporate_stock=true');
      const data = await res.json();
      if (Array.isArray(data)) {
        // 딜러는 '일반 판매용(AVAILABLE)' 또는 임대/전시 목적의 재고를 볼 수 있음
        // V7 요구사항: "SCM-ADMIN이 관리하는 유럽법인 가용 재고(Stock) 리스트를 딜러들이 열람. 검색창, 재고 스펙 확인."
        setOrders(data);
      }
    } catch (err) {
      console.error("Failed to fetch inventory:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const filteredOrders = orders.filter(o => {
    const query = searchQuery.toLowerCase();
    const matchesQuery = (o.reference_no && o.reference_no.toLowerCase().includes(query)) ||
                         (o.nc && o.nc.toLowerCase().includes(query)) ||
                         (o.product_model && o.product_model.model_name && o.product_model.model_name.toLowerCase().includes(query)) ||
                         (o.serial_number && o.serial_number.toLowerCase().includes(query));
    
    return matchesQuery;
  });

  return (
    <div className="page-body">
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.8rem', marginBottom: '4px' }}>유럽 재고 상태</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          SCM-ADMIN이 관리하는 유럽 법인의 가용 재고(Stock) 전체 목록을 열람합니다. (읽기 전용)
        </p>
      </div>

      <div className="glass-card no-hover-bg" style={{ padding: '28px', marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h2 style={{ fontSize: '1.3rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Package size={20} color="var(--status-stock)" />
              <span>법인 가용 재고 목록</span>
            </h2>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative' }}>
              <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="모델명, NC, P/O, S/N 검색..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-primary)',
                  padding: '8px 14px 8px 36px', borderRadius: '10px', fontSize: '0.85rem', width: '240px'
                }}
              />
            </div>
          </div>
        </div>

        {isMobileView ? (
          <div className="mobile-cards-grid">
            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>데이터를 불러오는 중입니다...</div>
            ) : filteredOrders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>가용 재고 내역이 없습니다.</div>
            ) : (
              filteredOrders.map((order, index) => {
                const sType = order.stock_type || 'AVAILABLE';
                
                return (
                  <div key={order.id} className="mobile-order-card" onClick={() => toggleRow(order.id)} style={{ cursor: 'pointer' }}>
                    <div className="mobile-order-header">
                      <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                        {order.product_model ? order.product_model.model_name : 'Unknown Model'}
                      </div>
                      <div style={{ fontWeight: 700, color: 'var(--accent-cyan)', fontSize: '0.9rem' }}>
                        {order.reference_no}
                      </div>
                    </div>
                    <div className="mobile-order-meta">
                      <span>NC: <strong style={{ color: 'var(--text-primary)' }}>{order.nc || 'F0iP'}</strong></span>
                      <span>ETA: <strong style={{ color: 'var(--text-primary)' }}>{order.eta ? new Date(order.eta).toLocaleDateString() : '-'}</strong></span>
                    </div>
                    
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.4, padding: '10px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                      {order.detail_spec || 'T/F, CC(S-H)+B, 20BAR, B/I, P/C, Q(A)'}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>용도</span>
                      {sType === 'AVAILABLE' && <span className="status-badge" style={{ background: 'hsla(142, 76%, 46%, 0.2)', color: 'var(--status-stock)', width: '80px', justifyContent: 'center', fontSize: '11px' }}>판매가능</span>}
                      {sType === 'DEALER_ORDER' && <span className="status-badge" style={{ background: 'hsla(200, 76%, 46%, 0.2)', color: 'var(--accent-cyan)', width: '80px', justifyContent: 'center', fontSize: '11px' }}>딜러주문</span>}
                      {sType === 'RENTAL' && <span className="status-badge" style={{ background: 'hsla(45, 93%, 58%, 0.2)', color: 'var(--status-production)', width: '80px', justifyContent: 'center', fontSize: '11px' }}>임대</span>}
                      {sType === 'SHOWROOM' && <span className="status-badge" style={{ background: 'hsla(280, 80%, 60%, 0.2)', color: 'var(--accent-purple)', width: '80px', justifyContent: 'center', fontSize: '11px' }}>전시</span>}
                      {sType === 'PROMOTION' && <span className="status-badge" style={{ background: 'hsla(340, 82%, 52%, 0.2)', color: 'var(--accent-pink)', width: '80px', justifyContent: 'center', fontSize: '11px' }}>프로모션</span>}
                    </div>

                    {expandedRows.has(order.id) && (
                      <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px dashed var(--border-color)', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        <div style={{ display: 'flex' }}><strong style={{ color: 'var(--text-primary)', width: '90px' }}>진행상태:</strong> <span>{order.current_status}</span></div>
                        <div style={{ display: 'flex' }}><strong style={{ color: 'var(--text-primary)', width: '90px' }}>S/N:</strong> <span>{order.serial_number || '-'}</span></div>
                        <div style={{ display: 'flex' }}><strong style={{ color: 'var(--text-primary)', width: '90px' }}>S/O:</strong> <span>{order.so_no || '-'}</span></div>
                        <div style={{ display: 'flex' }}><strong style={{ color: 'var(--text-primary)', width: '90px' }}>ETD / ETA:</strong> <span>{order.etd ? new Date(order.etd).toLocaleDateString() : '-'} / {order.eta ? new Date(order.eta).toLocaleDateString() : '-'}</span></div>
                        <div style={{ display: 'flex' }}><strong style={{ color: 'var(--text-primary)', width: '90px' }}>VESSEL:</strong> <span>{order.vessel || '-'}</span></div>
                        <div style={{ display: 'flex' }}><strong style={{ color: 'var(--text-primary)', width: '90px' }}>위치:</strong> <span>{order.physical_location || '유럽 물류센터'}</span></div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        ) : (
          <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '5%' }}>No.</th>
                <th style={{ width: '15%' }}>모델</th>
                <th style={{ width: '10%' }}>NC</th>
                <th style={{ width: '15%' }}>P/O</th>
                <th style={{ width: '25%' }}>DETAIL SPEC</th>
                <th style={{ width: '15%' }}>ETA</th>
                <th style={{ width: '15%' }}>용도</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>데이터를 불러오는 중입니다...</td></tr>
              ) : filteredOrders.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>가용 재고 내역이 없습니다.</td></tr>
              ) : (
                filteredOrders.map((order, index) => {
                  const sType = order.stock_type || 'AVAILABLE';
                  return (
                    <React.Fragment key={order.id}>
                      <tr 
                        onClick={() => toggleRow(order.id)} 
                        style={{ cursor: 'pointer', transition: 'background-color 0.2s' }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <td style={{ borderBottom: expandedRows.has(order.id) ? 'none' : '1px solid var(--border-color)', paddingBottom: '4px', paddingTop: '4px' }}>
                          <div style={{ fontWeight: 500, fontSize: '12px' }}>{index + 1}</div>
                        </td>
                        <td style={{ borderBottom: expandedRows.has(order.id) ? 'none' : '1px solid var(--border-color)', paddingBottom: '4px', paddingTop: '4px' }}>
                          <div style={{ fontWeight: 600, fontSize: '12px' }}>{order.product_model ? order.product_model.model_name : 'Unknown Model'}</div>
                        </td>
                        <td style={{ borderBottom: expandedRows.has(order.id) ? 'none' : '1px solid var(--border-color)', paddingBottom: '4px', paddingTop: '4px' }}>
                          <div style={{ fontSize: '10px' }}>{order.nc || 'F0iP'}</div>
                        </td>
                        <td style={{ borderBottom: expandedRows.has(order.id) ? 'none' : '1px solid var(--border-color)', paddingBottom: '4px', paddingTop: '4px' }}>
                          <div style={{ fontWeight: 700, color: 'var(--accent-cyan)', fontSize: '12px' }}>{order.reference_no}</div>
                        </td>
                        <td style={{ borderBottom: expandedRows.has(order.id) ? 'none' : '1px solid var(--border-color)', paddingBottom: '4px', paddingTop: '4px' }}>
                          <div style={{ fontSize: '10px' }}>{order.detail_spec || 'T/F, CC(S-H)+B, 20BAR, B/I, P/C, Q(A)'}</div>
                        </td>
                        <td style={{ borderBottom: expandedRows.has(order.id) ? 'none' : '1px solid var(--border-color)', paddingBottom: '4px', paddingTop: '4px' }}>
                          <div style={{ fontSize: '10px' }}>{order.eta ? new Date(order.eta).toLocaleDateString() : '-'}</div>
                        </td>
                        <td style={{ borderBottom: expandedRows.has(order.id) ? 'none' : '1px solid var(--border-color)', paddingBottom: '4px', paddingTop: '4px' }}>
                          {sType === 'AVAILABLE' && <span className="status-badge" style={{ background: 'hsla(142, 76%, 46%, 0.2)', color: 'var(--status-stock)', width: '72px', justifyContent: 'center', fontSize: '11px' }}>판매가능</span>}
                          {sType === 'DEALER_ORDER' && <span className="status-badge" style={{ background: 'hsla(200, 76%, 46%, 0.2)', color: 'var(--accent-cyan)', width: '72px', justifyContent: 'center', fontSize: '11px' }}>딜러주문</span>}
                          {sType === 'RENTAL' && <span className="status-badge" style={{ background: 'hsla(45, 93%, 58%, 0.2)', color: 'var(--status-production)', width: '72px', justifyContent: 'center', fontSize: '11px' }}>임대</span>}
                          {sType === 'SHOWROOM' && <span className="status-badge" style={{ background: 'hsla(280, 80%, 60%, 0.2)', color: 'var(--accent-purple)', width: '72px', justifyContent: 'center', fontSize: '11px' }}>전시</span>}
                          {sType === 'PROMOTION' && <span className="status-badge" style={{ background: 'hsla(340, 82%, 52%, 0.2)', color: 'var(--accent-pink)', width: '72px', justifyContent: 'center', fontSize: '11px' }}>프로모션</span>}
                        </td>
                      </tr>
                      {expandedRows.has(order.id) && (
                        <tr>
                          <td colSpan={3} style={{ backgroundColor: 'var(--bg-card)', padding: '16px', borderTop: '1px dashed var(--border-color)', borderBottom: '1px solid var(--border-color)', verticalAlign: 'top' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px', paddingLeft: '8px' }}>
                              <div><span style={{ fontWeight: 600, color: 'var(--text-secondary)', display: 'inline-block', width: '80px' }}>진행상태:</span> {order.current_status}</div>
                              <div><span style={{ fontWeight: 600, color: 'var(--text-secondary)', display: 'inline-block', width: '80px' }}>S/N:</span> {order.serial_number || '-'}</div>
                              <div><span style={{ fontWeight: 600, color: 'var(--text-secondary)', display: 'inline-block', width: '80px' }}>S/O:</span> {order.so_no || '-'}</div>
                            </div>
                          </td>
                          <td colSpan={4} style={{ backgroundColor: 'var(--bg-card)', padding: '16px', borderTop: '1px dashed var(--border-color)', borderBottom: '1px solid var(--border-color)', verticalAlign: 'top' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px', paddingLeft: '8px' }}>
                              <div><span style={{ fontWeight: 600, color: 'var(--text-secondary)', display: 'inline-block', width: '100px' }}>ETD / ETA :</span> {order.etd ? new Date(order.etd).toLocaleDateString() : '-'} / {order.eta ? new Date(order.eta).toLocaleDateString() : '-'}</div>
                              <div><span style={{ fontWeight: 600, color: 'var(--text-secondary)', display: 'inline-block', width: '100px' }}>VESSEL:</span> {order.vessel || '-'}</div>
                              <div><span style={{ fontWeight: 600, color: 'var(--text-secondary)', display: 'inline-block', width: '100px' }}>위치:</span> {order.physical_location || '유럽 물류센터'}</div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        )}
      </div>
    </div>
  );
}
