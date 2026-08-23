import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, MapPin, Clock, Smartphone, Monitor } from 'lucide-react';
import StepBar from '../../components/StepBar';

export default function DealerOrders({ isMobileView }) {
  const { t } = useTranslation();
  const [orders, setOrders] = useState([]);
  const [portCodes, setPortCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL');



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
      const [dealersRes, portsRes] = await Promise.all([
        fetch('/api/dealers'),
        fetch('/api/master-data/port-codes')
      ]);
      const dealers = await dealersRes.json();
      const akMakina = dealers.find(d => d.name === 'AK MAKINA');
      const dealerId = akMakina ? akMakina.id : '';

      setPortCodes(await portsRes.json());

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

  const getStandardPort = (rawPort) => {
    if (!rawPort) return '-';
    if (!portCodes || portCodes.length === 0) return rawPort;
    const lowerRaw = rawPort.toLowerCase().trim();
    const exactMatch = portCodes.find(p => p.port_code.toLowerCase() === lowerRaw);
    if (exactMatch) return exactMatch.port_code;
    const startsMatch = portCodes.find(p => p.port_code.toLowerCase().startsWith(lowerRaw));
    if (startsMatch) return startsMatch.port_code;
    return rawPort;
  };

  const filteredOrders = orders.filter(o => {
    const matchesQuery = o.reference_no.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.product_model && o.product_model.model_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (o.serial_number && o.serial_number.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = selectedStatusFilter === 'ALL' || o.current_status === selectedStatusFilter;
    return matchesQuery && matchesStatus;
  });

  return (
    <div className="page-body">

      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.8rem', marginBottom: '4px' }}>{t('dealer_orders.title')}</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          {t('dealer_orders.subtitle')}
        </p>
      </div>

      <div className="glass-card no-hover-bg" style={{ padding: isMobileView ? '20px' : '28px', marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h2 style={{ fontSize: '1.3rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
              {t('dealer_orders.pipeline_title')}
            </h2>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', width: isMobileView ? '100%' : 'auto' }}>
            <div style={{ position: 'relative', flex: isMobileView ? 1 : 'none' }}>
              <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder={t('dealer_orders.search_placeholder')}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-primary)',
                  padding: '8px 14px 8px 36px', borderRadius: '10px', fontSize: '0.85rem', width: isMobileView ? '100%' : '240px'
                }}
              />
            </div>

            <select
              value={selectedStatusFilter}
              onChange={e => setSelectedStatusFilter(e.target.value)}
              style={{
                background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-primary)',
                padding: '8px 14px', borderRadius: '10px', fontSize: '0.85rem', cursor: 'pointer', flex: isMobileView ? 1 : 'none'
              }}
            >
              <option value="ALL">{t('dashboard.status_all_filter')}</option>
              <option value="CONFIRMED">{t('dashboard.status_confirmed')}</option>
              <option value="IN_PRODUCTION">{t('dashboard.status_in_production')}</option>
              <option value="SHIPPING">{t('dashboard.status_shipping')}</option>
              <option value="ARRIVED">{t('dashboard.status_arrived')}</option>
              <option value="IN_STOCK">{t('dashboard.status_in_stock')}</option>
            </select>
          </div>
        </div>

        {isMobileView ? (
          <div className="mobile-cards-grid">
            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>{t('navbar.init_seed_loading')}</div>
            ) : filteredOrders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>{t('dealer_orders.no_orders')}</div>
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
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{t('dealer_orders.current_location')}</span>
                      <span>{order.physical_location || '-'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Clock size={15} color="var(--accent-blue)" />
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{t('dealer_orders.eta')}</span>
                      <span style={{ color: 'var(--accent-blue)', fontWeight: 600 }}>
                        {order.eta ? new Date(order.eta).toLocaleDateString() : '-'}
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
                  <th style={{ width: '15%' }}>{t('dealer_orders.header_model')}</th>
                  <th style={{ width: '15%' }}>{t('dealer_orders.header_po_sn')}</th>
                  <th style={{ width: '15%' }}>{t('dealer_orders.header_dealer')}</th>
                  <th style={{ width: '40%', textAlign: 'center' }}>{t('dealer_orders.header_status')}</th>
                  <th style={{ width: '15%' }}>{t('dealer_orders.header_port')}</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>{t('navbar.init_seed_loading')}</td></tr>
                ) : filteredOrders.length === 0 ? (
                  <tr><td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>{t('dealer_orders.no_orders')}</td></tr>
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
                          <td style={{ textAlign: 'center', borderBottom: expandedRows.has(order.id) ? 'none' : '1px solid var(--border-color)', paddingBottom: '12px', paddingTop: '12px' }}>
                            <StepBar currentStatus={order.current_status} />
                          </td>
                          <td style={{ borderBottom: expandedRows.has(order.id) ? 'none' : '1px solid var(--border-color)', paddingBottom: '12px', paddingTop: '12px' }}>
                            <div style={{ fontSize: '0.85rem', fontWeight: 500 }}>{getStandardPort(order.destination_port)}</div>
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
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', paddingLeft: '8px' }}>
                                <div style={{
                                  fontSize: '0.8rem',
                                  color: 'var(--text-secondary)',
                                  lineHeight: '1.8',
                                  textAlign: 'left',
                                  paddingLeft: '16px',
                                  borderLeft: '3px solid var(--wia-blue)',
                                }}>
                                  <div><span style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'inline-block', width: '100px' }}>S/O:</span> {order.so_no || '-'}</div>
                                  <div><span style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'inline-block', width: '100px' }}>NC:</span> {order.nc || 'F0iP'}</div>
                                  <div><span style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'inline-block', width: '100px' }}>DETAIL SPEC:</span> {order.detail_spec || 'T/F, CC(S-H)+B, 20BAR, B/I, P/C, Q(A)'}</div>
                                  <div><span style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'inline-block', width: '100px' }}>{t('menu1.order_date', 'Order date')}:</span> {order.dealer_order_date ? new Date(order.dealer_order_date).toLocaleDateString() : '-'}</div>
                                </div>

                                <div style={{
                                  fontSize: '0.8rem',
                                  color: 'var(--text-secondary)',
                                  lineHeight: '1.8',
                                  textAlign: 'left',
                                  paddingLeft: '16px',
                                  borderLeft: '3px solid var(--wia-blue)',
                                }}>
                                  <div><span style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'inline-block', width: '100px' }}>Incoterms:</span> {order.incoterms || '-'}</div>
                                  <div><span style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'inline-block', width: '100px' }}>ETD / ETA:</span> {showSchedule ? `${order.etd ? new Date(order.etd).toLocaleDateString() : '-'} / ${order.eta ? new Date(order.eta).toLocaleDateString() : '-'}` : '-'}</div>
                                  <div><span style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'inline-block', width: '100px' }}>VESSEL:</span> {order.vessel || '-'}</div>
                                  <div><span style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'inline-block', width: '100px' }}>REMARK:</span> {order.remark || '-'}</div>
                                </div>
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
