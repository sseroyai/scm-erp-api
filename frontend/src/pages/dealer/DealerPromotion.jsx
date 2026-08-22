import React, { useState, useEffect } from 'react';
import { Tag, CheckCircle, Clock, CheckCircle2 } from 'lucide-react';

export default function DealerPromotion({ isMobileView }) {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/promotions');
      const data = await res.json();
      setPromotions(data);
    } catch (e) {
      console.error("Promotion data fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRequestReserve = (promoId, modelName) => {
    alert(`[${modelName}] 프로모션 기계에 대한 예약/구매 요청이 유럽 법인 영업팀으로 발송되었습니다. 담당자가 확인 후 회신드릴 예정입니다.`);
  };

  return (
    <div className="page-body">
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.8rem', marginBottom: '4px' }}>법인 주관 프로모션 안내</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          유럽 법인에서 특별 조건으로 제공하는 프로모션 장비 리스트를 확인하고 예약을 요청할 수 있습니다.
        </p>
      </div>

      <div className="glass-card" style={{ padding: '28px', marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
          <Tag color="var(--status-production)" size={24} />
          <h2 style={{ fontSize: '1.3rem' }}>현재 진행 중인 프로모션 장비 현황</h2>
        </div>
        
        {loading ? (
           <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>로딩 중...</div>
        ) : isMobileView ? (
          <div className="mobile-cards-grid">
            {promotions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>진행 중인 프로모션이 없습니다.</div>
            ) : (
              promotions.map((promo, index) => {
                const modelName = promo.order && promo.order.product_model ? promo.order.product_model.model_name : 'Unknown';
                return (
                  <div key={promo.id} className="mobile-order-card">
                    <div className="mobile-order-header">
                      <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                        {modelName}
                      </div>
                      <div style={{ fontWeight: 700, color: 'var(--accent-cyan)', fontSize: '0.9rem' }}>
                        {(promo.order && promo.order.reference_no) || 'F26-88-30'}
                      </div>
                    </div>
                    <div className="mobile-order-meta">
                      <span>NC: <strong style={{ color: 'var(--text-primary)' }}>{promo.order && promo.order.nc ? promo.order.nc : 'F0iP'}</strong></span>
                      <span>ETA: <strong style={{ color: 'var(--text-primary)' }}>{promo.order && promo.order.eta ? new Date(promo.order.eta).toLocaleDateString() : '-'}</strong></span>
                    </div>
                    
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.4, padding: '10px', background: 'var(--bg-secondary)', borderRadius: '8px', marginBottom: '12px' }}>
                      {(promo.order && promo.order.detail_spec) || 'T/F, CC(S-H)+B, 20BAR, B/I, P/C, Q(A)'}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>상태</span>
                      {promo.status === 'AVAILABLE' && <span className="status-badge" style={{ background: 'hsla(190, 95%, 49%, 0.2)', color: 'var(--accent-cyan)', width: '80px', justifyContent: 'center', fontSize: '11px' }}>판매가능</span>}
                      {promo.status === 'RESERVED' && <span className="status-badge" style={{ background: 'hsla(45, 93%, 58%, 0.2)', color: 'var(--status-production)', width: '80px', justifyContent: 'center', fontSize: '11px' }}>예약중</span>}
                      {promo.status === 'SOLD' && <span className="status-badge" style={{ background: 'hsla(142, 76%, 46%, 0.2)', color: 'var(--status-stock)', width: '80px', justifyContent: 'center', fontSize: '11px' }}>판매완료</span>}
                    </div>

                    <div>
                      {promo.status === 'AVAILABLE' && (
                        <button
                          onClick={() => handleRequestReserve(promo.id, modelName)}
                          className="btn btn-outline"
                          style={{ padding: '8px', fontSize: '0.85rem', width: '100%', borderColor: 'var(--accent-cyan)', color: 'var(--accent-cyan)', fontWeight: 600 }}
                        >
                          예약 및 구매 문의
                        </button>
                      )}
                      {promo.status === 'RESERVED' && (
                        <div style={{ fontSize: '0.85rem', color: 'var(--status-production)', fontWeight: 500, textAlign: 'center', padding: '8px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                          예약 만료일: {promo.reservation_expiry ? new Date(promo.reservation_expiry).toLocaleDateString() : '미정'}
                        </div>
                      )}
                      {promo.status === 'SOLD' && (
                        <div style={{ textAlign: 'center', padding: '8px', background: 'var(--bg-secondary)', borderRadius: '8px', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>
                          신청 불가
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : (
          <div className="data-table-container">
            <table className="data-table promotion-table">
              <thead>
                <tr>
                  <th style={{ width: '3%' }}>No.</th>
                  <th style={{ width: '10%' }}>모델</th>
                  <th style={{ width: '5%' }}>NC</th>
                  <th style={{ width: '10%' }}>P/O</th>
                  <th style={{ width: '40%' }}>DETAIL SPEC</th>
                  <th style={{ width: '8%' }}>ETA</th>
                  <th style={{ width: '10%' }}>프로모션 진행</th>
                  <th style={{ width: '14%' }}>예약 / 구매 요청</th>
                </tr>
              </thead>
              <tbody>
                {promotions.length === 0 ? (
                  <tr><td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>진행 중인 프로모션이 없습니다.</td></tr>
                ) : (
                  promotions.map((promo, index) => {
                    const modelName = promo.order && promo.order.product_model ? promo.order.product_model.model_name : 'Unknown';
                    return (
                      <tr key={promo.id}>
                        <td style={{ textAlign: 'center' }}>
                          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 500 }}>{index + 1}</span>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, fontSize: '12px' }}>
                            {modelName}
                          </div>
                        </td>
                        <td>
                          <div style={{ fontSize: '12px' }}>
                            {promo.order && promo.order.nc ? promo.order.nc : 'F0iP'}
                          </div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 700, color: 'var(--accent-cyan)', fontSize: '11px' }}>
                            {(promo.order && promo.order.reference_no) || 'F26-88-30'}
                          </div>
                        </td>
                        <td>
                          <div style={{ fontSize: '11px' }}>
                            {(promo.order && promo.order.detail_spec) || 'T/F, CC(S-H)+B, 20BAR, B/I, P/C, Q(A)'}
                          </div>
                        </td>
                        <td>
                          <div style={{ fontSize: '11px' }}>
                            {promo.order && promo.order.eta ? new Date(promo.order.eta).toLocaleDateString() : '-'}
                          </div>
                        </td>
                        <td>
                          {promo.status === 'AVAILABLE' && <span className="status-badge" style={{ background: 'hsla(190, 95%, 49%, 0.2)', color: 'var(--accent-cyan)', width: '85px', justifyContent: 'center', fontSize: '11px' }}>판매가능</span>}
                          {promo.status === 'RESERVED' && <span className="status-badge" style={{ background: 'hsla(45, 93%, 58%, 0.2)', color: 'var(--status-production)', width: '85px', justifyContent: 'center', fontSize: '11px' }}>예약중</span>}
                          {promo.status === 'SOLD' && <span className="status-badge" style={{ background: 'hsla(142, 76%, 46%, 0.2)', color: 'var(--status-stock)', width: '85px', justifyContent: 'center', fontSize: '11px' }}>판매완료</span>}
                        </td>
                        <td style={{ fontSize: '11px' }}>
                          {promo.status === 'AVAILABLE' && (
                            <button
                              onClick={() => handleRequestReserve(promo.id, modelName)}
                              className="btn btn-outline"
                              style={{ padding: '3px 4px', fontSize: '10px', justifyContent: 'center', borderColor: 'var(--accent-cyan)', color: 'var(--accent-cyan)' }}
                            >
                              예약 및 구매 문의
                            </button>
                          )}
                          {promo.status === 'RESERVED' && (
                            <div style={{ fontSize: '11px', color: 'var(--status-production)', fontWeight: 500 }}>
                              예약 만료일: {promo.reservation_expiry ? new Date(promo.reservation_expiry).toLocaleDateString() : '미정'}
                            </div>
                          )}
                          {promo.status === 'SOLD' && (
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>신청 불가</span>
                          )}
                        </td>
                      </tr>
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
