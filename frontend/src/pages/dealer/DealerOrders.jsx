import React, { useState, useEffect } from 'react';
import { Search, MapPin, Clock, Smartphone, Monitor } from 'lucide-react';
import StepBar from '../../components/StepBar';

export default function DealerOrders({ isMobileView }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL');

  const [simulateMobile, setSimulateMobile] = useState(false);
  const effectiveMobileView = isMobileView || simulateMobile;

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

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const dealersRes = await fetch('/api/dealers');
      const dealers = await dealersRes.json();
      const akMakina = dealers.find(d => d.name === 'AK MAKINA');
      const dealerId = akMakina ? akMakina.id : '';

      const res = await fetch(`/api/orders?dealer_id=${dealerId}&exclude_completed=true`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setOrders(data);
      }
    } catch (err) {
      console.error("Failed to fetch orders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const filteredOrders = orders.filter(o => {
    const matchesQuery = o.reference_no.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.product_model && o.product_model.model_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (o.serial_number && o.serial_number.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = selectedStatusFilter === 'ALL' || o.current_status === selectedStatusFilter;
    return matchesQuery && matchesStatus;
  });

  return (
    <div className="page-body">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div className="strategy-badge mobile-responsive">
          <Smartphone size={16} />
          <span>현장 접근성 강화를 위한 모바일 대응 페이지</span>
        </div>

        {!isMobileView && (
          <button
            onClick={() => setSimulateMobile(!simulateMobile)}
            className="btn btn-outline"
            style={{ padding: '6px 14px', fontSize: '0.8rem', borderColor: simulateMobile ? 'var(--accent-cyan)' : 'var(--border-color)' }}
          >
            {simulateMobile ? <Monitor size={16} color="var(--accent-cyan)" /> : <Smartphone size={16} />}
            <span>{simulateMobile ? '🖥️ 데스크탑 뷰로 복귀' : '📱 모바일 리스트 뷰 시뮬레이션'}</span>
          </button>
        )}
      </div>

      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.8rem', marginBottom: '4px' }}>내 발주 및 배송상태</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          레퍼런스 번호, S/N 기반으로 내 발주 건의 상세 6단계 배송 타임라인을 조회합니다.
        </p>
      </div>

      <div className="glass-card no-hover-bg" style={{ padding: effectiveMobileView ? '20px' : '28px', marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h2 style={{ fontSize: '1.3rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
              배송 추적 파이프라인
            </h2>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', width: effectiveMobileView ? '100%' : 'auto' }}>
            <div style={{ position: 'relative', flex: effectiveMobileView ? 1 : 'none' }}>
              <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="발주번호, 모델명, S/N 검색..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-primary)',
                  padding: '8px 14px 8px 36px', borderRadius: '10px', fontSize: '0.85rem', width: effectiveMobileView ? '100%' : '240px'
                }}
              />
            </div>

            <select
              value={selectedStatusFilter}
              onChange={e => setSelectedStatusFilter(e.target.value)}
              style={{
                background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-primary)',
                padding: '8px 14px', borderRadius: '10px', fontSize: '0.85rem', cursor: 'pointer', flex: effectiveMobileView ? 1 : 'none'
              }}
            >
              <option value="ALL">전체 상태 조회</option>
              <option value="CONFIRMED">1. 주문</option>
              <option value="IN_PRODUCTION">2. 생산 중</option>
              <option value="SHIPPING">3. 배송</option>
              <option value="ARRIVED">4. 항구도착</option>
              <option value="IN_STOCK">5. 입고</option>
            </select>
          </div>
        </div>

        {effectiveMobileView ? (
          <div className="mobile-cards-grid">
            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>데이터를 불러오는 중입니다...</div>
            ) : filteredOrders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>발주 내역이 없습니다.</div>
            ) : (
              filteredOrders.map(order => (
                <div key={order.id} className="mobile-order-card">
                  <div className="mobile-order-header">
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>REFERENCE NO.</span>
                      <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--accent-cyan)' }}>{order.reference_no}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>S/N: {order.serial_number || 'S/N 미발급'}</div>
                    </div>
                  </div>

                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {order.product_model ? order.product_model.model_name : 'Unknown Model'}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--accent-blue)' }}>
                      {order.product_model && order.product_model.category ? order.product_model.category.name : ''}
                    </div>
                  </div>

                  <div style={{ background: 'var(--bg-input)', padding: '12px', borderRadius: '12px', border: '1px solid var(--border-color)', marginBottom: '12px' }}>
                    <StepBar currentStatus={order.current_status} />
                  </div>

                  <div className="mobile-order-meta" style={{ flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <MapPin size={15} color="var(--accent-cyan)" />
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>현재 위치:</span>
                      <span>{order.physical_location || '유럽 이동 중'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Clock size={15} color="var(--accent-blue)" />
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>도착 예정(ETA):</span>
                      <span style={{ color: 'var(--accent-blue)', fontWeight: 600 }}>
                        {order.eta ? new Date(order.eta).toLocaleDateString() : '미정'}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '15%' }}>모델</th>
                  <th style={{ width: '15%' }}>Ref No. / S/N</th>
                  <th style={{ width: '15%' }}>DEALER</th>
                  <th style={{ width: '40%' }}>진행 상태 (Step Indicator)</th>
                  <th style={{ width: '15%' }}>도착지 / 스케줄</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>불러오는 중...</td></tr>
                ) : filteredOrders.length === 0 ? (
                  <tr><td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>내역이 없습니다.</td></tr>
                ) : (
                  filteredOrders.map(order => {
                    const showSchedule = !['CONFIRMED', 'IN_PRODUCTION'].includes(order.current_status);
                    return (
                      <React.Fragment key={order.id}>
                        <tr
                          onClick={() => toggleRow(order.id)}
                          style={{ cursor: 'pointer', transition: 'background-color 0.2s' }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          <td style={{ borderBottom: expandedRows.has(order.id) ? 'none' : '1px solid var(--border-color)', paddingBottom: '12px', paddingTop: '12px' }}>
                            <div style={{ fontWeight: 600 }}>{order.product_model ? order.product_model.model_name : 'Unknown Model'}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{order.product_model && order.product_model.category ? order.product_model.category.name : 'Machining Center'}</div>
                          </td>
                          <td style={{ borderBottom: expandedRows.has(order.id) ? 'none' : '1px solid var(--border-color)', paddingBottom: '12px', paddingTop: '12px' }}>
                            <div style={{ fontWeight: 600 }}>
                              {order.reference_no || 'F26-88-30'}
                            </div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                              {order.serial_number || 'G8888-8888'}
                            </div>
                          </td>
                          <td style={{ borderBottom: expandedRows.has(order.id) ? 'none' : '1px solid var(--border-color)', paddingBottom: '12px', paddingTop: '12px' }}>
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                              {order.dealer_company ? order.dealer_company.name : 'WME'}
                            </div>
                          </td>
                          <td style={{ borderBottom: expandedRows.has(order.id) ? 'none' : '1px solid var(--border-color)', paddingBottom: '12px', paddingTop: '12px' }}>
                            <StepBar currentStatus={order.current_status} />
                          </td>
                          <td style={{ borderBottom: expandedRows.has(order.id) ? 'none' : '1px solid var(--border-color)', paddingBottom: '12px', paddingTop: '12px' }}>
                            <div style={{ fontSize: '0.85rem', fontWeight: 500 }}>{order.destination_port || 'HAMBURG'}</div>
                            {showSchedule && (
                              <>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                                  ETD: {order.etd ? new Date(order.etd).toLocaleDateString() : '2026.08.10'}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                  ETA: {order.eta ? new Date(order.eta).toLocaleDateString() : '2026.09.15'}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                  Actual: {order.actual_date || '2026.09.30'}
                                </div>
                              </>
                            )}
                          </td>
                        </tr>
                        {expandedRows.has(order.id) && (
                          <tr>
                            <td colSpan={5} style={{ backgroundColor: 'var(--bg-card)', paddingTop: '8px', borderTop: '1px dashed var(--border-color)', paddingBottom: '16px', borderBottom: '1px solid var(--border-color)' }}>
                              <div style={{
                                fontSize: '0.8rem',
                                color: 'var(--text-secondary)',
                                lineHeight: '1.6',
                                textAlign: 'left',
                                paddingLeft: '16px',
                                borderLeft: '3px solid var(--accent-cyan)',
                                marginLeft: '8px'
                              }}>
                                <div><span style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'inline-block', width: '100px' }}>NC:</span> {order.nc_type || 'F0iP'}</div>
                                <div><span style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'inline-block', width: '100px' }}>DETAIL SPEC:</span> {order.options || 'T/F,CC(S-H)+B,20BAR,B/I,P/C,Q(A)'}</div>
                                <div><span style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'inline-block', width: '100px' }}>S/O:</span> {order.id || '12345'}</div>
                                <div><span style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'inline-block', width: '100px' }}>VESSEL:</span> {order.vessel_name || 'HMM HAMBURG 0015W'}</div>
                                <div><span style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'inline-block', width: '100px' }}>REMARK:</span> {order.remark || ''}</div>
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
