import React, { useState, useEffect } from 'react';
import { Search, FileSpreadsheet, Download } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function AdminSalesArchive({ isMobileView }) {
  const { t } = useTranslation();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchSoldOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/orders?status_filter=SOLD');
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

    const headers = ['판매 일자', '모델명', 'S/N', '딜러사 명칭', '국가/지역'];
    const rows = orders.map(order => [
      new Date(order.current_status_changed_at).toLocaleDateString(),
      order.product_model ? order.product_model.model_name : '-',
      order.serial_number || '-',
      order.dealer_company ? order.dealer_company.name : '-',
      order.dealer_company ? `${order.dealer_company.country} / ${order.dealer_company.region}` : '-'
    ]);

    let csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
      + headers.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `sales_archive_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
          <h2>판매완료 페이지 (Sales Archive)</h2>
          <p>재무적 정산이 완료되어 최종 매출로 확정된 장비들의 영구 보관소입니다.</p>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="card full-width">
          <div className="card-header">
            <h3>매출 확정 장비 ({filteredOrders.length})</h3>
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
              <button onClick={handleExportCSV} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Download size={16} /> Excel Export
              </button>
            </div>
          </div>

          <div className="table-responsive">
            {loading ? (
              <div style={{ padding: '20px', textAlign: 'center' }}>데이터를 불러오는 중...</div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>판매 확정 일자</th>
                    <th>{t('sidebar.admin_menu.models', '모델명')}</th>
                    <th>{t('sidebar.admin_menu.sn', 'S/N')}</th>
                    <th>딜러사 명칭</th>
                    <th>국가 / 지역</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.length > 0 ? (
                    filteredOrders.map(order => (
                      <tr key={order.id}>
                        <td>{new Date(order.current_status_changed_at).toLocaleDateString()}</td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{order.product_model ? order.product_model.model_name : '-'}</div>
                        </td>
                        <td>{order.serial_number || '-'}</td>
                        <td>{order.dealer_company ? order.dealer_company.name : '-'}</td>
                        <td>{order.dealer_company ? `${order.dealer_company.country} / ${order.dealer_company.region}` : '-'}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: '30px' }}>판매 완료된 장비가 없습니다.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
