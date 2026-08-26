import React, { useState, useEffect } from 'react';
import { ChevronsRight, Search, CheckCircle2, Smartphone, Monitor, MapPin, Clock } from 'lucide-react';
import StepBar from '../../components/StepBar';
import { useTranslation } from 'react-i18next';

export default function AdminDashboard({ isMobileView, currentRole }) {
  const { t } = useTranslation();
  const [orders, setOrders] = useState([]);
  const [models, setModels] = useState([]);
  const [dealers, setDealers] = useState([]);
  const [ncCodes, setNcCodes] = useState([]);
  const [incotermCodes, setIncotermCodes] = useState([]);
  const [portCodes, setPortCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL');

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

  const fetchOrders = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const [ordersRes, modelsRes, dealersRes, ncRes, incotermRes, portRes] = await Promise.all([
        fetch('/api/orders?exclude_completed=true'),
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
      console.error("Failed to fetch orders:", err);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const getStandardPort = (rawPort) => {
    if (!rawPort) return '-';
    if (!portCodes || portCodes.length === 0) return rawPort;
    const lowerRaw = rawPort.toLowerCase().trim();
    
    // 1. Exact match
    const exactMatch = portCodes.find(p => p.port_code.toLowerCase() === lowerRaw);
    if (exactMatch) return exactMatch.port_code;
    
    // 2. Starts with match (e.g. "ham" -> "Hamburg")
    const startsMatch = portCodes.find(p => p.port_code.toLowerCase().startsWith(lowerRaw));
    if (startsMatch) return startsMatch.port_code;

    return rawPort;
  };

  const handleEditClick = (order) => {
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

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!editingOrder) return;
    try {
      const res = await fetch(`/api/orders/${editingOrder.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_model_id: parseInt(editForm.product_model_id) || null,
          reference_no: editForm.reference_no,
          nc: editForm.nc,
          dealer_company_id: parseInt(editForm.dealer_company_id) || null,
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
        alert("장비 정보가 성공적으로 업데이트되었습니다.");
        setEditingOrder(null);
        fetchOrders(false);
      } else {
        const errorData = await res.json();
        alert(`업데이트 실패: ${errorData.detail || "알 수 없는 오류"}`);
      }
    } catch (err) {
      alert("업데이트 중 오류가 발생했습니다.");
    }
  };

  const handleNextStatus = async (orderId, currentStatus) => {
    const statusFlow = [
      'CONFIRMED', 'IN_PRODUCTION', 'SHIPPING', 'ARRIVED', 'IN_STOCK'
    ];
    const nextIdx = statusFlow.indexOf(currentStatus) + 1;
    if (nextIdx >= statusFlow.length) return;

    const nextStatus = statusFlow[nextIdx];
    const locations = {
      'CONFIRMED': '한국 공장 (발주 접수)',
      'IN_PRODUCTION': '한국 공장 (조립 및 가공 중)',
      'SHIPPING': '해상 운송 중 (유럽행 컨테이너선)',
      'ARRIVED': '네덜란드 로테르담 항구 통관 진행',
      'IN_STOCK': '독일 함부르크 유럽 물류센터 입고 완료'
    };

    try {
      await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to_status: nextStatus,
          direction: 'FORWARD',
          changed_by_id: 1,
          reason: 'Admin Status Update'
        })
      });
      fetchOrders(false);
    } catch (e) {
      alert("상태 변경 실패");
    }
  };

  const handleCompleteStatus = async (orderId, targetStatus) => {
    try {
      await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to_status: targetStatus,
          direction: 'FORWARD',
          changed_by_id: 1,
          reason: 'Status Completed by Admin'
        })
      });
      fetchOrders(false);
    } catch (e) {
      alert("상태 변경 실패");
    }
  };

  const handleRollbackStatus = async (orderId, currentStatus) => {
    const statusFlow = [
      'CONFIRMED', 'IN_PRODUCTION', 'SHIPPING', 'ARRIVED', 'IN_STOCK'
    ];
    const nextIdx = statusFlow.indexOf(currentStatus) - 1;
    if (nextIdx < 0) return;

    const prevStatus = statusFlow[nextIdx];

    const reason = prompt("이전 단계로 롤백하는 사유를 입력하세요:");
    if (!reason) return;

    try {
      await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to_status: prevStatus,
          direction: 'BACKWARD',
          changed_by_id: 1,
          reason: reason
        })
      });
      fetchOrders(false);
    } catch (e) {
      alert("상태 변경 실패");
    }
  };

  const handleDeleteOrder = async (orderId) => {
    const adminId = prompt("삭제 권한이 있는 관리자 아이디를 입력하세요 (예: scm_admin_kr):");
    if (adminId !== 'scm_admin_kr') {
      alert("입력하신 아이디는 삭제 권한이 없습니다.");
      return;
    }

    if (!window.confirm("정말로 이 주문을 삭제하시겠습니까?")) return;
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        alert("주문이 삭제되었습니다.");
        fetchOrders(false);
      } else {
        alert("삭제 실패");
      }
    } catch (e) {
      alert("오류가 발생했습니다.");
    }
  };

  const filteredOrders = orders.filter(o => {
    const matchesQuery = o.reference_no.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.product_model && o.product_model.model_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (o.serial_number && o.serial_number.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (o.dealer_company && o.dealer_company.name.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = selectedStatusFilter === 'ALL' || o.current_status === selectedStatusFilter;
    return matchesQuery && matchesStatus;
  });
  return (
    <div className="page-body">
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.8rem', marginBottom: '4px' }}>{t('dashboard.title')}</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          {t('dashboard.subtitle')}
        </p>
      </div>

      <div className="glass-card no-hover-bg" style={{ padding: '28px', marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ flex: '1 1 0%', minWidth: '280px' }}>
            <h2 style={{ fontSize: '1.3rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span>{t('dashboard.timeline_title')}</span>
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px', whiteSpace: 'pre-line' }}>
              {t('dashboard.timeline_desc')}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', width: isMobileView ? '100%' : 'auto' }}>
            <div style={{ position: 'relative', flex: isMobileView ? 1 : 'none' }}>
              <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder={t('dashboard.search_placeholder')}
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

        {/* 리스트 수량 통계 Header */}
        <div style={{
          marginBottom: '20px', padding: '16px 24px', backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-color)', borderRadius: '12px',
          display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{t('dashboard.stat_all')}:</span>
            <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>{filteredOrders.length}</span>
          </div>
          <div style={{ height: '24px', width: '1px', backgroundColor: 'var(--border-color)' }}></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{t('dashboard.stat_confirmed')}:</span>
            <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--status-stock)' }}>
              {filteredOrders.filter(o => o.current_status === 'CONFIRMED').length}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{t('dashboard.stat_in_production')}:</span>
            <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--status-production)' }}>
              {filteredOrders.filter(o => o.current_status === 'IN_PRODUCTION').length}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{t('dashboard.stat_shipping')}:</span>
            <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#3498db' }}>
              {filteredOrders.filter(o => o.current_status === 'SHIPPING').length}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{t('dashboard.stat_arrived')}:</span>
            <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#9b59b6' }}>
              {filteredOrders.filter(o => o.current_status === 'ARRIVED').length}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{t('dashboard.stat_in_stock')}:</span>
            <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#2ecc71' }}>
              {filteredOrders.filter(o => o.current_status === 'IN_STOCK').length}
            </span>
          </div>
        </div>

        {isMobileView ? (
          <div className="mobile-cards-grid">
            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>데이터를 불러오는 중입니다...</div>
            ) : filteredOrders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>조회된 주문 내역이 없습니다.</div>
            ) : (
              filteredOrders.map(order => (
                <div key={order.id} className="mobile-order-card" onClick={() => toggleRow(order.id)} style={{ cursor: 'pointer' }}>
                  <div className="mobile-order-header">
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>{order.dealer_company ? order.dealer_company.name : 'AK MAKINA'}</span>
                      <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--accent-cyan)' }}>{order.reference_no}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>S/N: {order.serial_number || '-'}</div>
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

                  <div style={{ background: 'var(--bg-input)', padding: '12px', borderRadius: '12px', border: '1px solid var(--border-color)', marginBottom: '12px' }} onClick={e => e.stopPropagation()}>
                    <StepBar currentStatus={order.current_status} />
                  </div>

                  <div className="mobile-order-meta" style={{ flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <MapPin size={15} color="var(--accent-cyan)" />
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Port:</span>
                      <span>{order.destination_port || 'Hamburg'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Clock size={15} color="var(--accent-blue)" />
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>ETA:</span>
                      <span style={{ color: 'var(--accent-blue)', fontWeight: 600 }}>
                        {order.eta ? new Date(order.eta).toLocaleDateString() : '2026.08.30'}
                      </span>
                    </div>
                  </div>

                  {currentRole !== 'RSM' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }} onClick={e => e.stopPropagation()}>
                      {order.current_status === 'IN_STOCK' ? (
                        <>
                          <button
                            onClick={() => handleCompleteStatus(order.id, 'DISPATCHED')}
                            className="btn btn-outline"
                            style={{ padding: '3px 4px', fontSize: '10px', justifyContent: 'center', borderColor: 'var(--status-stock)', color: 'var(--status-stock)' }}
                          >
                            {t('menu1.btn_in_stock_complete', '입고완료')}
                          </button>
                          <button
                            onClick={() => handleRollbackStatus(order.id, order.current_status)}
                            className="btn btn-outline"
                            style={{ padding: '3px 4px', fontSize: '10px', justifyContent: 'center', borderColor: 'var(--text-muted)', color: 'var(--text-muted)' }}
                          >
                            {t('menu1.btn_prev_mobile', 'Prev')}
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleNextStatus(order.id, order.current_status)}
                            className="btn btn-outline"
                            style={{ padding: '3px 4px', fontSize: '10px', justifyContent: 'center', borderColor: 'var(--accent-blue)', color: 'var(--accent-blue)' }}
                          >
                            {t('menu1.btn_next_mobile', 'Next')}
                          </button>
                          {order.current_status !== 'CONFIRMED' && (
                            <button
                              onClick={() => handleRollbackStatus(order.id, order.current_status)}
                              className="btn btn-outline"
                              style={{ padding: '3px 4px', fontSize: '10px', justifyContent: 'center', borderColor: 'var(--text-muted)', color: 'var(--text-muted)' }}
                            >
                              {t('menu1.btn_prev_mobile', 'Prev')}
                            </button>
                          )}
                        </>
                      )}
                      <button
                        onClick={() => handleEditClick(order)}
                        className="btn btn-outline"
                        style={{ padding: '3px 4px', fontSize: '10px', justifyContent: 'center', borderColor: 'var(--accent-cyan)', color: 'var(--accent-cyan)' }}
                      >
                        {t('menu1.btn_edit', 'Edit')}
                      </button>
                      <button
                        onClick={() => handleDeleteOrder(order.id)}
                        className="btn btn-outline"
                        style={{ padding: '3px 4px', fontSize: '10px', justifyContent: 'center', borderColor: 'var(--accent-red, #ef4444)', color: 'var(--accent-red, #ef4444)' }}
                      >
                        {t('menu1.btn_delete', 'Delete')}
                      </button>
                    </div>
                  )}

                  {expandedRows.has(order.id) && (
                    <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px dashed var(--border-color)', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)' }} onClick={e => e.stopPropagation()}>
                      <div style={{ display: 'flex' }}><strong style={{ color: 'var(--text-primary)', width: '90px' }}>{t('menu2.detail_status', '진행상태')}:</strong> <span>{order.current_status ? t(`stepbar.${order.current_status.toLowerCase()}`, order.current_status) : '-'}</span></div>
                      <div style={{ display: 'flex' }}><strong style={{ color: 'var(--text-primary)', width: '90px' }}>{t('menu2.detail_sn', 'S/N')}:</strong> <span>{order.serial_number || '-'}</span></div>
                      <div style={{ display: 'flex' }}><strong style={{ color: 'var(--text-primary)', width: '90px' }}>{t('menu2.detail_so', 'S/O')}:</strong> <span>{order.so_no || '-'}</span></div>
                      <div style={{ display: 'flex' }}><strong style={{ color: 'var(--text-primary)', width: '90px' }}>{t('menu2.detail_remark', 'REMARK')}:</strong> <span>{order.remark || '-'}</span></div>
                      <div style={{ display: 'flex' }}><strong style={{ color: 'var(--text-primary)', width: '90px' }}>{t('menu2.detail_etd_eta', 'ETD / ETA')}:</strong> <span>{order.etd ? new Date(order.etd).toLocaleDateString() : '-'} / {order.eta ? new Date(order.eta).toLocaleDateString() : '-'}</span></div>
                      <div style={{ display: 'flex' }}><strong style={{ color: 'var(--text-primary)', width: '90px' }}>{t('menu2.detail_port', 'PORT')}:</strong> <span>{getStandardPort(order.destination_port)}</span></div>
                      <div style={{ display: 'flex' }}><strong style={{ color: 'var(--text-primary)', width: '90px' }}>{t('menu2.detail_incoterms', 'INCOTERMS')}:</strong> <span>{order.incoterms || '-'}</span></div>
                      <div style={{ display: 'flex' }}><strong style={{ color: 'var(--text-primary)', width: '90px' }}>{t('menu2.detail_vessel', 'VESSEL')}:</strong> <span>{order.vessel || '-'}</span></div>
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
                  <th style={{ width: '3%', textAlign: 'left', fontWeight: 'bold' }}>{t('menu1.header_no')}</th>
                  <th style={{ width: '12%', textAlign: 'left', fontWeight: 'bold' }}>{t('menu1.header_model')}</th>
                  <th style={{ width: '15%', textAlign: 'left', fontWeight: 'bold' }}>{t('menu1.header_po')}</th>
                  <th style={{ width: '10%', textAlign: 'left', fontWeight: 'bold' }}>{t('menu1.header_dealer')}</th>
                  <th style={{ width: '35%', textAlign: 'center', fontWeight: 'bold' }}>{t('menu1.header_status')}</th>
                  <th style={{ width: '15%', textAlign: 'left', fontWeight: 'bold' }}>{t('menu1.header_port')}</th>
                  {currentRole !== 'RSM' && (
                    <th style={{ width: '10%', textAlign: 'left', fontWeight: 'bold' }}>{t('menu1.header_management')}</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={currentRole === 'RSM' ? 6 : 7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>데이터를 불러오는 중입니다...</td></tr>
                ) : filteredOrders.length === 0 ? (
                  <tr><td colSpan={currentRole === 'RSM' ? 6 : 7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>조회된 주문 내역이 없습니다.</td></tr>
                ) : (
                  filteredOrders.map((order, index) => {
                    const showSchedule = !['CONFIRMED', 'IN_PRODUCTION'].includes(order.current_status);
                    return (
                      <React.Fragment key={order.id}>
                        <tr
                          onClick={() => toggleRow(order.id)}
                          style={{ cursor: 'pointer', transition: 'background-color 0.2s' }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          <td style={{ borderBottom: expandedRows.has(order.id) ? 'none' : '1px solid var(--border-color)', paddingBottom: '5px', paddingTop: '5px' }}>
                            <div style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{index + 1}</div>
                          </td>
                          <td style={{ borderBottom: expandedRows.has(order.id) ? 'none' : '1px solid var(--border-color)', paddingBottom: '5px', paddingTop: '5px' }}>
                            <div style={{ fontWeight: 600 }}>{order.product_model ? order.product_model.model_name : 'Unknown Model'}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{order.product_model && order.product_model.category ? order.product_model.category.name : 'Machining Center'}</div>
                          </td>
                          <td style={{ borderBottom: expandedRows.has(order.id) ? 'none' : '1px solid var(--border-color)', paddingBottom: '5px', paddingTop: '5px' }}>
                            <div style={{ fontWeight: 600 }}>
                              {order.reference_no || '-'}
                            </div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                              {order.serial_number || '-'}
                            </div>
                          </td>
                          <td style={{ borderBottom: expandedRows.has(order.id) ? 'none' : '1px solid var(--border-color)', paddingBottom: '5px', paddingTop: '5px' }}>
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                              {order.dealer_company ? order.dealer_company.name : 'WME'}
                            </div>
                          </td>
                          <td style={{ borderBottom: expandedRows.has(order.id) ? 'none' : '1px solid var(--border-color)', paddingBottom: '5px', paddingTop: '5px' }}>
                            <StepBar currentStatus={order.current_status} />
                          </td>
                          <td style={{ borderBottom: expandedRows.has(order.id) ? 'none' : '1px solid var(--border-color)', paddingBottom: '5px', paddingTop: '5px' }}>
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
                          {currentRole !== 'RSM' && (
                            <td style={{ verticalAlign: 'middle', borderBottom: expandedRows.has(order.id) ? 'none' : '1px solid var(--border-color)', paddingBottom: '5px', paddingTop: '5px' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }} onClick={e => e.stopPropagation()}>
                                {order.current_status === 'IN_STOCK' ? (
                                  <>
                                    <button
                                      onClick={() => handleCompleteStatus(order.id, 'DISPATCHED')}
                                      className="btn btn-outline"
                                      style={{ padding: '3px 4px', fontSize: '10px', justifyContent: 'center', borderColor: 'var(--status-stock)', color: 'var(--status-stock)' }}
                                    >
                                      {t('menu1.btn_in_stock_complete', '입고완료')}
                                    </button>
                                    <button
                                      onClick={() => handleRollbackStatus(order.id, order.current_status)}
                                      className="btn btn-outline"
                                      style={{ padding: '3px 4px', fontSize: '10px', justifyContent: 'center', borderColor: 'var(--text-muted)', color: 'var(--text-muted)' }}
                                    >
                                      {t('menu1.btn_prev')}
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button
                                      onClick={() => handleNextStatus(order.id, order.current_status)}
                                      className="btn btn-outline"
                                      style={{ padding: '3px 4px', fontSize: '10px', justifyContent: 'center', borderColor: 'var(--accent-blue)', color: 'var(--accent-blue)' }}
                                    >
                                      {t('menu1.btn_next')}
                                    </button>
                                    {order.current_status !== 'CONFIRMED' && (
                                      <button
                                        onClick={() => handleRollbackStatus(order.id, order.current_status)}
                                        className="btn btn-outline"
                                        style={{ padding: '3px 4px', fontSize: '10px', justifyContent: 'center', borderColor: 'var(--text-muted)', color: 'var(--text-muted)' }}
                                      >
                                        {t('menu1.btn_prev')}
                                      </button>
                                    )}
                                  </>
                                )}
                                <button
                                  onClick={() => handleEditClick(order)}
                                  className="btn btn-outline"
                                  style={{ padding: '3px 4px', fontSize: '10px', justifyContent: 'center', borderColor: 'var(--accent-cyan)', color: 'var(--accent-cyan)' }}
                                >
                                  {t('menu1.btn_edit')}
                                </button>
                                <button
                                  onClick={() => handleDeleteOrder(order.id)}
                                  className="btn btn-outline"
                                  style={{ padding: '3px 4px', fontSize: '10px', justifyContent: 'center', borderColor: 'var(--accent-red, #ef4444)', color: 'var(--accent-red, #ef4444)' }}
                                >
                                  {t('menu1.btn_delete')}
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                        {expandedRows.has(order.id) && (
                          <tr>
                            <td colSpan={currentRole === 'RSM' ? 6 : 7} style={{ backgroundColor: 'var(--bg-card)', paddingTop: '8px', borderTop: '1px dashed var(--border-color)', paddingBottom: '16px', borderBottom: '1px solid var(--border-color)' }}>
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
                                  <div><span style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'inline-block', width: '100px' }}>{t('menu1.order_date', '딜러발주 일자')}:</span> {order.dealer_order_date ? new Date(order.dealer_order_date).toLocaleDateString() : '-'}</div>
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
                                  <div><span style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'inline-block', width: '100px' }}>ETD / ETA:</span> {showSchedule ? `${order.etd ? new Date(order.etd).toLocaleDateString() : '-'} / ${order.eta ? new Date(order.eta).toLocaleDateString() : '-'}` : ' - '}</div>
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

      {editingOrder && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: '20px'
        }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', padding: '24px', position: 'relative' }}>
            <h2 style={{ fontSize: '1.2rem', marginBottom: '16px', color: 'var(--text-primary)' }}>
              {t('menu1.edit_modal.title')} ({editingOrder.reference_no})
            </h2>
            <form onSubmit={handleUpdateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                {/* Row 1 */}
                <div style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{t('menu1.edit_modal.model')}</label>
                    <select
                      value={editForm.product_model_id}
                      onChange={e => setEditForm({ ...editForm, product_model_id: e.target.value })}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)' }}
                    >
                      <option value="">-- 모델 선택 --</option>
                      {models.map(m => (
                        <option key={m.id} value={m.id}>{m.model_code}</option>
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
                  <input type="text" value={editForm.serial_number} onChange={e => setEditForm({ ...editForm, serial_number: e.target.value })} placeholder={t('menu1.edit_modal.sn_placeholder')} style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>S/O</label>
                  <input type="text" value={editForm.so_no} onChange={e => setEditForm({ ...editForm, so_no: e.target.value })} placeholder={t('menu1.edit_modal.so_placeholder')} style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)' }} />
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
                  <input type="text" value={editForm.detail_spec} onChange={e => setEditForm({ ...editForm, detail_spec: e.target.value })} placeholder={t('menu1.edit_modal.detail_placeholder')} style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)' }} />
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
                  <input type="text" value={editForm.vessel} onChange={e => setEditForm({ ...editForm, vessel: e.target.value })} placeholder={t('menu1.edit_modal.vessel_placeholder')} style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)' }} />
                </div>

                {/* Row 7 */}
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>REMARK</label>
                  <textarea value={editForm.remark} onChange={e => setEditForm({ ...editForm, remark: e.target.value })} placeholder={t('menu1.edit_modal.remark_placeholder')} style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)', resize: 'vertical', minHeight: '80px' }} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setEditingOrder(null)} className="btn btn-outline" style={{ padding: '6px 12px', fontSize: '0.85rem' }}>{t('menu1.edit_modal.cancel')}</button>
                <button type="submit" className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '0.85rem' }}>{t('menu1.edit_modal.save')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
