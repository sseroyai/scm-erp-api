import React, { useState, useEffect } from 'react';
import { Search, Download, Edit, Archive, ChevronDown, ChevronUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function AdminSalesArchive({ isMobileView }) {
  const { t } = useTranslation();
  const [orders, setOrders] = useState([]);
  
  // Master data for edit modal
  const [models, setModels] = useState([]);
  const [dealers, setDealers] = useState([]);
  const [ncCodes, setNcCodes] = useState([]);
  const [incotermCodes, setIncotermCodes] = useState([]);
  const [portCodes, setPortCodes] = useState([]);

  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [editingOrder, setEditingOrder] = useState(null);
  const [editForm, setEditForm] = useState({
    product_model_id: '',
    reference_no: '',
    nc: '',
    dealer_company_id: '',
    serial_number: '',
    so_no: '',
    price: '',
    destination_port: '',
    detail_spec: '',
    incoterms: '',
    vessel: '',
    remark: ''
  });

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

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ordersRes, modelsRes, dealersRes, ncRes, incotermRes, portRes] = await Promise.all([
        fetch('/api/orders?status_filter=SOLD'),
        fetch('/api/models'),
        fetch('/api/dealers'),
        fetch('/api/master-data/nc-codes'),
        fetch('/api/master-data/incoterm-codes'),
        fetch('/api/master-data/port-codes')
      ]);
      const data = await ordersRes.json();
      const modelsData = await modelsRes.json();
      if (Array.isArray(data)) setOrders(data);
      if (Array.isArray(modelsData)) setModels(modelsData);
      setDealers(await dealersRes.json());
      setNcCodes(await ncRes.json());
      setIncotermCodes(await incotermRes.json());
      setPortCodes(await portRes.json());
    } catch (err) {
      console.error("Failed to fetch data:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSoldOrdersOnly = async () => {
    try {
      const res = await fetch('/api/orders?status_filter=SOLD');
      const data = await res.json();
      if (Array.isArray(data)) {
        setOrders(data);
      }
    } catch (err) {
      console.error("Failed to fetch sold orders:", err);
    }
  };

  useEffect(() => {
    fetchData();
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
    const nc = o.nc ? o.nc.toLowerCase() : '';
    return sn.includes(s) || mn.includes(s) || dn.includes(s) || po.includes(s) || nc.includes(s);
  });

  const openEditModal = (order) => {
    setEditingOrder(order);
    setEditForm({
      product_model_id: order.product_model_id || '',
      reference_no: order.reference_no || '',
      nc: order.nc || '',
      dealer_company_id: order.dealer_company_id || '',
      serial_number: order.serial_number || '',
      so_no: order.so_no || '',
      price: order.price || '',
      destination_port: order.destination_port || '',
      detail_spec: order.detail_spec || '',
      incoterms: order.incoterms || '',
      vessel: order.vessel || '',
      remark: order.remark || ''
    });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/orders/${editingOrder.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_model_id: editForm.product_model_id ? parseInt(editForm.product_model_id, 10) : null,
          reference_no: editForm.reference_no,
          nc: editForm.nc,
          dealer_company_id: editForm.dealer_company_id ? parseInt(editForm.dealer_company_id, 10) : null,
          serial_number: editForm.serial_number,
          so_no: editForm.so_no,
          price: editForm.price,
          destination_port: editForm.destination_port,
          detail_spec: editForm.detail_spec,
          incoterms: editForm.incoterms,
          vessel: editForm.vessel,
          remark: editForm.remark
        })
      });
      if (res.ok) {
        alert(t('menu1.update_success', '저장되었습니다.'));
        setEditingOrder(null);
        fetchSoldOrdersOnly();
      } else {
        alert(t('menu1.update_fail', '저장 실패'));
      }
    } catch (err) {
      console.error(err);
      alert(t('menu1.update_error', '오류 발생'));
    }
  };

  return (
    <div className="page-body">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', marginBottom: '4px' }}>판매 목록</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            딜러사로부터의 매출 확정 정보를 통합 관리합니다.
          </p>
        </div>
      </div>

      <div className="glass-card no-hover-bg" style={{ padding: '28px', marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h2 style={{ fontSize: '1.3rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Archive size={20} color="var(--accent-blue)" />
              <span>매출 확정 장비</span>
            </h2>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative' }}>
              <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="S/N, 모델, P/O, 딜러명 검색..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-primary)',
                  padding: '8px 14px 8px 36px', borderRadius: '10px', fontSize: '0.85rem', width: '250px'
                }}
              />
            </div>
            <button onClick={handleExportCSV} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '10px', fontSize: '0.85rem' }}>
              <Download size={16} /> Excel Export
            </button>
          </div>
        </div>

        {/* 리스트 수량 통계 Header */}
        <div style={{
          marginBottom: '20px', padding: '16px 24px', backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-color)', borderRadius: '12px',
          display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>전체:</span>
            <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>{filteredOrders.length}대</span>
          </div>
        </div>

        {isMobileView ? (
          <div className="mobile-cards-grid">
            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>데이터를 불러오는 중입니다...</div>
            ) : filteredOrders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>조건에 맞는 판매 장비가 없습니다.</div>
            ) : (
              filteredOrders.map((order) => (
                <div key={order.id} className="mobile-order-card" onClick={() => toggleRow(order.id)} style={{ cursor: 'pointer' }}>
                  <div className="mobile-order-header">
                    <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                      {order.product_model ? order.product_model.model_name : '-'}
                    </div>
                    <div style={{ fontWeight: 700, color: 'var(--accent-cyan)', fontSize: '0.9rem' }}>
                      {order.reference_no || '-'}
                    </div>
                  </div>
                  <div className="mobile-order-meta">
                    <span>딜러명: <strong style={{ color: 'var(--text-primary)' }}>{order.dealer_company ? order.dealer_company.name : '-'}</strong></span>
                    <span>S/N: <strong style={{ color: 'var(--text-primary)' }}>{order.serial_number || '-'}</strong></span>
                    <span>NC: <strong style={{ color: 'var(--text-primary)' }}>{order.nc || '-'}</strong></span>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }} onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => openEditModal(order)}
                      className="btn btn-outline"
                      style={{ flex: 1, padding: '8px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                    >
                      <Edit size={14} /> 정보 수정
                    </button>
                  </div>

                  {expandedRows.has(order.id) && (
                    <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px dashed var(--border-color)', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      <div style={{ display: 'flex' }}><strong style={{ color: 'var(--text-primary)', width: '90px' }}>주문일자:</strong> <span>{order.dealer_order_date ? new Date(order.dealer_order_date).toLocaleDateString() : (order.created_at ? new Date(order.created_at).toLocaleDateString() : '-')}</span></div>
                      <div style={{ display: 'flex' }}><strong style={{ color: 'var(--text-primary)', width: '90px' }}>판매 가격:</strong> <span>{order.price || '-'}</span></div>
                      <div style={{ display: 'flex' }}><strong style={{ color: 'var(--text-primary)', width: '90px' }}>구매 가격:</strong> <span>-</span></div>
                      <div style={{ display: 'flex' }}><strong style={{ color: 'var(--text-primary)', width: '90px' }}>ETA:</strong> <span>{order.eta ? new Date(order.eta).toLocaleDateString() : '-'}</span></div>
                      <div style={{ display: 'flex' }}><strong style={{ color: 'var(--text-primary)', width: '90px' }}>출고 예정:</strong> <span>-</span></div>
                      <div style={{ display: 'flex' }}><strong style={{ color: 'var(--text-primary)', width: '90px' }}>매출 일정:</strong> <span>-</span></div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '5%', textAlign: 'center', fontWeight: 'bold' }}>No.</th>
                  <th style={{ width: '15%', textAlign: 'center', fontWeight: 'bold' }}>구매 딜러</th>
                  <th style={{ width: '15%', textAlign: 'center', fontWeight: 'bold' }}>모델</th>
                  <th style={{ width: '10%', textAlign: 'center', fontWeight: 'bold' }}>NC</th>
                  <th style={{ width: '15%', textAlign: 'center', fontWeight: 'bold' }}>P/O</th>
                  <th style={{ width: '15%', textAlign: 'center', fontWeight: 'bold' }}>S/N</th>
                  <th style={{ width: '10%', textAlign: 'center', fontWeight: 'bold' }}>판매 가격</th>
                  <th style={{ width: '15%', textAlign: 'center', fontWeight: 'bold' }}>관리</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>데이터를 불러오는 중입니다...</td></tr>
                ) : filteredOrders.length === 0 ? (
                  <tr><td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>조건에 맞는 판매 장비가 없습니다.</td></tr>
                ) : (
                  filteredOrders.map((order, index) => (
                    <React.Fragment key={order.id}>
                      <tr
                        onClick={() => toggleRow(order.id)}
                        style={{ cursor: 'pointer', transition: 'background-color 0.2s' }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <td style={{ borderBottom: expandedRows.has(order.id) ? 'none' : '1px solid var(--border-color)', paddingBottom: '5px', paddingTop: '5px', textAlign: 'center' }}>
                          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 500 }}>{index + 1}</span>
                        </td>
                        <td style={{ borderBottom: expandedRows.has(order.id) ? 'none' : '1px solid var(--border-color)', paddingBottom: '5px', paddingTop: '5px', textAlign: 'center' }}>
                          <div style={{ fontWeight: 600, fontSize: '12px' }}>{order.dealer_company ? order.dealer_company.name : '-'}</div>
                        </td>
                        <td style={{ borderBottom: expandedRows.has(order.id) ? 'none' : '1px solid var(--border-color)', paddingBottom: '5px', paddingTop: '5px', textAlign: 'center' }}>
                          <div style={{ fontWeight: 600, fontSize: '12px' }}>{order.product_model ? order.product_model.model_name : '-'}</div>
                        </td>
                        <td style={{ borderBottom: expandedRows.has(order.id) ? 'none' : '1px solid var(--border-color)', paddingBottom: '5px', paddingTop: '5px', textAlign: 'center' }}>
                          <div style={{ fontSize: '12px' }}>{order.nc || '-'}</div>
                        </td>
                        <td style={{ borderBottom: expandedRows.has(order.id) ? 'none' : '1px solid var(--border-color)', paddingBottom: '5px', paddingTop: '5px', textAlign: 'center' }}>
                          <div style={{ fontWeight: 700, color: 'var(--accent-cyan)', fontSize: '11px' }}>{order.reference_no || '-'}</div>
                        </td>
                        <td style={{ borderBottom: expandedRows.has(order.id) ? 'none' : '1px solid var(--border-color)', paddingBottom: '5px', paddingTop: '5px', textAlign: 'center' }}>
                          <div style={{ fontSize: '12px' }}>{order.serial_number || '-'}</div>
                        </td>
                        <td style={{ borderBottom: expandedRows.has(order.id) ? 'none' : '1px solid var(--border-color)', paddingBottom: '5px', paddingTop: '5px', textAlign: 'center' }}>
                          <div style={{ fontSize: '12px' }}>{order.price || '-'}</div>
                        </td>
                        <td onClick={e => e.stopPropagation()} style={{ borderBottom: expandedRows.has(order.id) ? 'none' : '1px solid var(--border-color)', paddingBottom: '5px', paddingTop: '5px', textAlign: 'center' }}>
                          <button 
                            onClick={() => openEditModal(order)}
                            className="btn btn-outline" 
                            style={{ padding: '4px 8px', fontSize: '11px', display: 'inline-flex', alignItems: 'center' }}
                          >
                            <Edit size={14} style={{ marginRight: '4px' }}/> 수정
                          </button>
                        </td>
                      </tr>
                      {expandedRows.has(order.id) && (
                        <tr>
                          <td colSpan={8} style={{ backgroundColor: 'var(--bg-card)', paddingTop: '12px', borderTop: '1px dashed var(--border-color)', paddingBottom: '16px', borderBottom: '1px solid var(--border-color)' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', paddingLeft: '8px' }}>
                              <div style={{
                                fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.8', textAlign: 'left',
                                paddingLeft: '16px', borderLeft: '3px solid var(--wia-blue)',
                              }}>
                                <div><span style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'inline-block', width: '100px' }}>주문일자:</span> {order.dealer_order_date ? new Date(order.dealer_order_date).toLocaleDateString() : (order.created_at ? new Date(order.created_at).toLocaleDateString() : '-')}</div>
                                <div><span style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'inline-block', width: '100px' }}>ETA:</span> {order.eta ? new Date(order.eta).toLocaleDateString() : '-'}</div>
                                <div><span style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'inline-block', width: '100px' }}>구매 가격:</span> -</div>
                              </div>
                              <div style={{
                                fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.8', textAlign: 'left',
                                paddingLeft: '16px', borderLeft: '3px solid var(--wia-blue)',
                              }}>
                                <div><span style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'inline-block', width: '100px' }}>출고 예정:</span> -</div>
                                <div><span style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'inline-block', width: '100px' }}>매출 일정:</span> -</div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {editingOrder && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: '20px'
        }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', padding: '24px', position: 'relative' }}>
            <h2 style={{ fontSize: '1.2rem', marginBottom: '16px', color: 'var(--text-primary)' }}>
              {t('menu1.edit_modal.title', '장비 정보 수정')} ({editingOrder.reference_no})
            </h2>
            <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                {/* Row 1 */}
                <div style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{t('menu1.edit_modal.model', '모델명')}</label>
                    <select
                      value={editForm.product_model_id}
                      onChange={e => setEditForm({ ...editForm, product_model_id: e.target.value })}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)' }}
                    >
                      <option value="">-- 모델 선택 --</option>
                      {models.map(m => (
                        <option key={m.id} value={m.id}>{m.model_code || m.model_name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>P/O</label>
                    <input type="text" value={editForm.reference_no} onChange={e => setEditForm({ ...editForm, reference_no: e.target.value })} placeholder="P/O 번호" style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)' }} />
                  </div>
                </div>

                {/* Row 2 */}
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>NC</label>
                  <select
                    value={editForm.nc}
                    onChange={e => setEditForm({ ...editForm, nc: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)' }}
                  >
                    <option value="">-- NC 선택 --</option>
                    {ncCodes.map(nc => (
                      <option key={nc.nc_code} value={nc.nc_code}>{nc.nc_code}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Dealer</label>
                  <select
                    value={editForm.dealer_company_id}
                    onChange={e => setEditForm({ ...editForm, dealer_company_id: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)' }}
                  >
                    <option value="">-- 딜러 선택 --</option>
                    {dealers.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>

                {/* Row 3 */}
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>S/N</label>
                  <input type="text" value={editForm.serial_number} onChange={e => setEditForm({ ...editForm, serial_number: e.target.value })} placeholder={t('menu1.edit_modal.sn_placeholder', 'S/N 입력')} style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>S/O</label>
                  <input type="text" value={editForm.so_no} onChange={e => setEditForm({ ...editForm, so_no: e.target.value })} placeholder={t('menu1.edit_modal.so_placeholder', 'S/O 번호')} style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)' }} />
                </div>

                {/* Row 4 */}
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Buying</label>
                  <input type="text" value={editForm.price} onChange={e => setEditForm({ ...editForm, price: e.target.value })} placeholder="구매가" style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Port</label>
                  <select
                    value={editForm.destination_port}
                    onChange={e => setEditForm({ ...editForm, destination_port: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)' }}
                  >
                    <option value="">-- 항구 선택 --</option>
                    {portCodes.map(port => (
                      <option key={port.port_code} value={port.port_code}>{port.port_code}</option>
                    ))}
                  </select>
                </div>

                {/* Row 5 */}
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>DETAIL SPEC</label>
                  <input type="text" value={editForm.detail_spec} onChange={e => setEditForm({ ...editForm, detail_spec: e.target.value })} placeholder={t('menu1.edit_modal.detail_placeholder', '상세 스펙')} style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)' }} />
                </div>

                {/* Row 6 */}
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Incoterms</label>
                  <select
                    value={editForm.incoterms}
                    onChange={e => setEditForm({ ...editForm, incoterms: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)' }}
                  >
                    <option value="">-- Incoterms 선택 --</option>
                    {incotermCodes.map(term => (
                      <option key={term.incoterm_code} value={term.incoterm_code}>{term.incoterm_code}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>VESSEL</label>
                  <input type="text" value={editForm.vessel} onChange={e => setEditForm({ ...editForm, vessel: e.target.value })} placeholder={t('menu1.edit_modal.vessel_placeholder', '선박명')} style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)' }} />
                </div>

                {/* Row 7 */}
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>REMARK</label>
                  <textarea value={editForm.remark} onChange={e => setEditForm({ ...editForm, remark: e.target.value })} placeholder={t('menu1.edit_modal.remark_placeholder', '비고 작성')} style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)', resize: 'vertical', minHeight: '80px' }} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setEditingOrder(null)} className="btn btn-outline" style={{ padding: '6px 12px', fontSize: '0.85rem' }}>{t('menu1.edit_modal.cancel', '취소')}</button>
                <button type="submit" className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '0.85rem' }}>{t('menu1.edit_modal.save', '저장')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
