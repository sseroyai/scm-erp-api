import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Ship, Calendar, Package } from 'lucide-react';

const COLORS = ['#06b6d4', '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899'];

export default function DealerDashboard({ isMobileView }) {
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

  const shippingCount = orders.filter(o => o.current_status === 'SHIPPING').length;
  
  const now = new Date();
  const currentMonthCount = orders.filter(o => {
    if (!o.eta) return false;
    const etaDate = new Date(o.eta);
    return etaDate.getMonth() === now.getMonth() && etaDate.getFullYear() === now.getFullYear();
  }).length;

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
        <h1 style={{ fontSize: '1.8rem', marginBottom: '4px' }}>딜러 포털 현황판</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          AK MAKINA 님의 내 주문 현황 요약 및 유럽 법인 전체 가용 재고 현황입니다.
        </p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>로딩 중...</div>
      ) : (
        <>
          <div className="kpi-grid">
            <div className="glass-card kpi-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="kpi-title">운송 중 내 장비 (SHIPPING)</span>
                <Ship color="var(--accent-cyan)" size={24} />
              </div>
              <div className="kpi-value">{shippingCount} <span style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--text-muted)' }}>대</span></div>
              <div className="kpi-desc">해상 운송 중인 내 주문</div>
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
              <div className="kpi-value" style={{ color: 'var(--status-stock)' }}>{atpOrders.length} <span style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--text-muted)' }}>대</span></div>
              <div className="kpi-desc">전체 딜러망 가용 즉시 출고 가능 대수</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: isMobileView ? '1fr' : 'repeat(auto-fit, minmax(450px, 1fr))', gap: '24px' }}>
            <div className="glass-card" style={{ padding: '28px', display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>기종별 가용 재고 분포 (Pie Chart)</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '20px' }}>
                유럽 현지 창고에 보관되어 즉시 할당 신청이 가능한 기계 모델 분포입니다.
              </p>
              
              <div style={{ flex: 1, minHeight: '280px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {pieData.length === 0 ? (
                  <div style={{ color: 'var(--text-muted)' }}>현재 가용(AVAILABLE) 상태인 장비가 없습니다.</div>
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
                원하는 모델을 선택하여 즉시 출고(소프트 할당)를 관리자에게 요청할 수 있습니다.
              </p>

              {isMobileView ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
                  {atpOrders.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>즉시 할당 가능한 재고가 없습니다.</div>
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
                          즉시 할당 신청
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
                        <th>모델명</th>
                        <th>시리얼 번호 (S/N)</th>
                        <th>보관 구역</th>
                        <th>액션</th>
                      </tr>
                    </thead>
                    <tbody>
                      {atpOrders.length === 0 ? (
                        <tr><td colSpan={4} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>즉시 할당 가능한 재고가 없습니다.</td></tr>
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
        </>
      )}
    </div>
  );
}
