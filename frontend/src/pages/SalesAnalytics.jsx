import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LabelList, ReferenceLine } from 'recharts';
import { Download, TrendingUp, Monitor, AlertTriangle, Settings, Anchor, Box, BarChart2 } from 'lucide-react';

const COLORS = ['#0A1C8F', '#1F40E6', '#3B5FFF', '#CDAA7D', '#E60012', '#9D62FF', '#16C47F'];

const INITIAL_PLAN_DATA = [
  { month: '1월', plan_eur: 2000000, plan_krw: 31.88, plan_qty: 30, act_eur: 2000000, act_krw: 31.88, act_qty: 31 },
  { month: '2월', plan_eur: 2000000, plan_krw: 31.88, plan_qty: 30, act_eur: 2000000, act_krw: 31.88, act_qty: 32 },
  { month: '3월', plan_eur: 2000000, plan_krw: 31.88, plan_qty: 30, act_eur: 2000000, act_krw: 31.88, act_qty: 30 },
  { month: '4월', plan_eur: 2000000, plan_krw: 31.88, plan_qty: 30, act_eur: 2000000, act_krw: 31.88, act_qty: 30 },
  { month: '5월', plan_eur: 2000000, plan_krw: 31.88, plan_qty: 30, act_eur: 2000000, act_krw: 31.88, act_qty: 32 },
  { month: '6월', plan_eur: 2000000, plan_krw: 31.88, plan_qty: 30, act_eur: 2000000, act_krw: 31.88, act_qty: 30 },
  { month: '7월', plan_eur: 2000000, plan_krw: 31.88, plan_qty: 30, act_eur: 2000000, act_krw: 31.88, act_qty: 31 },
  { month: '8월', plan_eur: 2000000, plan_krw: 31.88, plan_qty: 30, act_eur: null, act_krw: null, act_qty: null },
  { month: '9월', plan_eur: 2000000, plan_krw: 31.88, plan_qty: 30, act_eur: null, act_krw: null, act_qty: null },
  { month: '10월', plan_eur: 2000000, plan_krw: 31.88, plan_qty: 30, act_eur: null, act_krw: null, act_qty: null },
  { month: '11월', plan_eur: 2000000, plan_krw: 31.88, plan_qty: 30, act_eur: null, act_krw: null, act_qty: null },
  { month: '12월', plan_eur: 2000000, plan_krw: 31.88, plan_qty: 30, act_eur: null, act_krw: null, act_qty: null },
];

export default function SalesAnalytics({ isMobileView, isDesktopOptimized }) {
  const [selectedYear1, setSelectedYear1] = useState('2026');
  const [selectedYear2, setSelectedYear2] = useState('2026');
  const [planData, setPlanData] = useState(INITIAL_PLAN_DATA);
  const [isEditingKgi, setIsEditingKgi] = useState(false);
  const [statsData, setStatsData] = useState({
    kpi: { total_orders: 0, in_production: 0, in_shipping: 0, atp: {} },
    model_distribution: [],
    dealer_share: []
  });

  useEffect(() => {
    fetch('/api/stats')
      .then(res => res.json())
      .then(data => {
        setStatsData({
          kpi: {
            total_orders: data.kpi.total_orders || 0,
            in_production: data.kpi.in_production || 0,
            in_shipping: data.kpi.in_shipping || 0,
            atp: data.kpi.atp_by_port || {}
          },
          model_distribution: (data.model_distribution || []).sort((a, b) => b.count - a.count).slice(0, 20),
          dealer_share: (data.dealer_distribution || []).map(d => ({ name: d.dealer, value: d.count })).sort((a, b) => b.value - a.value)
        });
      })
      .catch(err => console.error("Failed to fetch stats data:", err));

    fetch(`/api/business-plans?year=2026`)
      .then(res => res.json())
      .then(data => {
        if (data && data.length > 0) {
          const updatedPlan = INITIAL_PLAN_DATA.map((initial) => {
            const found = data.find(d => d.month === initial.month);
            return found ? { ...initial, ...found } : initial;
          });
          setPlanData(updatedPlan);
        }
      })
      .catch(err => console.error("Failed to fetch KGI data:", err));
  }, []);

  const formatNumber = (num) => (num || num === 0) ? num.toLocaleString() : '-';

  const handlePlanEurChange = (index, value) => {
    const numericValue = value.replace(/[^0-9]/g, '');
    const newEur = numericValue ? Number(numericValue) : 0;
    const newKrw = Number((newEur * 1594 / 100000000).toFixed(2));

    const newData = [...planData];
    newData[index] = { ...newData[index], plan_eur: newEur, plan_krw: newKrw };
    setPlanData(newData);
  };

  const handlePlanQtyChange = (index, value) => {
    const numericValue = value.replace(/[^0-9]/g, '');
    const newQty = numericValue ? Number(numericValue) : 0;

    const newData = [...planData];
    newData[index] = { ...newData[index], plan_qty: newQty };
    setPlanData(newData);
  };

  const totalPlanEur = planData.reduce((sum, d) => sum + (d.plan_eur || 0), 0);
  const totalPlanKrw = planData.reduce((sum, d) => sum + (d.plan_krw || 0), 0).toFixed(2);
  const totalPlanQty = planData.reduce((sum, d) => sum + (d.plan_qty || 0), 0);
  const totalActEur = planData.reduce((sum, d) => sum + (d.act_eur || 0), 0);
  const totalActKrw = planData.reduce((sum, d) => sum + (d.act_krw || 0), 0).toFixed(2);
  const totalActQty = planData.reduce((sum, d) => sum + (d.act_qty || 0), 0);

  const currentMonthStr = `${new Date().getMonth() + 1}월`;
  const currentMonthData = planData.find(d => d.month === currentMonthStr) || {};
  const currentPlanEur = currentMonthData.plan_eur || 0;
  const currentActEur = currentMonthData.act_eur || 0;
  const currentPlanQty = currentMonthData.plan_qty || 0;
  const currentActQty = currentMonthData.act_qty || 0;
  const eurRate = currentPlanEur ? ((currentActEur / currentPlanEur) * 100).toFixed(1) : 0;
  const qtyRate = currentPlanQty ? ((currentActQty / currentPlanQty) * 100).toFixed(1) : 0;

  return (
    <div className="page-body">


      {(!isDesktopOptimized || isMobileView) && (
        <div className="desktop-recommend-banner">
          <AlertTriangle size={22} color="var(--status-production)" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <div style={{ fontWeight: 700, marginBottom: '4px', color: 'var(--status-production)' }}>
              🖥️ PC 데스크탑 화면(1024px 이상) 권장 안내
            </div>
            <p style={{ lineHeight: 1.5, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              현재 페이지는 V8 설계 가이드에 따라 다차원 차트 및 사업계획 테이블을 제공하는 관리자 전용 영역으로, 넓은 데스크탑 환경에 최적화되어 있습니다.
            </p>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ paddingTop: '4px', paddingLeft: '28px' }}>
          <h1 style={{ fontSize: '1.8rem', marginBottom: '4px' }}>관리자용 영업 통계 및 분석 (Sales Analytics)</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            유럽 현지 판매 법인의 SCM 효율화 및 실적, 목표 달성률을 종합적으로 모니터링합니다. (V8)
          </p>
        </div>
        <div>
          <button className="btn btn-primary" onClick={() => window.print()}>
            <Download size={16} />
            <span>보고서 다운로드</span>
          </button>
        </div>
      </div>

      {/* Cards 1~4 */}
      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        {/* Card 1 */}
        <div className="glass-card kpi-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="kpi-title">카드 1: 총 발주 대수</span>
            <img src="/assets/card1.png" alt="Card 1" width="32" height="32" />
          </div>
          <div className="kpi-value">{formatNumber(statsData.kpi.total_orders)} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>대</span></div>
        </div>

        {/* Card 2 */}
        <div className="glass-card kpi-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="kpi-title">카드 2: 생산 중 장비</span>
            <img src="/assets/card2.png" alt="Card 2" width="32" height="32" />
          </div>
          <div className="kpi-value" style={{ color: 'var(--status-production)' }}>{formatNumber(statsData.kpi.in_production)} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>대</span></div>
        </div>

        {/* Card 3 */}
        <div className="glass-card kpi-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="kpi-title">카드 3: 운송 중 장비</span>
            <Anchor color="var(--status-ready)" size={24} />
          </div>
          <div className="kpi-value" style={{ color: 'var(--status-ready)' }}>{formatNumber(statsData.kpi.in_shipping)} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>대</span></div>
        </div>

        {/* Card 4 */}
        <div className="glass-card kpi-card" style={{ paddingBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span className="kpi-title">카드 4: 현지 창고 가용 재고 (ATP)</span>
            <Box color="var(--status-stock)" size={24} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {Object.keys(statsData.kpi.atp).length > 0 ? (
              Object.entries(statsData.kpi.atp).map(([port, count]) => (
                <div key={port} style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{port}:</span>
                  <span style={{ fontWeight: 600 }}>{count}대</span>
                </div>
              ))
            ) : (
              <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>현재 가용 재고 없음</div>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))', gap: '24px', marginBottom: '24px' }}>
        {/* Card 5 */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '4px' }}>카드 5: 기종별 베스트셀러 및 판매 점유율</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>가장 많이 팔린 장비 대수 (최상위 배치)</p>
            </div>
            <select
              value={selectedYear1}
              onChange={e => setSelectedYear1(e.target.value)}
              style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', padding: '6px 12px', borderRadius: '6px' }}
            >
              <option value="2026">2026년</option>
              <option value="2025">2025년</option>
            </select>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart layout="vertical" data={statsData.model_distribution} margin={{ top: 5, right: 50, left: 20, bottom: 5 }}>
              <XAxis type="number" hide />
              <YAxis dataKey="model" type="category" width={120} tickLine={false} axisLine={false} interval={0} tick={{ fontSize: 12, fill: 'var(--text-primary)', fontWeight: 500, textAnchor: 'end' }} />
              <Tooltip cursor={false} contentStyle={{ borderRadius: '8px', border: '1px solid var(--border-color)' }} />
              <Bar dataKey="count" radius={[0, 8, 8, 0]} barSize={10} name="판매 대수">
                {statsData.model_distribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={[
                    '#74E5F2', '#74E5F2', '#A8E890', '#A8E890', '#FFD369',
                    '#FFD369', '#FF8E4F', '#FF597B', '#FF597B', '#FF597B',
                    '#FF8E4F', '#FF8E4F', '#FCE38A', '#FCE38A', '#FFD369'
                  ][index] || '#FFD369'} />
                ))}
                <LabelList dataKey="count" position="right" fill="var(--text-secondary)" fontSize={12} formatter={(val) => `${val}대`} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Card 6 */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '4px' }}>카드 6: 딜러/지역별 판매 비중</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>좌측: 도넛 (전체 비중 색상), 우측: 발주 점유율 상위 10개 업체</p>
            </div>
            <select
              value={selectedYear2}
              onChange={e => setSelectedYear2(e.target.value)}
              style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', padding: '6px 12px', borderRadius: '6px' }}
            >
              <option value="2026">2026년</option>
              <option value="2025">2025년</option>
            </select>
          </div>

          <div style={{ display: 'flex', height: '280px', gap: '16px' }}>
            <div style={{ flex: '1', minWidth: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statsData.dealer_share}
                    cx="50%" cy="50%"
                    innerRadius={50} outerRadius={80}
                    dataKey="value"
                    stroke="none"
                  >
                    {statsData.dealer_share.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: 'var(--shadow-lg)' }} formatter={(value) => [`${value}대`, '판매량']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ flex: '1.5', minWidth: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart layout="vertical" data={statsData.dealer_share} margin={{ top: 5, right: 10, left: 50, bottom: 5 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" width={160} tickLine={false} axisLine={false} interval={0} tick={{ fontSize: 11, fill: 'var(--text-secondary)', textAnchor: 'end' }} />
                  <Tooltip cursor={false} contentStyle={{ borderRadius: '8px' }} />
                  <Bar dataKey="value" radius={[10, 10, 10, 10]} barSize={20} name="판매 비중(대수)">
                    {statsData.dealer_share.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={[
                        '#B2F442', '#77C815', '#77C815', '#B2F442', '#77C815',
                        '#488710', '#488710', '#488710', '#77C815', '#488710'
                      ][index] || '#488710'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Card 7 */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <BarChart2 color="var(--accent-purple)" size={24} />
          <h3 style={{ fontSize: '1.3rem' }}>카드 7: 법인 월별 수주실적 및 목표 달성률</h3>
        </div>

        {/* Current Month Progress (Moved to Top) */}
        <div style={{ background: 'var(--bg-secondary)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color)', marginBottom: '24px' }}>
          <h4 style={{ fontSize: '1.1rem', margin: 0, marginBottom: '20px' }}>KPI : {currentMonthStr} 실적 및 목표 달성률 상세</h4>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '20px', marginBottom: '24px' }}>
            <div style={{ background: 'var(--bg-card)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>현재 월</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 'bold', marginTop: '4px' }}>{currentMonthStr}</div>
            </div>
            <div style={{ background: 'var(--bg-card)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>현재 실적 (수주액)</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--wia-blue-vibrant)', marginTop: '4px' }}>€{formatNumber(currentActEur)}</div>
            </div>
            <div style={{ background: 'var(--bg-card)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>수주 목표 금액</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 'bold', marginTop: '4px' }}>€{formatNumber(currentPlanEur)}</div>
            </div>
            <div style={{ background: 'var(--bg-card)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>현재 수주 대수</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'var(--wia-blue-vibrant)', marginTop: '4px' }}>{currentActQty}대</div>
            </div>
            <div style={{ background: 'var(--bg-card)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>수주 목표 수량</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 'bold', marginTop: '4px' }}>{currentPlanQty}대</div>
            </div>
          </div>

          <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>수주액 달성률 (진행률)</span>
                <span style={{ fontWeight: 700, color: 'var(--wia-blue-vibrant)' }}>{eurRate}%</span>
              </div>
              <div style={{ width: '100%', height: '14px', background: 'var(--bg-secondary)', borderRadius: '7px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                <div style={{ width: `${Math.min(eurRate, 100)}%`, height: '100%', background: 'linear-gradient(90deg, var(--wia-blue), var(--wia-blue-light))' }} />
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>수주대수 달성률 (진행률)</span>
                <span style={{ fontWeight: 700, color: 'var(--status-stock)' }}>{qtyRate}%</span>
              </div>
              <div style={{ width: '100%', height: '14px', background: 'var(--bg-secondary)', borderRadius: '7px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                <div style={{ width: `${Math.min(qtyRate, 100)}%`, height: '100%', background: 'linear-gradient(90deg, #10b981, #34d399)' }} />
              </div>
            </div>
          </div>
        </div>

        {/* 2026 Table from PDF (Moved to Bottom, 80% Scale applied) */}
        <div style={{ background: 'var(--bg-secondary)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h4 style={{ fontSize: '1.1rem', margin: 0 }}>KGI : 유럽법인 사업계획 - 2026년</h4>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ color: 'var(--text-muted)', fontWeight: 'normal', fontSize: '0.9rem' }}>사업환율 적용: 1594원 / EUR</span>
              <button
                className="btn btn-primary"
                style={{ padding: '4px 12px', fontSize: '0.85rem' }}
                onClick={async () => {
                  if (isEditingKgi) {
                    try {
                      await fetch(`/api/business-plans/2026`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(planData.map(d => ({
                          year: 2026,
                          month: d.month,
                          plan_eur: d.plan_eur,
                          plan_krw: d.plan_krw,
                          plan_qty: d.plan_qty,
                          act_eur: d.act_eur,
                          act_krw: d.act_krw,
                          act_qty: d.act_qty,
                        })))
                      });
                    } catch (error) {
                      console.error('Save error', error);
                      alert('저장에 실패했습니다.');
                    }
                  }
                  setIsEditingKgi(!isEditingKgi);
                }}
              >
                {isEditingKgi ? 'Save' : 'Edit'}
              </button>
            </div>
          </div>

          <div className="data-table-container" style={{ border: '1px solid var(--border-color)', borderRadius: '8px', zoom: 0.8, overflowX: 'auto', background: 'var(--bg-card)' }}>
            <table className="data-table" style={{ fontSize: '0.85rem', minWidth: '1000px', width: '100%', margin: 0 }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'center', borderRight: '1px solid var(--border-color)' }}>구분</th>
                  <th style={{ textAlign: 'center', borderRight: '1px solid var(--border-color)' }}>단위</th>
                  {planData.map(d => <th key={d.month} style={{ textAlign: 'right' }}>{d.month}</th>)}
                  <th style={{ textAlign: 'right', background: 'rgba(230,0,18,0.05)' }}>총합</th>
                </tr>
              </thead>
              <tbody>
                {/* 사업계획 */}
                <tr>
                  <td rowSpan={3} style={{ textAlign: 'center', fontWeight: 'bold', borderRight: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}>사업계획</td>
                  <td style={{ borderRight: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}>유로(EUR)</td>
                  {planData.map((d, i) => (
                    <td key={i} style={{ textAlign: 'right', padding: isEditingKgi ? '4px' : undefined }}>
                      {isEditingKgi ? (
                        <input
                          type="text"
                          value={d.plan_eur || ''}
                          onChange={(e) => handlePlanEurChange(i, e.target.value)}
                          style={{ width: '100%', minWidth: '70px', textAlign: 'right', padding: '4px', border: '1px solid var(--border-color)', borderRadius: '4px', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                        />
                      ) : (
                        formatNumber(d.plan_eur)
                      )}
                    </td>
                  ))}
                  <td style={{ textAlign: 'right', fontWeight: 'bold', background: 'rgba(230,0,18,0.05)' }}>{formatNumber(totalPlanEur)}</td>
                </tr>
                <tr>
                  <td style={{ borderRight: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}>억원(KRW)</td>
                  {planData.map((d, i) => <td key={i} style={{ textAlign: 'right' }}>{d.plan_krw}</td>)}
                  <td style={{ textAlign: 'right', fontWeight: 'bold', background: 'rgba(230,0,18,0.05)' }}>{formatNumber(Number(totalPlanKrw))}</td>
                </tr>
                <tr>
                  <td style={{ borderRight: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}>대수</td>
                  {planData.map((d, i) => (
                    <td key={i} style={{ textAlign: 'right', padding: isEditingKgi ? '4px' : undefined }}>
                      {isEditingKgi ? (
                        <input
                          type="text"
                          value={d.plan_qty || ''}
                          onChange={(e) => handlePlanQtyChange(i, e.target.value)}
                          style={{ width: '100%', minWidth: '40px', textAlign: 'right', padding: '4px', border: '1px solid var(--border-color)', borderRadius: '4px', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                        />
                      ) : (
                        formatNumber(d.plan_qty)
                      )}
                    </td>
                  ))}
                  <td style={{ textAlign: 'right', fontWeight: 'bold', background: 'rgba(230,0,18,0.05)' }}>{formatNumber(totalPlanQty)}</td>
                </tr>
                {/* 법인 실적 */}
                <tr>
                  <td rowSpan={5} style={{ textAlign: 'center', fontWeight: 'bold', borderRight: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}>법인</td>
                  <td style={{ borderRight: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}>유로(EUR)</td>
                  {planData.map((d, i) => <td key={i} style={{ textAlign: 'right', color: 'var(--wia-blue-vibrant)' }}>{formatNumber(d.act_eur)}</td>)}
                  <td style={{ textAlign: 'right', fontWeight: 'bold', color: 'var(--wia-blue-vibrant)', background: 'rgba(230,0,18,0.05)' }}>{formatNumber(totalActEur)}</td>
                </tr>
                <tr>
                  <td style={{ borderRight: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}>억원(KRW)</td>
                  {planData.map((d, i) => <td key={i} style={{ textAlign: 'right', color: 'var(--wia-blue-vibrant)' }}>{d.act_krw}</td>)}
                  <td style={{ textAlign: 'right', fontWeight: 'bold', color: 'var(--wia-blue-vibrant)', background: 'rgba(230,0,18,0.05)' }}>{formatNumber(Number(totalActKrw))}</td>
                </tr>
                <tr>
                  <td style={{ borderRight: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}>대수</td>
                  {planData.map((d, i) => <td key={i} style={{ textAlign: 'right', color: 'var(--wia-blue-vibrant)' }}>{d.act_qty}</td>)}
                  <td style={{ textAlign: 'right', fontWeight: 'bold', color: 'var(--wia-blue-vibrant)', background: 'rgba(230,0,18,0.05)' }}>{formatNumber(totalActQty)}</td>
                </tr>
                <tr>
                  <td style={{ borderRight: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}>수주액 달성률(%)</td>
                  {planData.map((d, i) => {
                    if (!d.act_eur || !d.plan_eur) return <td key={i}></td>;
                    const rate = ((d.act_eur / d.plan_eur) * 100).toFixed(1);
                    return <td key={i} style={{ textAlign: 'right', fontWeight: 'bold' }}>{rate}%</td>;
                  })}
                  <td style={{ textAlign: 'right', fontWeight: 'bold', background: 'rgba(230,0,18,0.05)' }}>{totalPlanEur ? ((totalActEur / totalPlanEur) * 100).toFixed(1) : 0}%</td>
                </tr>
                <tr>
                  <td style={{ borderRight: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}>수주대수 달성률(%)</td>
                  {planData.map((d, i) => {
                    if (!d.act_qty || !d.plan_qty) return <td key={i}></td>;
                    const rate = ((d.act_qty / d.plan_qty) * 100).toFixed(1);
                    return <td key={i} style={{ textAlign: 'right', fontWeight: 'bold' }}>{rate}%</td>;
                  })}
                  <td style={{ textAlign: 'right', fontWeight: 'bold', background: 'rgba(230,0,18,0.05)' }}>{totalPlanQty ? ((totalActQty / totalPlanQty) * 100).toFixed(1) : 0}%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
