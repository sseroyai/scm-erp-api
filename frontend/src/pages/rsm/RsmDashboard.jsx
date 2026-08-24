import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Ship, Package, TrendingUp, Clock, PieChart as PieChartIcon } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function RsmDashboard({ isMobileView, currentUserId }) {
  const { t } = useTranslation();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/orders');
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
    fetchOrders();
  }, []);

  // 1. 월별 수주 실적 (가상의 월별 데이터로 그룹핑)
  const monthlyData = [
    { month: 'Jan', orders: 12 },
    { month: 'Feb', orders: 19 },
    { month: 'Mar', orders: 15 },
    { month: 'Apr', orders: 22 },
    { month: 'May', orders: 28 },
    { month: 'Jun', orders: 25 },
  ];

  // 2. 프로모션 장비 예약 달성률
  const promotionData = [
    { name: 'Reserved', value: 45 },
    { name: 'Available', value: 55 },
  ];
  const COLORS = ['var(--accent-pink)', 'var(--bg-secondary)'];

  // 3. 파이프라인별 체류 리드타임
  const leadTimeData = [
    { stage: 'Production', days: 14 },
    { stage: 'In Transit', days: 30 },
    { stage: 'Port', days: 5 },
    { stage: 'In Stock', days: 12 },
  ];

  // KPI 요약 수치
  const activeCount = orders.filter(o => !['SOLD', 'DISPATCHED'].includes(o.current_status)).length;
  const shippingCount = orders.filter(o => o.current_status === 'SHIPPING').length;
  const readyCount = orders.filter(o => o.current_status === 'IN_STOCK').length;

  return (
    <div className="page-body">
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.8rem', marginBottom: '4px' }}>RSM Portal Dashboard</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          Overview of dealer performance and pipeline metrics
        </p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Loading metrics...</div>
      ) : (
        <>
          <div className="kpi-grid" style={{ marginBottom: '24px' }}>
            <div className="glass-card kpi-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="kpi-title">Active Orders</span>
                <Package color="var(--accent-cyan)" size={24} />
              </div>
              <div className="kpi-value">{activeCount} <span style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--text-muted)' }}>Units</span></div>
            </div>

            <div className="glass-card kpi-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="kpi-title">In Transit</span>
                <Ship color="var(--accent-blue)" size={24} />
              </div>
              <div className="kpi-value">{shippingCount} <span style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--text-muted)' }}>Units</span></div>
            </div>

            <div className="glass-card kpi-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="kpi-title">Ready in Stock</span>
                <Package color="var(--status-stock)" size={24} />
              </div>
              <div className="kpi-value" style={{ color: 'var(--status-stock)' }}>{readyCount} <span style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--text-muted)' }}>Units</span></div>
            </div>
          </div>

          {/* Charts Section */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobileView ? '1fr' : 'repeat(3, 1fr)', gap: '24px', marginBottom: '24px' }}>
            
            {/* Chart 1 */}
            <div className="glass-card" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <TrendingUp size={20} color="var(--accent-cyan)" />
                월별 수주 실적 (Monthly Orders)
              </h3>
              <div style={{ height: '250px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                    <XAxis dataKey="month" stroke="var(--text-secondary)" />
                    <YAxis stroke="var(--text-secondary)" />
                    <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px' }} />
                    <Bar dataKey="orders" fill="var(--accent-cyan)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2 */}
            <div className="glass-card" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <PieChartIcon size={20} color="var(--accent-pink)" />
                프로모션 달성률 (Promo Achieved)
              </h3>
              <div style={{ height: '250px', display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={promotionData}
                      innerRadius={70}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {promotionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ position: 'absolute', textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>45%</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Reserved</div>
                </div>
              </div>
            </div>

            {/* Chart 3 */}
            <div className="glass-card" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={20} color="var(--accent-blue)" />
                파이프라인 리드타임 (Lead Time)
              </h3>
              <div style={{ height: '250px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={leadTimeData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                    <XAxis type="number" stroke="var(--text-secondary)" />
                    <YAxis dataKey="stage" type="category" stroke="var(--text-secondary)" width={80} />
                    <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px' }} />
                    <Bar dataKey="days" fill="var(--accent-blue)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>

          {/* Active Pipeline Table */}
          <div className="glass-card" style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '16px' }}>Active Pipeline (Dealers)</h3>
            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Model</th>
                    <th>S/N</th>
                    <th>Dealer</th>
                    <th>Status</th>
                    <th>Update Date</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.filter(o => !['SOLD'].includes(o.current_status)).slice(0, 10).map(o => (
                    <tr key={o.id}>
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {o.product_model ? o.product_model.model_name : o.reference_no}
                      </td>
                      <td style={{ color: 'var(--accent-cyan)' }}>{o.serial_number || '-'}</td>
                      <td>{o.dealer_company ? o.dealer_company.name : '-'}</td>
                      <td>
                        <span className={`status-badge status-${o.current_status.toLowerCase()}`}>
                          {o.current_status.replace('_', ' ')}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-muted)' }}>
                        {o.history && o.history.length > 0 
                          ? new Date(o.history[0].changed_at).toLocaleDateString()
                          : '-'}
                      </td>
                    </tr>
                  ))}
                  {orders.length === 0 && (
                    <tr><td colSpan={5} style={{ textAlign: 'center', padding: '24px' }}>No active orders</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
