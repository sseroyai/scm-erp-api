import React, { useState, useEffect } from 'react';
import { Tag, CheckCircle, Clock, CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function AdminPromotion({ isMobileView }) {
  const { t } = useTranslation();
  const [promotions, setPromotions] = useState([]);
  const [dealers, setDealers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [reservingId, setReservingId] = useState(null);
  const [selectedDealerId, setSelectedDealerId] = useState('');
  const [reservedUntilDays, setReservedUntilDays] = useState(7);

  const [sellingId, setSellingId] = useState(null);
  const [finalBuyerDealerId, setFinalBuyerDealerId] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [promoRes, dealerRes] = await Promise.all([
        fetch('/api/promotions'),
        fetch('/api/dealers')
      ]);
      setPromotions(await promoRes.json());
      setDealers(await dealerRes.json());
    } catch (e) {
      console.error("Promotion data fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleConfirmReserve = async (promoId) => {
    if (!selectedDealerId) return alert("예약할 유럽 현지 딜러사를 선택해주세요.");
    
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + Number(reservedUntilDays));

    try {
      const res = await fetch(`/api/promotions/${promoId}/reserve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reserved_dealer_id: Number(selectedDealerId),
          reservation_expiry: expiryDate.toISOString()
        })
      });
      if (res.ok) {
        alert("성공적으로 해당 장비가 딜러사 전용 예약(Reserved) 처리되었습니다.");
        setReservingId(null);
        loadData();
      } else {
        const err = await res.json();
        alert(err.detail || "예약 처리 실패");
      }
    } catch (e) {
      alert("서버 연결 실패");
    }
  };

  const handleCancelReservation = async (promoId) => {
    if (!window.confirm("정말로 예약을 취소하시겠습니까? 해당 장비는 다시 판매가능(AVAILABLE) 상태로 돌아갑니다.")) return;
    try {
      const res = await fetch(`/api/promotions/${promoId}/cancel`, {
        method: 'PATCH'
      });
      if (res.ok) {
        alert("예약이 취소되었습니다.");
        loadData();
      } else {
        const err = await res.json();
        alert(err.detail || "예약 취소 실패");
      }
    } catch (e) {
      alert("서버 연결 실패");
    }
  };

  const handleConfirmSold = async (promoId) => {
    if (!finalBuyerDealerId) return alert("최종 실 구매 딜러사를 선택해주세요.");

    try {
      const res = await fetch(`/api/promotions/${promoId}/sold`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ final_buyer_dealer_id: Number(finalBuyerDealerId) })
      });
      if (res.ok) {
        alert("장기 재고 프로모션 판매가 확정되었습니다! (시리얼 추적 마스터 연동)");
        setSellingId(null);
        setFinalBuyerDealerId('');
        loadData();
      } else {
        const err = await res.json();
        alert(err.detail || "판매 처리 실패");
      }
    } catch (e) {
      alert("서버 연결 실패");
    }
  };

  return (
    <div className="page-body">
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.8rem', marginBottom: '4px' }}>{t('menu3.page_title', '프로모션 관리')}</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          {t('menu3.page_desc', '프로모션 이벤트 기종의 예약/판매 상태를 관리합니다.')}
        </p>
      </div>

      <div className="glass-card" style={{ padding: '28px', marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
          <Tag color="var(--status-production)" size={24} />
          <h2 style={{ fontSize: '1.3rem' }}>{t('menu3.list_title', '프로모션 리스트 및 실시간 예약 관리')}</h2>
        </div>
        
        {loading ? (
           <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>로딩 중...</div>
        ) : isMobileView ? (
          <div className="mobile-cards-grid">
            {promotions.map((promo, index) => (
              <div key={promo.id} className="mobile-order-card">
                <div className="mobile-order-header">
                  <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                    {promo.order && promo.order.product_model ? promo.order.product_model.model_name : 'Unknown Model'}
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
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>STATUS</span>
                  {promo.status === 'AVAILABLE' && <span className="status-badge" style={{ background: 'hsla(190, 95%, 49%, 0.2)', color: 'var(--accent-cyan)', width: '80px', justifyContent: 'center', fontSize: '11px' }}>{t('menu3.status_available', '판매가능')}</span>}
                  {promo.status === 'RESERVED' && <span className="status-badge" style={{ background: 'hsla(45, 93%, 58%, 0.2)', color: 'var(--status-production)', width: '80px', justifyContent: 'center', fontSize: '11px' }}>{t('menu3.status_reserved', '예약중')}</span>}
                  {promo.status === 'SOLD' && <span className="status-badge" style={{ background: 'hsla(142, 76%, 46%, 0.2)', color: 'var(--status-stock)', width: '80px', justifyContent: 'center', fontSize: '11px' }}>{t('menu3.status_sold', '판매완료')}</span>}
                </div>

                <div style={{ fontSize: '0.85rem', paddingBottom: '12px', borderBottom: '1px dashed var(--border-color)', marginBottom: '12px' }}>
                  {promo.status === 'RESERVED' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div><strong style={{ color: 'var(--text-secondary)' }}>Reservation:</strong> <span style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>{promo.reserved_dealer ? promo.reserved_dealer.name : 'Unknown'}</span></div>
                      <div><strong style={{ color: 'var(--text-secondary)' }}>{t('menu3.label_expire', '만료')}:</strong> <span>{promo.reservation_expiry ? new Date(promo.reservation_expiry).toLocaleDateString().replace(/\.$/, '') : ''}</span></div>
                    </div>
                  )}
                  {promo.status === 'SOLD' && (
                    <div><strong style={{ color: 'var(--text-secondary)' }}>구매:</strong> <span style={{ color: 'var(--status-stock)', fontWeight: 600 }}>{promo.final_buyer_dealer ? promo.final_buyer_dealer.name : 'Unknown'}</span></div>
                  )}
                  {promo.status === 'AVAILABLE' && <span style={{ color: 'var(--text-muted)' }}> - </span>}
                </div>

                <div>
                  {promo.status === 'AVAILABLE' && (
                    reservingId === promo.id ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'var(--bg-secondary)', padding: '12px', borderRadius: '8px' }}>
                        <select
                          value={selectedDealerId}
                          onChange={e => setSelectedDealerId(e.target.value)}
                          style={{ padding: '8px', borderRadius: '8px', background: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}
                        >
                          <option value="">{t('menu3.select_dealer', '-- 예약 딜러사 선택 --')}</option>
                          {dealers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{t('menu3.reservation_period', '예약 기간:')}</span>
                          <input 
                            type="number" 
                            min="1" max="90" 
                            value={reservedUntilDays} 
                            onChange={e => setReservedUntilDays(e.target.value)}
                            style={{ width: '60px', padding: '6px', borderRadius: '8px', background: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}
                          />
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{t('menu3.day', '일')}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                          <button onClick={() => handleConfirmReserve(promo.id)} className="btn btn-primary" style={{ padding: '6px', fontSize: '0.85rem', flex: 1 }}>{t('menu3.btn_confirm', '확정')}</button>
                          <button onClick={() => setReservingId(null)} className="btn btn-outline" style={{ padding: '6px', fontSize: '0.85rem', flex: 1 }}>{t('menu3.btn_cancel_popup', '취소')}</button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => { setReservingId(promo.id); setSelectedDealerId(''); }} className="btn btn-outline" style={{ padding: '8px', fontSize: '0.85rem', width: '100%', borderColor: 'var(--accent-cyan)', color: 'var(--accent-cyan)', fontWeight: 600 }}>
                        {t('menu3.btn_reserve', '예약 진행')}
                      </button>
                    )
                  )}

                  {promo.status === 'RESERVED' && (
                    sellingId === promo.id ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'var(--bg-secondary)', padding: '12px', borderRadius: '8px' }}>
                        <select
                          value={finalBuyerDealerId}
                          onChange={e => setFinalBuyerDealerId(e.target.value)}
                          style={{ padding: '8px', borderRadius: '8px', background: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}
                        >
                          <option value="">-- 실 구매 딜러사 선택 --</option>
                          {dealers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                        <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                          <button onClick={() => handleConfirmSold(promo.id)} className="btn btn-primary" style={{ padding: '6px', fontSize: '0.85rem', flex: 1 }}>판매 확정</button>
                          <button onClick={() => setSellingId(null)} className="btn btn-outline" style={{ padding: '6px', fontSize: '0.85rem', flex: 1 }}>취소</button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => { setSellingId(promo.id); setFinalBuyerDealerId(''); }} className="btn btn-outline" style={{ padding: '8px', fontSize: '0.85rem', flex: 1, borderColor: 'var(--status-stock)', color: 'var(--status-stock)', fontWeight: 600 }}>
                          {t('menu3.btn_order', '판매 완료')}
                        </button>
                        <button onClick={() => handleCancelReservation(promo.id)} className="btn btn-outline" style={{ padding: '8px', fontSize: '0.85rem', flex: 1, borderColor: 'var(--text-muted)', color: 'var(--text-muted)', fontWeight: 600 }}>
                          {t('menu3.btn_cancel', '예약 취소')}
                        </button>
                      </div>
                    )
                  )}

                  {promo.status === 'SOLD' && (
                    <div style={{ textAlign: 'center', padding: '8px', background: 'var(--bg-secondary)', borderRadius: '8px', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>
                      이관 완료 (판매 확정)
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="data-table-container">
            <table className="data-table promotion-table">
              <thead>
                <tr>
                  <th style={{ width: '3%' }}>{t('menu3.header_no')}</th>
                  <th style={{ width: '10%' }}>{t('menu3.header_model')}</th>
                  <th style={{ width: '5%' }}>{t('menu3.header_nc')}</th>
                  <th style={{ width: '10%' }}>{t('menu3.header_po')}</th>
                  <th style={{ width: '40%' }}>{t('menu3.header_detailspec')}</th>
                  <th style={{ width: '8%', textAlign: 'center' }}>{t('menu3.header_eta')}</th>
                  <th style={{ width: '10%', textAlign: 'center' }}>{t('menu3.header_promotion_status')}</th>
                  <th style={{ width: '10%', textAlign: 'center' }}>{t('menu3.header_reservation')}</th>
                  <th style={{ width: '5%', textAlign: 'center' }}>{t('menu3.header_settings')}</th>
                </tr>
              </thead>
              <tbody>
                {promotions.map((promo, index) => (
                  <tr key={promo.id}>
                    <td style={{ textAlign: 'center' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 500 }}>{index + 1}</span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: '12px' }}>
                        {promo.order && promo.order.product_model ? promo.order.product_model.model_name : 'Unknown'}
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
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '11px' }}>
                        {promo.order && promo.order.eta ? new Date(promo.order.eta).toLocaleDateString() : '-'}
                      </div>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {promo.status === 'AVAILABLE' && <span className="status-badge" style={{ background: 'hsla(190, 95%, 49%, 0.2)', color: 'var(--accent-cyan)', width: '85px', justifyContent: 'center', fontSize: '11px' }}>{t('menu3.status_available', '판매가능')}</span>}
                      {promo.status === 'RESERVED' && <span className="status-badge" style={{ background: 'hsla(45, 93%, 58%, 0.2)', color: 'var(--status-production)', width: '85px', justifyContent: 'center', fontSize: '11px' }}>{t('menu3.status_reserved', '예약중')}</span>}
                      {promo.status === 'SOLD' && <span className="status-badge" style={{ background: 'hsla(142, 76%, 46%, 0.2)', color: 'var(--status-stock)', width: '85px', justifyContent: 'center', fontSize: '11px' }}>{t('menu3.status_sold', '판매완료')}</span>}
                    </td>
                    <td style={{ fontSize: '11px', textAlign: 'center' }}>
                      {promo.status === 'RESERVED' && (
                        <div>
                          <span style={{ color: 'var(--accent-cyan)' }}>{promo.reserved_dealer ? promo.reserved_dealer.name : 'Unknown'}</span>
                          <div style={{ color: 'var(--text-muted)' }}>{t('menu3.label_expire', '만료')}: {promo.reservation_expiry ? new Date(promo.reservation_expiry).toLocaleDateString().replace(/\.$/, '') : ''}</div>
                        </div>
                      )}
                      {promo.status === 'SOLD' && (
                        <div style={{ color: 'var(--status-stock)', fontWeight: 600 }}>
                          구매: {promo.final_buyer_dealer ? promo.final_buyer_dealer.name : 'Unknown'}
                        </div>
                      )}
                      {promo.status === 'AVAILABLE' && <span style={{ color: 'var(--text-muted)' }}> - </span>}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {promo.status === 'AVAILABLE' && (
                        reservingId === promo.id ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'var(--bg-secondary)', padding: '10px', borderRadius: '8px', width: '180px', margin: '0 auto' }}>
                            <select
                              value={selectedDealerId}
                              onChange={e => setSelectedDealerId(e.target.value)}
                              style={{ padding: '6px', borderRadius: '6px', background: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', fontSize: '11px' }}
                            >
                              <option value="">{t('menu3.select_dealer', '-- 예약 딜러사 선택 --')}</option>
                              {dealers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                            </select>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{t('menu3.reservation_period', '예약 기간:')}</span>
                              <input 
                                type="number" 
                                min="1" max="90" 
                                value={reservedUntilDays} 
                                onChange={e => setReservedUntilDays(e.target.value)}
                                style={{ width: '50px', padding: '4px', borderRadius: '6px', background: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', fontSize: '11px' }}
                              />
                              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{t('menu3.day', '일')}</span>
                            </div>
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button onClick={() => handleConfirmReserve(promo.id)} className="btn btn-primary" style={{ padding: '3px 4px', fontSize: '10px', justifyContent: 'center', flex: 1 }}>{t('menu3.btn_confirm', '확정')}</button>
                              <button onClick={() => setReservingId(null)} className="btn btn-outline" style={{ padding: '3px 4px', fontSize: '10px', justifyContent: 'center', flex: 1 }}>{t('menu3.btn_cancel_popup', '취소')}</button>
                            </div>
                          </div>
                        ) : (
                          <button onClick={() => { setReservingId(promo.id); setSelectedDealerId(''); }} className="btn btn-outline" style={{ padding: '3px 4px', fontSize: '10px', justifyContent: 'center', borderColor: 'var(--accent-cyan)', color: 'var(--accent-cyan)', width: '70px' }}>
                            {t('menu3.btn_reserve', '예약')}
                          </button>
                        )
                      )}

                      {promo.status === 'RESERVED' && (
                        sellingId === promo.id ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'var(--bg-secondary)', padding: '10px', borderRadius: '8px', width: '180px', margin: '0 auto' }}>
                            <select
                              value={finalBuyerDealerId}
                              onChange={e => setFinalBuyerDealerId(e.target.value)}
                              style={{ padding: '6px', borderRadius: '6px', background: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', fontSize: '11px' }}
                            >
                              <option value="">-- 실 구매 딜러사 선택 --</option>
                              {dealers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                            </select>
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button onClick={() => handleConfirmSold(promo.id)} className="btn btn-primary" style={{ padding: '3px 4px', fontSize: '10px', justifyContent: 'center', flex: 1 }}>판매 확정</button>
                              <button onClick={() => setSellingId(null)} className="btn btn-outline" style={{ padding: '3px 4px', fontSize: '10px', justifyContent: 'center', flex: 1 }}>취소</button>
                            </div>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '70px', margin: '0 auto' }}>
                            <button onClick={() => { setSellingId(promo.id); setFinalBuyerDealerId(''); }} className="btn btn-outline" style={{ padding: '3px 4px', fontSize: '10px', justifyContent: 'center', borderColor: 'var(--status-stock)', color: 'var(--status-stock)' }}>
                              {t('menu3.btn_order', '판매완료')}
                            </button>
                            <button onClick={() => handleCancelReservation(promo.id)} className="btn btn-outline" style={{ padding: '3px 4px', fontSize: '10px', justifyContent: 'center', borderColor: 'var(--text-muted)', color: 'var(--text-muted)' }}>
                              {t('menu3.btn_cancel', '예약취소')}
                            </button>
                          </div>
                        )
                      )}

                      {promo.status === 'SOLD' && (
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>이관 완료</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
