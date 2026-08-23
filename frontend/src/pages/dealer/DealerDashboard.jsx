import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Ship, Calendar, Package } from 'lucide-react';

export default function DealerDashboard({ isMobileView, setActiveTab }) {
  const { t } = useTranslation();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const dealersRes = await fetch('/api/dealers');
      const dealers = await dealersRes.json();
      const akMakina = dealers.find(d => d.name === 'AK MAKINA');
      const dealerId = akMakina ? akMakina.id : '';

      const res = await fetch(`/api/orders?dealer_id=${dealerId}`);
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

  const activeCount = orders.filter(o => !['SOLD', 'DISPATCHED'].includes(o.current_status)).length;
  const shippingCount = orders.filter(o => o.current_status === 'SHIPPING').length;
  const readyCount = orders.filter(o => o.current_status === 'IN_STOCK').length;

  const [atpOrders, setAtpOrders] = useState([]);
  
  const fetchATP = async () => {
    try {
      const res = await fetch('/api/orders?status_filter=IN_STOCK');
      const data = await res.json();
      if (Array.isArray(data)) {
        setAtpOrders(data.filter(o => (o.stock_type || 'AVAILABLE') === 'AVAILABLE'));
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchATP();
  }, []);

  const [corpStock, setCorpStock] = useState([]);
  
  const fetchCorpStock = async () => {
    try {
      const res = await fetch('/api/orders?is_corporate_stock=true');
      const data = await res.json();
      if (Array.isArray(data)) {
        setCorpStock(data);
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchCorpStock();
  }, []);

  const availableCount = corpStock.filter(o => (o.stock_type || 'AVAILABLE') === 'AVAILABLE').length;
  const rentalCount = corpStock.filter(o => (o.stock_type || 'AVAILABLE') === 'RENTAL').length;
  const showroomCount = corpStock.filter(o => (o.stock_type || 'AVAILABLE') === 'SHOWROOM').length;
  const promotionCount = corpStock.filter(o => (o.stock_type || 'AVAILABLE') === 'PROMOTION').length;

  const handleRequestAllocation = (order) => {
    const modelName = order.product_model ? order.product_model.model_name : order.reference_no;
    const serialNumber = order.serial_number;
    const email = "freelogin3975@gmail.com,jypark@hyundai-wia.de";
    const subject = "딜러 장비 출고 신청";
    const body = `모델명: ${modelName}\n시리얼 번호: ${serialNumber}\n\n위 장비에 대한 즉시 할당을 신청합니다.`;
    
    window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    alert(`[${modelName}] 기계의 할당 요청 이메일 작성을 시작합니다.`);
  };

  return (
    <div className="page-body">
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.8rem', marginBottom: '4px' }}>{t('dealer_dashboard.title')}</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          {t('dealer_dashboard.subtitle', { dealerName: 'AK MAKINA' })}
        </p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>{t('navbar.init_seed_loading')}</div>
      ) : (
        <>
          <div className="kpi-grid">
            <div className="glass-card kpi-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="kpi-title">{t('dealer_dashboard.active_orders')}</span>
                <Package color="var(--accent-cyan)" size={24} />
              </div>
              <div className="kpi-value">{activeCount} <span style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--text-muted)' }}>{t('dealer_dashboard.unit')}</span></div>
              <div className="kpi-desc">{t('dealer_dashboard.active_desc')}</div>
            </div>

            <div className="glass-card kpi-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="kpi-title">{t('dealer_dashboard.shipping_orders')}</span>
                <Ship color="var(--accent-blue)" size={24} />
              </div>
              <div className="kpi-value">{shippingCount} <span style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--text-muted)' }}>{t('dealer_dashboard.unit')}</span></div>
              <div className="kpi-desc">{t('dealer_dashboard.shipping_desc')}</div>
            </div>

            <div className="glass-card kpi-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="kpi-title">{t('dealer_dashboard.ready_orders')}</span>
                <Package color="var(--status-stock)" size={24} />
              </div>
              <div className="kpi-value" style={{ color: 'var(--status-stock)' }}>{readyCount} <span style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--text-muted)' }}>{t('dealer_dashboard.unit')}</span></div>
              <div className="kpi-desc">{t('dealer_dashboard.ready_desc')}</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: isMobileView ? '1fr' : 'repeat(auto-fit, minmax(450px, 1fr))', gap: '24px' }}>
            <div className="glass-card" style={{ padding: '28px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ minHeight: '100px' }}>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Package size={20} color="var(--status-stock)" />
                  {t('menu2.inventory_list_title', 'WIA available Stock List')}
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '20px' }}>
                  {t('menu2.page_desc', 'WIA 유럽법인의 가용 재고(ATP) 현황을 파악 할 수 있습니다.')}
                </p>
              </div>
              
              {/* Summary Banner */}
              <div style={{
                marginBottom: '16px', padding: '0 16px', minHeight: '50px', backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-color)', borderRadius: '12px',
                display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)', fontSize: '0.85rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>All:</span>
                  <span style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>{corpStock.length}</span>
                </div>
                <div style={{ height: '16px', width: '1px', backgroundColor: 'var(--border-color)' }}></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Available:</span>
                  <span style={{ fontWeight: 'bold', color: 'var(--status-stock)' }}>{availableCount}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Rental:</span>
                  <span style={{ fontWeight: 'bold', color: 'var(--status-production)' }}>{rentalCount}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Showroom:</span>
                  <span style={{ fontWeight: 'bold', color: '#4da6ff' }}>{showroomCount}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Promotion:</span>
                  <span style={{ fontWeight: 'bold', color: 'var(--accent-pink)' }}>{promotionCount}</span>
                </div>
              </div>

              {/* Navigation Button */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
                <button
                  className="btn btn-outline"
                  onClick={() => setActiveTab && setActiveTab('dealer-inventory')}
                  style={{ padding: '8px 24px', fontWeight: 600, fontSize: '0.9rem', color: 'var(--accent-cyan)', borderColor: 'var(--accent-cyan)', borderRadius: '20px' }}
                >
                  GO stock list
                </button>
              </div>
            </div>

            <div className="glass-card" style={{ padding: '28px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ minHeight: '100px' }}>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>{t('dealer_dashboard.atp_list_title')}</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '20px' }}>
                  {t('dealer_dashboard.atp_list_desc')}
                </p>
              </div>

              {isMobileView ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
                  {atpOrders.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>{t('dealer_dashboard.no_atp')}</div>
                  ) : (
                    atpOrders.map(o => (
                      <div key={o.id} style={{ background: 'var(--bg-secondary)', padding: '14px', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                            {o.product_model ? o.product_model.model_name : 'Unknown'}
                          </div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)' }}>S/N: {o.serial_number}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>구역: {o.physical_location || '물류창고'}</div>
                        </div>
                        <button
                          onClick={() => handleRequestAllocation(o)}
                          className="btn btn-primary btn-request"
                          style={{ padding: '6px 14px', fontSize: '0.8rem', borderRadius: '20px' }}
                        >
                          {t('dealer_dashboard.btn_allocation')}
                        </button>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                <div className="data-table-container" style={{ flex: 1 }}>
                  <table className="data-table">
                    <thead>
                      <tr style={{ height: '50px' }}>
                        <th>{t('dealer_dashboard.header_model')}</th>
                        <th>{t('dealer_dashboard.header_sn')}</th>
                        <th>{t('dealer_dashboard.header_location')}</th>
                        <th style={{ textAlign: 'center' }}>{t('dealer_dashboard.header_request')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {atpOrders.length === 0 ? (
                        <tr><td colSpan={4} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>{t('dealer_dashboard.no_atp')}</td></tr>
                      ) : (
                        atpOrders.map(o => (
                          <tr key={o.id}>
                            <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                              {o.product_model ? o.product_model.model_name : 'Unknown'}
                            </td>
                            <td style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)' }}>{o.serial_number}</td>
                            <td style={{ fontSize: '0.8rem' }}>{o.physical_location || '물류창고'}</td>
                            <td style={{ textAlign: 'center' }}>
                              <button
                                onClick={() => handleRequestAllocation(o)}
                                className="btn btn-primary btn-request"
                                style={{ padding: '4px 12px', fontSize: '0.75rem', borderRadius: '20px' }}
                              >
                                {t('dealer_dashboard.btn_allocation')}
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
