import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Ship, Calendar, Package, ChevronsRight, Search, CheckCircle2, Smartphone, Monitor, ShieldCheck, MapPin, Clock } from 'lucide-react';
import StepBar from '../components/StepBar';

const COLORS = ['#06b6d4', '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899'];

export default function DealerDashboard({ currentRole, isMobileView }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL');

  // 데스크탑에서도 모바일 100% 반응형 카드 뷰를 시뮬레이션하고 체험할 수 있는 토글 상태
  const [simulateMobile, setSimulateMobile] = useState(false);
  const effectiveMobileView = isMobileView || simulateMobile;

  // 백엔드 API에서 발주 및 배송 타임라인 데이터 가져오기
  const fetchOrders = async () => {
    setLoading(true);
    try {
      let url = '/api/orders?exclude_completed=true';
      if (currentRole === 'DEALER') {
        url += '&dealer_id=1';
      }
      const res = await fetch(url);
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
  }, [currentRole]);

  // 배송 상태 수동 변경 (SCM_ADMIN / RSM 시뮬레이션 기능)
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
          reason: 'Dealer Simulation Update'
        })
      });
      fetchOrders();
    } catch (e) {
      alert("상태 변경 실패");
    }
  };

  // 1. Zone 1 KPI 카드 계산
  const shippingCount = orders.filter(o => o.current_status === 'SHIPPING').length;

  const now = new Date();
  const currentMonthCount = orders.filter(o => {
    if (!o.eta) return false;
    const etaDate = new Date(o.eta);
    return etaDate.getMonth() === now.getMonth() && etaDate.getFullYear() === now.getFullYear();
  }).length;

  const inStockOrders = orders.filter(o => o.current_status === 'IN_STOCK');
  const availableStockCount = inStockOrders.length;

  // 2. Zone 3 가용 재고 기종별 파이 차트 데이터 계산
  const stockByModel = {};
  inStockOrders.forEach(o => {
    const mName = o.product_model ? o.product_model.model_name : 'Unknown';
    stockByModel[mName] = (stockByModel[mName] || 0) + 1;
  });
  const pieData = Object.keys(stockByModel).map(model => ({
    name: model,
    value: stockByModel[model]
  }));

  // 필터링 적용
  const filteredOrders = orders.filter(o => {
    const matchesQuery = o.reference_no.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.product_model && o.product_model.model_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (o.serial_number && o.serial_number.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = selectedStatusFilter === 'ALL' || o.current_status === selectedStatusFilter;
    return matchesQuery && matchesStatus;
  });

  return (
    <div className="page-body">
      {/* V6 선택적 반응형 전략 배지 및 뷰 토글 영역 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div className="strategy-badge mobile-responsive" title="구성가이드 V6 설계: 현장 딜러를 위한 100% 모바일 최적화 전략">
          <Smartphone size={16} />
          <span>V6 기기 대응 전략: 딜러 포털 100% 모바일 반응형 최적화 (Active)</span>
        </div>

        {!isMobileView && (
          <button
            onClick={() => setSimulateMobile(!simulateMobile)}
            className="btn btn-outline"
            style={{ padding: '6px 14px', fontSize: '0.8rem', borderColor: simulateMobile ? 'var(--accent-cyan)' : 'var(--border-color)' }}
          >
            {simulateMobile ? <Monitor size={16} color="var(--accent-cyan)" /> : <Smartphone size={16} />}
            <span>{simulateMobile ? '🖥️ PC 데스크탑 그리드로 보기' : '📱 스마트폰 100% 모바일 카드 뷰 체험하기'}</span>
          </button>
        )}
      </div>

      {/* 타이틀 및 헤더 영역 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', paddingTop: '4px', paddingLeft: '28px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', marginBottom: '4px' }}>딜러 전용 포털 대시보드</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            {currentRole === 'DEALER'
              ? "TechMachinery GmbH 님의 유럽 내 주문 배송 타임라인 및 실시간 가용 재고 현황입니다."
              : `[${currentRole}] 모드: 전 유럽 딜러사 주문 및 운송 상태를 모니터링하고 제어합니다.`}
          </p>
        </div>
      </div>

      {/* Zone 1: 상단 요약 카드 (KPIs) */}
      <div className="kpi-grid">
        <div className="glass-card kpi-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="kpi-title">운송 중 내 장비 (SHIPPING)</span>
            <Ship color="var(--accent-cyan)" size={24} />
          </div>
          <div className="kpi-value">{shippingCount} <span style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--text-muted)' }}>대</span></div>
          <div className="kpi-desc">해상/항공 운송 및 B/L·ETA 관리 구간</div>
        </div>

        <div className="glass-card kpi-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="kpi-title">이번 달 입고 예정 (ETA)</span>
            <Calendar color="var(--accent-blue)" size={24} />
          </div>
          <div className="kpi-value">{currentMonthCount} <span style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--text-muted)' }}>대</span></div>
          <div className="kpi-desc">유럽 항구 도착 및 통관 진행 대상</div>
        </div>

        <div className="glass-card kpi-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="kpi-title">유럽 창고 가용 재고 (ATP)</span>
            <Package color="var(--status-stock)" size={24} />
          </div>
          <div className="kpi-value" style={{ color: 'var(--status-stock)' }}>{availableStockCount} <span style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--text-muted)' }}>대</span></div>
          <div className="kpi-desc">유럽 물류센터 보관 중 · 즉시 출고 가능</div>
        </div>
      </div>

      {/* Zone 2: 내 주문 배송 타임라인 (Progress Bar & Responsive View) */}
      <div className="glass-card" style={{ padding: effectiveMobileView ? '20px' : '28px', marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h2 style={{ fontSize: '1.3rem', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <span>Zone 2: 내 주문 배송 타임라인 (6단계 Pipeline)</span>
              <span style={{ fontSize: '0.8rem', background: 'hsla(217, 91%, 60%, 0.15)', color: 'var(--accent-blue)', padding: '4px 12px', borderRadius: '9999px', fontWeight: 600 }}>
                {effectiveMobileView ? '📱 모바일 최적화 카드 리스트' : '🖥️ 데스크탑 그리드 타임라인'}
              </span>
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>
              {effectiveMobileView
                ? "현장 딜러/RSM이 이동 중에도 스마트폰으로 즉시 재고 및 ETA를 확인할 수 있는 100% 모바일 카드 뷰입니다."
                : "시리얼 번호(S/N) 및 레퍼런스 번호를 통한 단계별 시각화 (CONFIRMED ➔ IN_PRODUCTION ➔ SHIPPING ➔ ARRIVED ➔ IN_STOCK)"}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', width: effectiveMobileView ? '100%' : 'auto' }}>
            <div style={{ position: 'relative', flex: effectiveMobileView ? 1 : 'none' }}>
              <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="발주번호, 모델명, S/N 검색..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-primary)',
                  padding: '8px 14px 8px 36px', borderRadius: '10px', fontSize: '0.85rem', width: effectiveMobileView ? '100%' : '240px'
                }}
              />
            </div>

            <select
              value={selectedStatusFilter}
              onChange={e => setSelectedStatusFilter(e.target.value)}
              style={{
                background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-primary)',
                padding: '8px 14px', borderRadius: '10px', fontSize: '0.85rem', cursor: 'pointer', flex: effectiveMobileView ? 1 : 'none'
              }}
            >
              <option value="ALL">전체 상태 조회</option>
              <option value="CONFIRMED">1. 주문 (CONFIRMED)</option>
              <option value="IN_PRODUCTION">2. 생산 중 (IN_PRODUCTION)</option>
              <option value="SHIPPING">3. 배송 (SHIPPING)</option>
              <option value="ARRIVED">4. 항구도착 (ARRIVED)</option>
              <option value="IN_STOCK">5. 입고 (IN_STOCK)</option>
            </select>
          </div>
        </div>

        {/* 100% 모바일 반응형 카드 리스트 뷰 (Mobile Card List View) */}
        {effectiveMobileView ? (
          <div className="mobile-cards-grid">
            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>데이터를 불러오는 중입니다...</div>
            ) : filteredOrders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>조회된 주문 내역이 없습니다.</div>
            ) : (
              filteredOrders.map(order => (
                <div key={order.id} className="mobile-order-card">
                  <div className="mobile-order-header">
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>REFERENCE NO.</span>
                      <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--accent-cyan)' }}>{order.reference_no}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>S/N: {order.serial_number || 'S/N 미발급'}</div>
                    </div>
                    {order.current_status === 'IN_STOCK' ? (
                      <span className="status-badge" style={{ background: 'hsla(142, 76%, 46%, 0.2)', color: 'var(--status-stock)' }}>
                        <CheckCircle2 size={14} /> 가용 (IN_STOCK)
                      </span>
                    ) : (
                      <span className="status-badge" style={{ background: 'hsla(190, 95%, 49%, 0.15)', color: 'var(--accent-cyan)' }}>
                        진행 단계: {order.current_status}
                      </span>
                    )}
                  </div>

                  <div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {order.product_model ? order.product_model.model_name : 'Unknown Model'}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--accent-blue)' }}>
                      {order.product_model && order.product_model.category ? order.product_model.category.name : ''}
                    </div>
                  </div>

                  {/* 모바일 화면에 최적화된 진행 스텝바 */}
                  <div style={{ marginBottom: '12px' }}>
                    <StepBar currentStatus={order.current_status} />
                  </div>

                  {/* 위치 및 ETA 메타 정보 */}
                  <div className="mobile-order-meta" style={{ flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <MapPin size={15} color="var(--accent-cyan)" />
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>현재 위치:</span>
                      <span>{order.physical_location}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Clock size={15} color="var(--accent-blue)" />
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>도착 예정(ETA):</span>
                      <span style={{ color: 'var(--accent-blue)', fontWeight: 600 }}>
                        {order.eta ? new Date(order.eta).toLocaleDateString() : '미정'}
                      </span>
                    </div>
                  </div>

                  {/* 상태 제어 버튼 (모바일 100% 클릭 친화) */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '4px' }}>
                    {order.current_status === 'IN_STOCK' ? (
                      <button
                        onClick={() => alert(`[${order.reference_no}] 해당 가용 재고의 즉시 출고 및 배송 요청이 완료되었습니다.`)}
                        className="btn btn-primary"
                        style={{ width: '100%', justifyContent: 'center' }}
                      >
                        <CheckCircle2 size={16} /> 즉시 출고 및 현장 인수 신청
                      </button>
                    ) : currentRole !== 'DEALER' ? (
                      <button
                        onClick={() => handleNextStatus(order.id, order.current_status)}
                        className="btn btn-outline"
                        style={{ width: '100%', padding: '3px 4px', fontSize: '10px', justifyContent: 'center', borderColor: 'var(--accent-blue)', color: 'var(--accent-blue)' }}
                      >
                        <span>다음 배송 단계로 변경</span>
                        <ChevronsRight size={16} />
                      </button>
                    ) : (
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', width: '100%', textAlign: 'center' }}>
                        운송 진행 상태 실시간 모니터링 중...
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          /* 데스크탑 최적화 그리드 테이블 뷰 (Desktop Table View) */
          <div className="data-table-container full-bleed">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '14%' }}>Reference No. / S/N</th>
                  <th style={{ width: '16%' }}>모델명 및 카테고리</th>
                  <th style={{ width: '42%' }}>배송 진행 상태 바 (Step Indicator)</th>
                  <th style={{ width: '14%' }}>현재 물리적 위치 / ETA</th>
                  <th style={{ width: '14%' }}>작업 및 상태 제어</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>데이터를 불러오는 중입니다...</td></tr>
                ) : filteredOrders.length === 0 ? (
                  <tr><td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>조회된 주문 내역이 없습니다.</td></tr>
                ) : (
                  filteredOrders.map(order => (
                    <tr key={order.id}>
                      <td>
                        <div style={{ fontWeight: 700, color: 'var(--accent-cyan)' }}>{order.reference_no}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{order.serial_number || 'S/N 미발급'}</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{order.product_model ? order.product_model.model_name : 'Unknown Model'}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{order.product_model && order.product_model.category ? order.product_model.category.name : ''}</div>
                      </td>
                      <td>
                        <StepBar currentStatus={order.current_status} />
                      </td>
                      <td>
                        <div style={{ fontSize: '0.85rem', fontWeight: 500 }}>{order.physical_location}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--accent-blue)', marginTop: '2px' }}>
                          ETA: {order.eta ? new Date(order.eta).toLocaleDateString() : '미정'}
                        </div>
                      </td>
                      <td>
                        {order.current_status === 'IN_STOCK' ? (
                          <span className="status-badge" style={{ background: 'hsla(142, 76%, 46%, 0.2)', color: 'var(--status-stock)' }}>
                            <CheckCircle2 size={14} /> 즉시 출고 가능
                          </span>
                        ) : currentRole !== 'DEALER' ? (
                          <button
                            onClick={() => handleNextStatus(order.id, order.current_status)}
                            className="btn btn-outline"
                            style={{ padding: '3px 4px', fontSize: '10px', justifyContent: 'center', borderColor: 'var(--accent-blue)', color: 'var(--accent-blue)' }}
                            title="다음 배송 단계로 즉시 이동합니다."
                          >
                            <span>다음 단계로</span>
                            <ChevronsRight size={14} />
                          </button>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>운송 진행 중...</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Zone 3: 가용 재고 현황 (Pie Chart + Table / Mobile Responsive) */}
      <div style={{ display: 'grid', gridTemplateColumns: effectiveMobileView ? '1fr' : 'repeat(auto-fit, minmax(450px, 1fr))', gap: '24px' }}>
        <div className="glass-card" style={{ padding: '28px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>Zone 3: 기종별 가용 재고 분포 (IN_STOCK)</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '20px' }}>
            유럽 현지 창고에 보관되어 즉시 출고 가능한 기계 모델들의 비율입니다. (단가 정보는 딜러 정책상 차단됨)
          </p>

          <div style={{ flex: 1, minHeight: '280px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {pieData.length === 0 ? (
              <div style={{ color: 'var(--text-muted)' }}>현재 입고 완료(IN_STOCK) 상태인 장비가 없습니다.</div>
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
          <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>즉시 할당 가능 장비 목록 (ATP List)</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '20px' }}>
            원하는 모델을 선택하고 '소프트 할당' 또는 즉시 주문을 요청할 수 있습니다.
          </p>

          {effectiveMobileView ? (
            /* 모바일 카드 형태의 ATP List */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
              {inStockOrders.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>즉시 할당 가능한 재고가 없습니다.</div>
              ) : (
                inStockOrders.map(o => (
                  <div key={o.id} style={{ background: 'var(--bg-secondary)', padding: '14px', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                        {o.product_model ? o.product_model.model_name : 'Unknown'}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)' }}>S/N: {o.serial_number}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>구역: {o.physical_location}</div>
                    </div>
                    <button
                      onClick={() => alert(`[${o.product_model ? o.product_model.model_name : o.reference_no}] 기계의 즉시 할당 요청이 접수되었습니다!`)}
                      className="btn btn-primary"
                      style={{ padding: '6px 14px', fontSize: '0.8rem' }}
                    >
                      즉시 할당 신청
                    </button>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="data-table-container full-bleed" style={{ flex: 1 }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>모델명</th>
                    <th>시리얼 번호 (S/N)</th>
                    <th>보관 구역</th>
                    <th>할당 요청</th>
                  </tr>
                </thead>
                <tbody>
                  {inStockOrders.length === 0 ? (
                    <tr><td colSpan={4} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>즉시 할당 가능한 재고가 없습니다.</td></tr>
                  ) : (
                    inStockOrders.map(o => (
                      <tr key={o.id}>
                        <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                          {o.product_model ? o.product_model.model_name : 'Unknown'}
                        </td>
                        <td style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)' }}>{o.serial_number}</td>
                        <td style={{ fontSize: '0.8rem' }}>{o.physical_location}</td>
                        <td>
                          <button
                            onClick={() => alert(`[${o.product_model ? o.product_model.model_name : o.reference_no}] 기계의 할당 요청이 유럽 법인 SCM팀에 접수되었습니다!`)}
                            className="btn btn-primary"
                            style={{ padding: '4px 12px', fontSize: '0.75rem' }}
                          >
                            즉시 할당 신청
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
    </div>
  );
}

