import React, { useState, useEffect } from 'react';
import { Search, Package, CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function AdminInventory({ isMobileView }) {
  const { t } = useTranslation();
  const [orders, setOrders] = useState([]);
  const [dealers, setDealers] = useState([]);
  const [portCodes, setPortCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [stockTypeFilter, setStockTypeFilter] = useState('ALL');
  const [pendingChanges, setPendingChanges] = useState({});

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

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/orders?is_corporate_stock=true');
      const data = await res.json();
      if (Array.isArray(data)) {
        setOrders(data);
      }
    } catch (err) {
      console.error("Failed to fetch inventory:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDealersAndPorts = async () => {
    try {
      const [dealersRes, portsRes] = await Promise.all([
        fetch('/api/dealers'),
        fetch('/api/master-data/port-codes')
      ]);
      const data = await dealersRes.json();
      if (Array.isArray(data)) {
        setDealers(data.filter(d => d.name !== 'WME'));
      }
      setPortCodes(await portsRes.json());
    } catch (err) {
      console.error("Failed to fetch dealers or ports:", err);
    }
  };

  useEffect(() => {
    fetchInventory();
    fetchDealersAndPorts();
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

  const handlePendingChange = (orderId, field, value) => {
    setPendingChanges(prev => ({
      ...prev,
      [orderId]: {
        ...prev[orderId],
        [field]: value
      }
    }));
  };

  const handleUpdateStockType = async (orderId, newType) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stock_type: newType })
      });
      if (res.ok) {
        alert(`장비 ID ${orderId}의 용도가 ${newType}으로 변경되었습니다.`);
        return true;
      } else {
        const errorData = await res.json();
        alert(`용도 변경 실패: ${errorData.detail || "알 수 없는 오류"}`);
        return false;
      }
    } catch (err) {
      console.error("Failed to update stock type:", err);
      alert("용도 변경 중 오류가 발생했습니다.");
      return false;
    }
  };

  const handleAssignDealer = async (orderId, dealerId) => {
    if (!dealerId) return;
    try {
      const res = await fetch(`/api/orders/${orderId}/assign-dealer`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dealer_company_id: parseInt(dealerId) })
      });
      if (res.ok) {
        alert("딜러 발주로 변경되었습니다.");
        return true;
      } else {
        const errorData = await res.json();
        alert(`변경 실패: ${errorData.detail || "알 수 없는 오류"}`);
        return false;
      }
    } catch (err) {
      console.error("Failed to assign dealer:", err);
      alert("변경 중 오류가 발생했습니다.");
      return false;
    }
  };

  const handleConfirmChanges = async (orderId) => {
    const changes = pendingChanges[orderId];
    if (!changes) return;

    if (changes.dealerId || changes.stockType) {
      if (!window.confirm("선택한 내용으로 변경을 확정하시겠습니까?")) return;
    }

    let success = true;
    if (changes.dealerId) {
      success = await handleAssignDealer(orderId, changes.dealerId);
    }
    if (success && changes.stockType) {
      success = await handleUpdateStockType(orderId, changes.stockType);
    }

    if (success) {
      setPendingChanges(prev => {
        const next = { ...prev };
        delete next[orderId];
        return next;
      });
      fetchInventory(); // 목록 새로고침
    }
  };

  const filteredOrders = orders.filter(o => {
    const query = searchQuery.toLowerCase();
    const matchesQuery = (o.reference_no && o.reference_no.toLowerCase().includes(query)) ||
      (o.nc && o.nc.toLowerCase().includes(query)) ||
      (o.product_model && o.product_model.model_name && o.product_model.model_name.toLowerCase().includes(query)) ||
      (o.serial_number && o.serial_number.toLowerCase().includes(query)) ||
      (o.detail_spec && o.detail_spec.toLowerCase().includes(query));

    const sType = o.stock_type || 'AVAILABLE';
    const matchesType = stockTypeFilter === 'ALL' || sType === stockTypeFilter;

    return matchesQuery && matchesType;
  });

  return (
    <div className="page-body">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', marginBottom: '4px' }}>{t('menu2.page_title', '유럽 재고 상태')}</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            {t('menu2.page_desc', 'WIA 유럽법인의 가용 재고(ATP) 현황을 파악 할 수 있습니다.')}
          </p>
        </div>
      </div>

      <div className="glass-card no-hover-bg" style={{ padding: '28px', marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h2 style={{ fontSize: '1.3rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Package size={20} color="var(--status-stock)" />
              <span>{t('menu2.inventory_list_title', '법인 가용재고 목록')}</span>
            </h2>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative' }}>
              <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder={t('menu2.search_placeholder', '검색')}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-primary)',
                  padding: '8px 14px 8px 36px', borderRadius: '10px', fontSize: '0.85rem', width: '240px'
                }}
              />
            </div>
            <select
              value={stockTypeFilter}
              onChange={e => setStockTypeFilter(e.target.value)}
              style={{
                background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-primary)',
                padding: '8px 14px', borderRadius: '10px', fontSize: '0.85rem', cursor: 'pointer'
              }}
            >
              <option value="ALL">{t('menu2.filter_all', '전체 상태 조회')}</option>
              <option value="AVAILABLE">{t('menu2.type_available', '판매가능')}</option>
              <option value="DEALER_ORDER">{t('menu2.type_dealer_order', '딜러주문')}</option>
              <option value="RENTAL">{t('menu2.type_rental', '임대')}</option>
              <option value="SHOWROOM">{t('menu2.type_showroom', '전시')}</option>
              <option value="PROMOTION">{t('menu2.type_promotion', '프로모션')}</option>
            </select>
          </div>
        </div>

        {/* 리스트 재고 수량 통계 Header */}
        <div style={{
          marginBottom: '20px', padding: '16px 24px', backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-color)', borderRadius: '12px',
          display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{t('menu2.stat_all', '전체')}:</span>
            <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>{filteredOrders.length}</span>
          </div>
          <div style={{ height: '24px', width: '1px', backgroundColor: 'var(--border-color)' }}></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{t('menu2.type_available', '판매가능')}:</span>
            <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--status-stock)' }}>
              {filteredOrders.filter(o => (o.stock_type || 'AVAILABLE') === 'AVAILABLE').length}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{t('menu2.type_rental', '임대')}:</span>
            <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--status-production)' }}>
              {filteredOrders.filter(o => (o.stock_type || 'AVAILABLE') === 'RENTAL').length}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{t('menu2.type_showroom', '전시')}:</span>
            <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#4da6ff' }}>
              {filteredOrders.filter(o => (o.stock_type || 'AVAILABLE') === 'SHOWROOM').length}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{t('menu2.type_promotion', '프로모션')}:</span>
            <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
              {filteredOrders.filter(o => (o.stock_type || 'AVAILABLE') === 'PROMOTION').length}
            </span>
          </div>
        </div>

        {isMobileView ? (
          <div className="mobile-cards-grid">
            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>데이터를 불러오는 중입니다...</div>
            ) : filteredOrders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>가용 재고 내역이 없습니다.</div>
            ) : (
              filteredOrders.map((order, index) => {
                const sType = pendingChanges[order.id]?.stockType || order.stock_type || 'AVAILABLE';

                let typeBgColor = 'var(--bg-secondary)';
                let typeColor = 'var(--text-primary)';
                if (sType === 'AVAILABLE') { typeBgColor = 'hsla(142, 76%, 46%, 0.2)'; typeColor = 'var(--status-stock)'; }
                else if (sType === 'DEALER_ORDER') { typeBgColor = 'hsla(200, 76%, 46%, 0.2)'; typeColor = 'var(--accent-cyan)'; }
                else if (sType === 'RENTAL') { typeBgColor = 'hsla(45, 93%, 58%, 0.2)'; typeColor = 'var(--status-production)'; }
                else if (sType === 'SHOWROOM') { typeBgColor = 'hsla(200, 90%, 60%, 0.2)'; typeColor = 'var(--accent-cyan)'; }
                else if (sType === 'PROMOTION') { typeBgColor = 'hsla(340, 82%, 52%, 0.2)'; typeColor = 'var(--accent-pink)'; }

                return (
                  <div key={order.id} className="mobile-order-card" onClick={() => toggleRow(order.id)} style={{ cursor: 'pointer' }}>
                    <div className="mobile-order-header">
                      <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                        {order.product_model ? order.product_model.model_name : 'Unknown Model'}
                      </div>
                      <div style={{ fontWeight: 700, color: 'var(--accent-cyan)', fontSize: '0.9rem' }}>
                        {order.reference_no}
                      </div>
                    </div>
                    <div className="mobile-order-meta">
                      <span>NC: <strong style={{ color: 'var(--text-primary)' }}>{order.nc || 'F0iP'}</strong></span>
                      <span>Buying: <strong style={{ color: 'var(--text-primary)' }}>{order.price || '-'}</strong></span>
                      <span>ETA: <strong style={{ color: 'var(--text-primary)' }}>{order.eta ? new Date(order.eta).toLocaleDateString() : '-'}</strong></span>
                    </div>

                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.4, padding: '10px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                      {order.detail_spec || 'T/F, CC(S-H)+B, 20BAR, B/I, P/C, Q(A)'}
                    </div>

                    <div style={{ display: 'flex', gap: '12px', flexDirection: 'column', marginTop: '4px' }} onClick={e => e.stopPropagation()}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>용도 변경</span>
                        <select
                          value={sType}
                          onChange={(e) => handlePendingChange(order.id, 'stockType', e.target.value)}
                          style={{
                            background: typeBgColor, border: `1px solid ${typeBgColor}`, color: typeColor,
                            padding: '6px 10px', borderRadius: '8px', fontSize: '0.85rem', cursor: 'pointer', width: '130px',
                            fontWeight: 600, textAlign: 'center'
                          }}
                        >
                          <option value="AVAILABLE" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>{t('menu2.type_available', '판매가능')}</option>
                          <option value="DEALER_ORDER" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>{t('menu2.type_dealer_order', '딜러주문')}</option>
                          <option value="RENTAL" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>{t('menu2.type_rental', '임대')}</option>
                          <option value="SHOWROOM" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>{t('menu2.type_showroom', '전시')}</option>
                          <option value="PROMOTION" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>{t('menu2.type_promotion', '프로모션')}</option>
                        </select>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>발주 전환</span>
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flex: 1, justifyContent: 'flex-end' }}>
                          <select
                            value={pendingChanges[order.id]?.dealerId || ""}
                            onChange={(e) => handlePendingChange(order.id, 'dealerId', e.target.value)}
                            style={{
                              background: 'var(--bg-secondary)', border: '1px solid var(--accent-cyan)', color: 'var(--text-primary)',
                              padding: '6px 10px', borderRadius: '8px', fontSize: '0.85rem', cursor: 'pointer', maxWidth: '130px', textAlign: 'center'
                            }}
                          >
                            <option value="" disabled>{t('menu2.convert_to_order', '딜러사 선택')}</option>
                            {dealers.map(d => (
                              <option key={d.id} value={d.id}>{d.name}</option>
                            ))}
                          </select>
                          {pendingChanges[order.id] && (Object.keys(pendingChanges[order.id]).length > 0) && (
                            <button
                              onClick={() => handleConfirmChanges(order.id)}
                              className="btn btn-primary"
                              style={{ padding: '6px 12px', fontSize: '0.85rem', whiteSpace: 'nowrap' }}
                            >
                              {t('menu2.btn_confirm', '확정')}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {expandedRows.has(order.id) && (
                      <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px dashed var(--border-color)', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
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
                );
              })
            )}
          </div>
        ) : (
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '4%', textAlign: 'center', fontWeight: 'bold' }}>{t('menu2.header_no')}</th>
                  <th style={{ width: '11%', textAlign: 'center', fontWeight: 'bold' }}>{t('menu2.header_model')}</th>
                  <th style={{ width: '8%', textAlign: 'center', fontWeight: 'bold' }}>{t('menu2.header_nc')}</th>
                  <th style={{ width: '8%', textAlign: 'center', fontWeight: 'bold' }}>{t('menu2.header_buying')}</th>
                  <th style={{ width: '10%', textAlign: 'center', fontWeight: 'bold' }}>{t('menu2.header_po')}</th>
                  <th style={{ width: '33%', textAlign: 'center', fontWeight: 'bold' }}>{t('menu2.header_detailspec')}</th>
                  <th style={{ width: '8%', textAlign: 'center', fontWeight: 'bold' }}>{t('menu2.header_eta')}</th>
                  <th style={{ width: '8%', textAlign: 'center', fontWeight: 'bold' }}>{t('menu2.header_status_change')}</th>
                  <th style={{ width: '10%', textAlign: 'center', fontWeight: 'bold' }}>{t('menu2.header_dealer_order')}</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>데이터를 불러오는 중입니다...</td></tr>
                ) : filteredOrders.length === 0 ? (
                  <tr><td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>가용 재고 내역이 없습니다.</td></tr>
                ) : (
                  filteredOrders.map((order, index) => {
                    const sType = pendingChanges[order.id]?.stockType || order.stock_type || 'AVAILABLE';

                    // 장기재고 식별 (etd 기준)
                    let isLongTerm = false; // 1년 이상
                    let isBadTerm = false;  // 2년 이상
                    if (order.etd) {
                      const diffTime = Math.abs(new Date() - new Date(order.etd));
                      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                      if (diffDays >= 730) {
                        isBadTerm = true;
                      } else if (diffDays >= 365) {
                        isLongTerm = true;
                      }
                    }

                    // 동적 배경색 설정
                    let typeBgColor = 'var(--bg-secondary)';
                    let typeColor = 'var(--text-primary)';
                    if (sType === 'AVAILABLE') { typeBgColor = 'hsla(142, 76%, 46%, 0.2)'; typeColor = 'var(--status-stock)'; }
                    else if (sType === 'DEALER_ORDER') { typeBgColor = 'hsla(200, 76%, 46%, 0.2)'; typeColor = 'var(--accent-cyan)'; }
                    else if (sType === 'RENTAL') { typeBgColor = 'hsla(45, 93%, 58%, 0.2)'; typeColor = 'var(--status-production)'; }
                    else if (sType === 'SHOWROOM') { typeBgColor = 'hsla(200, 90%, 60%, 0.2)'; typeColor = 'var(--accent-cyan)'; } // 하늘색
                    else if (sType === 'PROMOTION') { typeBgColor = 'hsla(340, 82%, 52%, 0.2)'; typeColor = 'var(--accent-pink)'; }

                    return (
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
                            <div style={{ fontWeight: 600, fontSize: '12px' }}>{order.product_model ? order.product_model.model_name : 'Unknown Model'}</div>
                          </td>
                          <td style={{ borderBottom: expandedRows.has(order.id) ? 'none' : '1px solid var(--border-color)', paddingBottom: '5px', paddingTop: '5px', textAlign: 'center' }}>
                            <div style={{ fontSize: '12px' }}>{order.nc || 'F0iP'}</div>
                          </td>
                          <td style={{ borderBottom: expandedRows.has(order.id) ? 'none' : '1px solid var(--border-color)', paddingBottom: '5px', paddingTop: '5px', textAlign: order.price ? 'right' : 'center', paddingRight: order.price ? '16px' : '0' }}>
                            <div style={{ fontSize: '12px' }}>{order.price || '-'}</div>
                          </td>
                          <td style={{ borderBottom: expandedRows.has(order.id) ? 'none' : '1px solid var(--border-color)', paddingBottom: '5px', paddingTop: '5px', textAlign: 'center' }}>
                            <div style={{ fontWeight: 700, color: 'var(--accent-cyan)', fontSize: '11px' }}>{order.reference_no}</div>
                          </td>
                          <td style={{ borderBottom: expandedRows.has(order.id) ? 'none' : '1px solid var(--border-color)', paddingBottom: '5px', paddingTop: '5px', textAlign: 'left' }}>
                            <div style={{ fontSize: '11px' }}>{order.detail_spec || 'T/F, CC(S-H)+B, 20BAR, B/I, P/C, Q(A)'}</div>
                          </td>
                          <td style={{ borderBottom: expandedRows.has(order.id) ? 'none' : '1px solid var(--border-color)', paddingBottom: '5px', paddingTop: '5px', textAlign: 'center' }}>
                            <div style={{ fontSize: '11px' }}>{order.eta ? new Date(order.eta).toLocaleDateString() : '-'}</div>
                          </td>
                          <td onClick={e => e.stopPropagation()} style={{ borderBottom: expandedRows.has(order.id) ? 'none' : '1px solid var(--border-color)', paddingBottom: '5px', paddingTop: '5px', textAlign: 'center' }}>
                            <select
                              value={sType}
                              onChange={(e) => handlePendingChange(order.id, 'stockType', e.target.value)}
                              style={{
                                background: typeBgColor, border: `1px solid ${typeBgColor}`, color: typeColor,
                                padding: '4px 8px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer', width: '85px',
                                fontWeight: 600, textAlign: 'center'
                              }}
                            >
                              <option value="AVAILABLE" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>{t('menu2.type_available', '판매가능')}</option>
                              <option value="DEALER_ORDER" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>{t('menu2.type_dealer_order', '딜러주문')}</option>
                              <option value="RENTAL" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>{t('menu2.type_rental', '임대')}</option>
                              <option value="SHOWROOM" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>{t('menu2.type_showroom', '전시')}</option>
                              <option value="PROMOTION" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>{t('menu2.type_promotion', '프로모션')}</option>
                            </select>
                          </td>
                          <td onClick={e => e.stopPropagation()} style={{ borderBottom: expandedRows.has(order.id) ? 'none' : '1px solid var(--border-color)', paddingBottom: '5px', paddingTop: '5px', textAlign: 'center' }}>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                              <select
                                value={pendingChanges[order.id]?.dealerId || ""}
                                onChange={(e) => handlePendingChange(order.id, 'dealerId', e.target.value)}
                                style={{
                                  background: 'var(--bg-secondary)', border: '1px solid var(--accent-cyan)', color: 'var(--text-primary)',
                                  padding: '4px 8px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer', flex: 1, textAlign: 'center'
                                }}
                              >
                                <option value="" disabled>{t('menu2.convert_to_order', '발주로 전환')}</option>
                                {dealers.map(d => (
                                  <option key={d.id} value={d.id}>{d.name}</option>
                                ))}
                              </select>
                              {pendingChanges[order.id] && (Object.keys(pendingChanges[order.id]).length > 0) && (
                                <button
                                  onClick={() => handleConfirmChanges(order.id)}
                                  className="btn btn-primary"
                                  style={{ padding: '4px 12px', fontSize: '11px', whiteSpace: 'nowrap' }}
                                >
                                  {t('menu2.btn_confirm', '확정')}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                        {expandedRows.has(order.id) && (
                          <tr>
                            <td colSpan={9} style={{ backgroundColor: 'var(--bg-card)', paddingTop: '12px', borderTop: '1px dashed var(--border-color)', paddingBottom: '16px', borderBottom: '1px solid var(--border-color)' }}>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', paddingLeft: '8px' }}>
                                <div style={{
                                  fontSize: '12px',
                                  color: 'var(--text-secondary)',
                                  lineHeight: '1.8',
                                  textAlign: 'left',
                                  paddingLeft: '16px',
                                  borderLeft: '3px solid var(--wia-blue)',
                                }}>
                                  <div><span style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'inline-block', width: '100px' }}>{t('menu2.detail_status', '진행상태')}:</span> {order.current_status ? t(`stepbar.${order.current_status.toLowerCase()}`, order.current_status) : '-'}</div>
                                  <div><span style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'inline-block', width: '100px' }}>{t('menu2.detail_sn', 'S/N')}:</span> {order.serial_number || '-'}</div>
                                  <div><span style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'inline-block', width: '100px' }}>{t('menu2.detail_so', 'S/O')}:</span> {order.so_no || '-'}</div>
                                  <div><span style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'inline-block', width: '100px' }}>{t('menu2.detail_remark', 'REMARK')}:</span> {order.remark || '-'}</div>
                                </div>

                                <div style={{
                                  fontSize: '12px',
                                  color: 'var(--text-secondary)',
                                  lineHeight: '1.8',
                                  textAlign: 'left',
                                  paddingLeft: '16px',
                                  borderLeft: '3px solid var(--wia-blue)',
                                }}>
                                  <div><span style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'inline-block', width: '100px' }}>{t('menu2.detail_etd_eta', 'ETD / ETA')}:</span> {order.etd ? new Date(order.etd).toLocaleDateString() : '-'} / {order.eta ? new Date(order.eta).toLocaleDateString() : '-'}</div>
                                  <div><span style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'inline-block', width: '100px' }}>{t('menu2.detail_port', 'PORT')}:</span> {getStandardPort(order.destination_port)}</div>
                                  <div><span style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'inline-block', width: '100px' }}>{t('menu2.detail_incoterms', 'INCOTERMS')}:</span> {order.incoterms || '-'}</div>
                                  <div><span style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'inline-block', width: '100px' }}>{t('menu2.detail_vessel', 'VESSEL')}:</span> {order.vessel || '-'}</div>
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
