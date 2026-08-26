import React, { useState, useEffect } from 'react';
import { Search, Download, Edit } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function AdminSalesArchive({ isMobileView }) {
  const { t } = useTranslation();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [editingOrder, setEditingOrder] = useState(null);
  const [editForm, setEditForm] = useState({
    sales_price: '',
    purchase_price: '',
    expected_dispatch: '',
    sales_schedule: ''
  });

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

    const headers = [
      '주문일자', '구매 딜러', '모델', 'NC', 'P/O', 'S/N', 
      '판매 가격', '구매 가격', 'ETA', '출고 예정', '매출 일정'
    ];
    const rows = orders.map(order => [
      order.dealer_order_date ? new Date(order.dealer_order_date).toLocaleDateString() : (order.created_at ? new Date(order.created_at).toLocaleDateString() : '-'),
      order.dealer_company ? order.dealer_company.name : '-',
      order.product_model ? order.product_model.model_name : '-',
      order.nc || '-',
      order.reference_no || '-',
      order.serial_number || '-',
      order.price || '-',
      '-', // 구매 가격
      order.eta ? new Date(order.eta).toLocaleDateString() : '-',
      '-', // 출고 예정
      '-'  // 매출 일정
    ]);

    let csvContent = "data:text/csv;charset=utf-8,\uFEFF"
      + headers.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `sales_list_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredOrders = orders.filter(o => {
    const s = searchQuery.toLowerCase();
    const sn = o.serial_number ? o.serial_number.toLowerCase() : '';
    const mn = o.product_model ? o.product_model.model_name.toLowerCase() : '';
    const dn = o.dealer_company ? o.dealer_company.name.toLowerCase() : '';
    const po = o.reference_no ? o.reference_no.toLowerCase() : '';
    return sn.includes(s) || mn.includes(s) || dn.includes(s) || po.includes(s);
  });

  const openEditModal = (order) => {
    setEditingOrder(order);
    setEditForm({
      sales_price: order.price || '',
      purchase_price: '', // Placeholder
      expected_dispatch: '', // Placeholder
      sales_schedule: '' // Placeholder
    });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/orders/${editingOrder.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          price: editForm.sales_price
          // Backend doesn't support other fields yet. Only price will be saved.
        })
      });
      if (res.ok) {
        alert("저장되었습니다. (구매 가격, 출고 예정, 매출 일정은 백엔드 확장이 필요합니다)");
        setEditingOrder(null);
        fetchSoldOrders();
      } else {
        alert("저장 실패");
      }
    } catch (err) {
      console.error(err);
      alert("오류 발생");
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h2>판매 목록</h2>
          <p>딜러사로 부터의 매출 확정 정보를 관리합니다.</p>
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
                  placeholder="S/N, 모델, P/O, 딜러명 검색..."
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
                    <th>주문일자</th>
                    <th>구매 딜러</th>
                    <th>모델</th>
                    <th>NC</th>
                    <th>P/O</th>
                    <th>S/N</th>
                    <th>판매 가격</th>
                    <th>구매 가격</th>
                    <th>ETA</th>
                    <th>출고 예정</th>
                    <th>매출 일정</th>
                    <th style={{ textAlign: 'center' }}>관리</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.length > 0 ? (
                    filteredOrders.map(order => (
                      <tr key={order.id}>
                        <td>{order.dealer_order_date ? new Date(order.dealer_order_date).toLocaleDateString() : (order.created_at ? new Date(order.created_at).toLocaleDateString() : '-')}</td>
                        <td>{order.dealer_company ? order.dealer_company.name : '-'}</td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{order.product_model ? order.product_model.model_name : '-'}</div>
                        </td>
                        <td>{order.nc || '-'}</td>
                        <td>{order.reference_no || '-'}</td>
                        <td>{order.serial_number || '-'}</td>
                        <td>{order.price || '-'}</td>
                        <td>-</td>
                        <td>{order.eta ? new Date(order.eta).toLocaleDateString() : '-'}</td>
                        <td>-</td>
                        <td>-</td>
                        <td style={{ textAlign: 'center' }}>
                          <button 
                            onClick={() => openEditModal(order)}
                            className="btn btn-outline" 
                            style={{ padding: '4px 8px', fontSize: '11px', display: 'inline-flex', alignItems: 'center' }}
                          >
                            <Edit size={14} style={{ marginRight: '4px' }}/> 수정
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="12" style={{ textAlign: 'center', padding: '30px' }}>판매 완료된 장비가 없습니다.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
      
      {editingOrder && (
        <div className="modal-overlay" onClick={() => setEditingOrder(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3 style={{ margin: 0 }}>판매 정보 수정</h3>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '20px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '0.9rem' }}>판매 가격</label>
                  <input type="text" className="form-input" value={editForm.sales_price} onChange={e => setEditForm({...editForm, sales_price: e.target.value})} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '0.9rem' }}>구매 가격</label>
                  <input type="text" className="form-input" value={editForm.purchase_price} onChange={e => setEditForm({...editForm, purchase_price: e.target.value})} placeholder="준비 중 (백엔드 미지원)" />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '0.9rem' }}>출고 예정</label>
                  <input type="date" className="form-input" value={editForm.expected_dispatch} onChange={e => setEditForm({...editForm, expected_dispatch: e.target.value})} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '0.9rem' }}>매출 일정</label>
                  <input type="date" className="form-input" value={editForm.sales_schedule} onChange={e => setEditForm({...editForm, sales_schedule: e.target.value})} />
                </div>
              </div>
              <div className="modal-footer" style={{ borderTop: '1px solid var(--border-color)', padding: '16px 20px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button type="button" onClick={() => setEditingOrder(null)} className="btn btn-outline">취소</button>
                <button type="submit" className="btn btn-primary">저장</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
