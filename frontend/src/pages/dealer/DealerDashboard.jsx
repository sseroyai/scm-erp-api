import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Ship, Calendar, Package } from 'lucide-react';

const COLORS = ['#06b6d4', '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899'];

export default function DealerDashboard({ isMobileView }) {
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

  const stockByModel = {};
  atpOrders.forEach(o => {
    const mName = o.product_model ? o.product_model.model_name : 'Unknown';
    stockByModel[mName] = (stockByModel[mName] || 0) + 1;
  });
  const pieData = Object.keys(stockByModel).map(model => ({
    name: model,
    value: stockByModel[model]
  }));

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
              <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>{t('dealer_dashboard.pie_title')}</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '20px' }}>
                {t('dealer_dashboard.pie_desc')}
              </p>
              
              <div style={{ flex: 1, minHeight: '280px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {pieData.length === 0 ? (
                  <div style={{ color: 'var(--text-muted)' }}>{t('dealer_dashboard.no_atp')}</div>
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ background: 'hsl(222, 47%, 13%)', border: '1px solid var(--border-color)', borderRadius: '10px' }}
                      />
                      <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            <div className="glass-card" style={{ padding: '28px', display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>{t('dealer_dashboard.atp_list_title')}</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '20px' }}>
                {t('dealer_dashboard.atp_list_desc')}
              </p>

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
                          className="btn btn-primary"
                          style={{ padding: '6px 14px', fontSize: '0.8rem' }}
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
                      <tr>
                        <th>{t('menu1.header_model')}</th>
                        <th>{t('menu2.detail_sn')}</th>
                        <th>{t('profile.department')} / {t('menu2.detail_port')}</th>
                        <th>{t('menu6.header_action')}</th>
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
                            <td>
                              <button
                                onClick={() => handleRequestAllocation(o)}
                                className="btn btn-primary"
                                style={{ padding: '4px 12px', fontSize: '0.75rem' }}
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
