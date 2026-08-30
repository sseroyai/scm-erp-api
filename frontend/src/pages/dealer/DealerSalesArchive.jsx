import React, { useState, useEffect } from 'react';
import { Search, FileSpreadsheet, Download } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function DealerSalesArchive({ isMobileView }) {
  const { t } = useTranslation();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchSoldOrders = async () => {
    setLoading(true);
    try {
      const dealersRes = await fetch('/api/dealers');
      const dealers = await dealersRes.json();
      const akMakina = dealers.find(d => d.name === 'AK MAKINA');
      const dealerId = akMakina ? akMakina.id : '';

      const res = await fetch(`/api/orders?dealer_id=${dealerId}&status_filter=SOLD`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setOrders(data);
      }
    } catch (err) {
      console.error("Failed to fetch sold orders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSoldOrders();
  }, []);

  const handleExportCSV = () => {
    if (orders.length === 0) return;

    const headers = ['Order Date', 'Model', 'S/N', 'Status'];
    const rows = orders.map(order => [
      new Date(order.current_status_changed_at).toLocaleDateString(),
      order.product_model ? order.product_model.model_name : '-',
      order.serial_number || '-',
      'SOLD'
    ]);

    let csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
      + headers.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `my_ordered_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredOrders = orders.filter(o => {
    const s = searchQuery.toLowerCase();
    const sn = o.serial_number ? o.serial_number.toLowerCase() : '';
    const mn = o.product_model ? o.product_model.model_name.toLowerCase() : '';
    return sn.includes(s) || mn.includes(s);
  });

  return (
    <div className="page-body">
      <div style={{ marginBottom: '24px', paddingTop: '4px', paddingLeft: '28px' }}>
        <h1 style={{ fontSize: '1.8rem', marginBottom: '4px' }}>{t('sidebar.dealer_menu.sales_archive', '메뉴3. 내 구매 내역')}</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          {t('dealer_sales_archive.subtitle', '과거 구매 내역 및 완료된 주문 건들을 확인합니다.')}
        </p>
      </div>

      <div className="glass-card no-hover-bg" style={{ padding: isMobileView ? '20px' : '28px', marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h2 style={{ fontSize: '1.3rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
              {t('dealer_sales_archive.list_title', '전체 구매 내역')} ({filteredOrders.length})
            </h2>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', width: isMobileView ? '100%' : 'auto' }}>
            <div style={{ position: 'relative', flex: isMobileView ? 1 : 'none' }}>
              <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="text" 
                placeholder={t('dealer_orders.search_placeholder', '검색..')} 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-primary)',
                  padding: '8px 14px 8px 36px', borderRadius: '10px', fontSize: '0.85rem', width: isMobileView ? '100%' : '240px'
                }}
              />
            </div>
            <button onClick={handleExportCSV} className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', fontSize: '0.85rem' }}>
              <Download size={16} /> Export
            </button>
          </div>
        </div>

        <div className="data-table-container full-bleed">
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>{t('navbar.init_seed_loading', '데이터를 불러오는 중입니다...')}</div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '20%' }}>{t('dealer_sales_archive.date', '구매 확정 일자')}</th>
                  <th style={{ width: '40%' }}>{t('dealer_orders.header_model', 'Model')}</th>
                  <th style={{ width: '40%' }}>{t('sidebar.admin_menu.sn', 'S/N')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.length > 0 ? (
                  filteredOrders.map(order => (
                    <tr key={order.id}>
                      <td style={{ padding: '12px' }}>{new Date(order.current_status_changed_at).toLocaleDateString()}</td>
                      <td style={{ padding: '12px' }}>
                        <div style={{ fontWeight: 600 }}>{order.product_model ? order.product_model.model_name : '-'}</div>
                      </td>
                      <td style={{ padding: '12px' }}>{order.serial_number || '-'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                      {t('dealer_sales_archive.no_data', '구매 완료된 장비가 없습니다.')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
