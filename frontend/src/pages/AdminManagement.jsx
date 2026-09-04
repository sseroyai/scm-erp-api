import React, { useState, useEffect } from 'react';
import { FileSpreadsheet, Tag, Mail, Upload, CheckCircle, Clock, CheckCircle2, AlertCircle, RefreshCw, Monitor, AlertTriangle, Plus, X, ShoppingCart } from 'lucide-react';

export default function AdminManagement({ isMobileView, isDesktopOptimized }) {
  const [promotions, setPromotions] = useState([]);
  const [dealers, setDealers] = useState([]);
  const [emailConfigs, setEmailConfigs] = useState([]);
  const [productModels, setProductModels] = useState([]);
  const [ncCodes, setNcCodes] = useState([]);
  const [incotermCodes, setIncotermCodes] = useState([]);
  const [portCodes, setPortCodes] = useState([]);
  const [loading, setLoading] = useState(true);

  // 단건 발주 생성 상태
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newOrderForm, setNewOrderForm] = useState({
    reference_no: '',
    product_model_id: '',
    dealer_company_id: '',
    nc: '',
    incoterms: '',
    destination_port: ''
  });
  const [creatingOrder, setCreatingOrder] = useState(false);

  // 엑셀 업로드 상태
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadResult, setUploadResult] = useState(null);
  const [uploading, setUploading] = useState(false);

  // 프로모션 예약 입력 폼 상태
  const [reservingId, setReservingId] = useState(null);
  const [selectedDealerId, setSelectedDealerId] = useState('');
  const [reservedUntilDays, setReservedUntilDays] = useState(7);

  // 프로모션 최종 판매 완료 입력 폼 상태
  const [sellingId, setSellingId] = useState(null);
  const [finalBuyerDealerId, setFinalBuyerDealerId] = useState('');

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [promoRes, dealerRes, emailRes, modelsRes, ncRes, incotermRes, portRes] = await Promise.all([
        fetch('/api/promotions'),
        fetch('/api/dealers'),
        fetch('/api/email-configs'),
        fetch('/api/models'),
        fetch('/api/master-data/nc-codes'),
        fetch('/api/master-data/incoterm-codes'),
        fetch('/api/master-data/port-codes')
      ]);
      setPromotions(await promoRes.json());
      setDealers(await dealerRes.json());
      setEmailConfigs(await emailRes.json());
      setProductModels(await modelsRes.json());
      setNcCodes(await ncRes.json());
      setIncotermCodes(await incotermRes.json());
      setPortCodes(await portRes.json());
    } catch (e) {
      console.error("Management data fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    if (!newOrderForm.reference_no || !newOrderForm.product_model_id || !newOrderForm.dealer_company_id) {
      return alert("필수 항목을 모두 입력해주세요.");
    }

    setCreatingOrder(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reference_no: newOrderForm.reference_no,
          product_model_id: Number(newOrderForm.product_model_id),
          dealer_company_id: Number(newOrderForm.dealer_company_id),
          nc: newOrderForm.nc,
          incoterms: newOrderForm.incoterms,
          destination_port: newOrderForm.destination_port
        })
      });

      if (res.ok) {
        alert("신규 발주가 성공적으로 생성되었습니다.");
        setShowCreateModal(false);
        setNewOrderForm({ reference_no: '', product_model_id: '', dealer_company_id: '', nc: '', incoterms: '', destination_port: '' });
      } else {
        const err = await res.json();
        alert(`생성 실패: ${err.detail || '알 수 없는 오류'}`);
      }
    } catch (err) {
      alert("서버 통신 오류가 발생했습니다.");
    } finally {
      setCreatingOrder(false);
    }
  };

  // 1. 엑셀 파일 업로드 처리
  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) return alert("업로드할 엑셀 파일(.xlsx)을 선택해주세요.");

    setUploading(true);
    setUploadResult(null);
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const res = await fetch('/api/upload/excel', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      setUploadResult(data);
      loadAllData();
    } catch (err) {
      setUploadResult({ status: 'error', message: '서버 통신 중 오류가 발생했습니다.' });
    } finally {
      setUploading(false);
    }
  };

  // 2. 프로모션 기계 '예약중(RESERVED)'으로 전환
  const handleConfirmReserve = async (promoId) => {
    if (!selectedDealerId) return alert("예약할 유럽 현지 딜러사를 선택해주세요.");

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + Number(reservedUntilDays));

    try {
      const res = await fetch(`/api/promotions/${promoId}/reserve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reserved_dealer_id: Number(selectedDealerId),
          reservation_expiry: expiryDate.toISOString()
        })
      });
      if (res.ok) {
        alert("성공적으로 해당 장비가 딜러사 전용 예약(Reserved) 처리되었습니다.");
        setReservingId(null);
        loadAllData();
      } else {
        const err = await res.json();
        alert(err.detail || "예약 처리 실패");
      }
    } catch (e) {
      alert("서버 연결 실패");
    }
  };

  // 3. 프로모션 기계 '판매완료(SOLD)'로 전환
  const handleConfirmSold = async (promoId) => {
    if (!finalBuyerDealerId) return alert("최종 실 구매 딜러사를 선택해주세요.");

    try {
      const res = await fetch(`/api/promotions/${promoId}/sold`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ final_buyer_dealer_id: Number(finalBuyerDealerId) })
      });
      if (res.ok) {
        alert("장기 재고 프로모션 판매가 확정되었습니다! (시리얼 추적 마스터 연동)");
        setSellingId(null);
        setFinalBuyerDealerId('');
        loadAllData();
      } else {
        const err = await res.json();
        alert(err.detail || "판매 처리 실패");
      }
    } catch (e) {
      alert("서버 연결 실패");
    }
  };

  // 4. 자동 ETA 이메일 통지 활성화 토글
  const handleToggleEmailRule = async (configId, currentActive) => {
    try {
      await fetch(`/api/email-configs/${configId}?is_active=${!currentActive}`, {
        method: 'PATCH'
      });
      loadAllData();
    } catch (e) {
      alert("알림 설정 변경 실패");
    }
  };

  return (
    <div className="page-body">
      {/* V6 기기 대응 전략 배지 (Desktop Optimized) */}
      <div style={{ marginBottom: '16px' }}>
        <div className="strategy-badge desktop-optimized" title="구성가이드 V6 설계: 대량 데이터 관리를 위한 PC 데스크탑(1024px 이상) 최적화 전략">
          <Monitor size={16} />
          <span>V6 기기 대응 전략: 내부 SCM 관리자 페이지 (1024px 이상 PC 모니터 데스크탑 최적화)</span>
        </div>
      </div>

      {/* 모바일이나 1024px 미만 좁은 화면 접속 시 PC 권장 안내 배너 표시 */}
      {(!isDesktopOptimized || isMobileView) && (
        <div className="desktop-recommend-banner">
          <AlertTriangle size={22} color="var(--status-production)" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <div style={{ fontWeight: 700, marginBottom: '4px', color: 'var(--status-production)' }}>
              🖥️ PC 데스크탑 화면(1024px 이상) 권장 안내 (Selective Responsive Web)
            </div>
            <p style={{ lineHeight: 1.5, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              현재 페이지는 대량 엑셀 업로드, 복잡한 데이터 그리드 조회 및 영업 통계 분석을 다루는 <strong>내부 SCM 관리자 전용 영역</strong>으로, 넓은 가로 화면(PC 모니터)에 맞춰 쾌적하게 설계되었습니다. 모바일/태블릿 화면에서는 좌우 스크롤을 이용하여 데이터를 안전하게 확인하실 수 있습니다.
            </p>
          </div>
        </div>
      )}

      <div style={{ marginBottom: '28px', paddingTop: '4px', paddingLeft: '28px' }}>
        <h1 style={{ fontSize: '1.8rem', marginBottom: '4px' }}>엑셀 업로드 / 프로모션 / 자동 알림 관리</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          V3~V6 가이드에 확정된 핵심 비즈니스 로직(단건 생성, Pandas 검증 일괄 적재, 장기 재고 예약 전환, ETA 알림 제어)을 총괄 관리합니다.
        </p>
      </div>

      {/* 섹션 0: 단건 주문 생성 */}
      <div className="glass-card" style={{ padding: '28px', marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
          <ShoppingCart color="var(--accent-blue)" size={24} />
          <h2 style={{ fontSize: '1.3rem' }}>신규 단건 발주 생성 (Single Order Creation)</h2>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '20px' }}>
          단일 주문 건에 대해 등록된 기계 모델과 딜러사를 선택하여 실시간으로 발주를 생성합니다.
        </p>

        <button
          onClick={() => setShowCreateModal(true)}
          className="btn btn-primary"
          style={{ padding: '10px 20px', fontSize: '0.95rem' }}
        >
          <Plus size={18} />
          <span>신규 단건 발주 생성하기</span>
        </button>
      </div>

      {/* 섹션 1: 엑셀 일괄 업로드 (Excel Bulk Upload via Pandas) */}
      <div className="glass-card" style={{ padding: '28px', marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
          <FileSpreadsheet color="var(--accent-cyan)" size={24} />
          <h2 style={{ fontSize: '1.3rem' }}>Pandas 기반 대량 주문 및 정기 계약 엑셀 일괄 적재 (Excel Bulk Upload)</h2>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '20px' }}>
          수백 건의 단발성/대량 주문(MTS) 데이터를 표준 템플릿(XLSX)으로 적재하며, 백엔드 Python Pandas 엔진이 실시간으로 헤더 정합성 및 딜러/모델 존재 여부를 검수합니다.
        </p>

        <form onSubmit={handleFileUpload} style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', background: 'var(--bg-secondary)', padding: '20px', borderRadius: '12px', border: '1px dashed var(--border-color)' }}>
          <input
            type="file"
            accept=".xlsx, .xls"
            onChange={e => setSelectedFile(e.target.files[0])}
            style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}
          />
          <button type="submit" disabled={uploading || !selectedFile} className="btn btn-primary">
            <Upload size={16} />
            <span>{uploading ? 'Pandas 데이터 정합성 검사 및 적재 중...' : '엑셀 일괄 업로드 실행'}</span>
          </button>

          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            * 표준 헤더: <code>MODEL, NC, P/O, DEALER, ORDER DATE, DETAIL SPEC, BUYING, INCOTERMS, PORT</code>
          </div>
        </form>

        {/* 업로드 검증 결과 알림바 */}
        {uploadResult && (
          <div style={{
            marginTop: '16px', padding: '16px', borderRadius: '10px',
            background: uploadResult.status === 'success' ? 'hsla(142, 76%, 46%, 0.15)' : 'hsla(24, 95%, 53%, 0.15)',
            border: `1px solid ${uploadResult.status === 'success' ? 'var(--status-stock)' : 'var(--status-shipping)'}`
          }}>
            <div style={{ fontWeight: 700, marginBottom: '6px', color: uploadResult.status === 'success' ? 'var(--status-stock)' : 'var(--status-shipping)' }}>
              {uploadResult.message}
            </div>
            {uploadResult.errors && uploadResult.errors.length > 0 && (
              <ul style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', paddingLeft: '20px', maxHeight: '120px', overflowY: 'auto' }}>
                {uploadResult.errors.map((err, i) => <li key={i}>{err}</li>)}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* 섹션 2: 장기 재고 프로모션 및 실시간 예약 관리 (Promotion & Reservation) */}
      <div className="glass-card" style={{ padding: '28px', marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
          <Tag color="var(--status-production)" size={24} />
          <h2 style={{ fontSize: '1.3rem' }}>장기 재고 프로모션 및 실시간 예약 관리 (Promotion & Reservation)</h2>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '20px' }}>
          3년 이상 장기 보관된 특별 재고 및 한정 기종의 상태를 <code>판매가능(Available) ➔ 예약중(Reserved) ➔ 판매완료(Sold)</code> 순으로 엄격히 관리합니다.
        </p>

        <div className="data-table-container full-bleed">
          <table className="data-table">
            <thead>
              <tr>
                <th>프로모션 기종</th>
                <th>Ref No. / S/N</th>
                <th>현재 프로모션 진행 상태</th>
                <th>할당/예약 정보 (만료일 및 구매자)</th>
                <th>상태 제어 작업</th>
              </tr>
            </thead>
            <tbody>
              {promotions.map(promo => (
                <tr key={promo.id}>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      {promo.order && promo.order.product_model ? promo.order.product_model.model_name : 'Unknown'} 프로모션
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>
                      {(promo.order && promo.order.reference_no) || 'F26-88-30'}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      {(promo.order && promo.order.serial_number) || 'G8888-8888'}
                    </div>
                  </td>
                  <td>
                    {promo.status === 'AVAILABLE' && <span className="status-badge" style={{ background: 'hsla(190, 95%, 49%, 0.2)', color: 'var(--accent-cyan)' }}><CheckCircle size={14} /> 판매가능 (AVAILABLE)</span>}
                    {promo.status === 'RESERVED' && <span className="status-badge" style={{ background: 'hsla(45, 93%, 58%, 0.2)', color: 'var(--status-production)' }}><Clock size={14} /> 예약중 (RESERVED)</span>}
                    {promo.status === 'SOLD' && <span className="status-badge" style={{ background: 'hsla(142, 76%, 46%, 0.2)', color: 'var(--status-stock)' }}><CheckCircle2 size={14} /> 판매완료 (SOLD)</span>}
                  </td>
                  <td style={{ fontSize: '0.8rem' }}>
                    {promo.status === 'RESERVED' && (
                      <div>
                        <span style={{ color: 'var(--accent-cyan)' }}>예약 딜러: {promo.reserved_dealer ? promo.reserved_dealer.name : 'Unknown'}</span>
                        <div style={{ color: 'var(--text-muted)' }}>만료: {promo.reservation_expiry ? new Date(promo.reservation_expiry).toLocaleDateString() : ''}</div>
                      </div>
                    )}
                    {promo.status === 'SOLD' && (
                      <div style={{ color: 'var(--status-stock)', fontWeight: 600 }}>
                        최종 구매: {promo.final_buyer_dealer ? promo.final_buyer_dealer.name : 'Unknown'}
                      </div>
                    )}
                    {promo.status === 'AVAILABLE' && <span style={{ color: 'var(--text-muted)' }}>누구나 즉시 예약 신청 가능</span>}
                  </td>
                  <td>
                    {promo.status === 'AVAILABLE' && (
                      reservingId === promo.id ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'var(--bg-secondary)', padding: '10px', borderRadius: '8px' }}>
                          <select
                            value={selectedDealerId}
                            onChange={e => setSelectedDealerId(e.target.value)}
                            style={{ padding: '6px', borderRadius: '6px', background: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', fontSize: '0.75rem' }}
                          >
                            <option value="">-- 예약 딜러사 선택 --</option>
                            {dealers.map(d => <option key={d.id} value={d.id}>{d.name} ({d.country})</option>)}
                          </select>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button onClick={() => handleConfirmReserve(promo.id)} className="btn btn-primary" style={{ padding: '4px 8px', fontSize: '0.75rem' }}>예약 확정</button>
                            <button onClick={() => setReservingId(null)} className="btn btn-outline" style={{ padding: '4px 8px', fontSize: '0.75rem' }}>취소</button>
                          </div>
                        </div>
                      ) : (
                        <button onClick={() => { setReservingId(promo.id); setSelectedDealerId(''); }} className="btn btn-outline" style={{ padding: '6px 12px', fontSize: '0.75rem', borderColor: 'var(--accent-cyan)', color: 'var(--accent-cyan)' }}>
                          딜러사 전용 예약
                        </button>
                      )
                    )}

                    {promo.status === 'RESERVED' && (
                      sellingId === promo.id ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'var(--bg-secondary)', padding: '10px', borderRadius: '8px' }}>
                          <select
                            value={finalBuyerDealerId}
                            onChange={e => setFinalBuyerDealerId(e.target.value)}
                            style={{ padding: '6px', borderRadius: '6px', background: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', fontSize: '0.75rem' }}
                          >
                            <option value="">-- 실 구매 딜러사 선택 --</option>
                            {dealers.map(d => <option key={d.id} value={d.id}>{d.name} ({d.country})</option>)}
                          </select>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button onClick={() => handleConfirmSold(promo.id)} className="btn btn-primary" style={{ padding: '4px 8px', fontSize: '0.75rem' }}>판매 확정</button>
                            <button onClick={() => setSellingId(null)} className="btn btn-outline" style={{ padding: '4px 8px', fontSize: '0.75rem' }}>취소</button>
                          </div>
                        </div>
                      ) : (
                        <button onClick={() => { setSellingId(promo.id); setFinalBuyerDealerId(''); }} className="btn btn-outline" style={{ padding: '6px 12px', fontSize: '0.75rem', borderColor: 'var(--status-stock)', color: 'var(--status-stock)' }}>
                          최종 판매완료 전환
                        </button>
                      )
                    )}

                    {promo.status === 'SOLD' && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>출고 및 사후 AS 이력 이관 완료</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 섹션 3: 주기 조절형 자동 ETA 알림 엔진 스케줄러 (Auto-ETA Email Engine) */}
      <div className="glass-card" style={{ padding: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
          <Mail color="var(--accent-purple)" size={24} />
          <h2 style={{ fontSize: '1.3rem' }}>주기 조절형 자동 ETA 알림 엔진 (Auto-ETA Email Engine Configuration)</h2>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '20px' }}>
          기계의 해상 운송(SHIPPING) 시점 및 항구 도착을 기준으로 주기적인 이메일 통지 규칙(예: 출항 2일 후, 15일 후 정기 보고)을 세팅하고 온/오프 제어합니다.
        </p>

        <div className="data-table-container full-bleed">
          <table className="data-table">
            <thead>
              <tr>
                <th>통지 단계 (Stage)</th>
                <th>반복 주기 (Interval Days)</th>
                <th>이메일 템플릿 요약</th>
                <th>엔진 스위치 (On/Off)</th>
              </tr>
            </thead>
            <tbody>
              {emailConfigs.map(config => (
                <tr key={config.id}>
                  <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{config.stage}</td>
                  <td>
                    <span style={{ background: 'hsla(217, 91%, 60%, 0.15)', color: 'var(--accent-blue)', padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600 }}>
                      {config.interval_days ? `매 ${config.interval_days}일` : '즉시 통지'}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{config.email_template}</td>
                  <td>
                    <button
                      onClick={() => handleToggleEmailRule(config.id, config.is_active)}
                      style={{
                        background: config.is_active ? 'var(--status-stock)' : 'var(--bg-secondary)',
                        color: config.is_active ? 'hsl(222, 47%, 10%)' : 'var(--text-muted)',
                        padding: '6px 16px', borderRadius: '9999px', fontWeight: 700, fontSize: '0.75rem', border: 'none', cursor: 'pointer', transition: 'all 0.2s ease'
                      }}
                    >
                      {config.is_active ? '● 엔진 활성 (Running)' : '○ 비활성화 됨 (Paused)'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 발주 생성 모달 */}
      {showCreateModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: '20px'
        }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '500px', padding: '28px', position: 'relative' }}>
            <button
              onClick={() => setShowCreateModal(false)}
              style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
            >
              <X size={24} />
            </button>
            <h2 style={{ fontSize: '1.4rem', marginBottom: '20px', color: 'var(--text-primary)' }}>신규 단건 발주 생성</h2>

            <form onSubmit={handleCreateOrder} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* 1. MODEL */}
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>기계 모델 검색 및 선택 *</label>
                <input
                  type="text"
                  list="model-list"
                  required
                  placeholder="모델명을 입력하여 검색하세요"
                  value={newOrderForm.model_search_text || ''}
                  onChange={e => {
                    const text = e.target.value;
                    const matchedModel = productModels.find(m => m.model_name === text);
                    setNewOrderForm({
                      ...newOrderForm,
                      model_search_text: text,
                      product_model_id: matchedModel ? matchedModel.id : ''
                    });
                  }}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)' }}
                />
                <datalist id="model-list">
                  {productModels.map(m => (
                    <option key={m.id} value={m.model_name} />
                  ))}
                </datalist>
                {!newOrderForm.product_model_id && newOrderForm.model_search_text && (
                  <div style={{ color: 'var(--status-shipping)', fontSize: '0.8rem', marginTop: '4px' }}>유효한 모델을 목록에서 선택해주세요.</div>
                )}
              </div>

              {/* 2. NC */}
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>NC 검색 및 선택 *</label>
                <input
                  type="text"
                  list="nc-list"
                  required
                  placeholder="NC 코드를 입력하여 검색하세요"
                  value={newOrderForm.nc}
                  onChange={e => setNewOrderForm({ ...newOrderForm, nc: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)' }}
                />
                <datalist id="nc-list">
                  {ncCodes.map(nc => (
                    <option key={nc.nc_code} value={nc.nc_code} />
                  ))}
                </datalist>
              </div>

              {/* 3. P/O */}
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>발주번호 (P/O No.) *</label>
                <input
                  type="text"
                  required
                  placeholder="예: REF-20260731-001"
                  value={newOrderForm.reference_no}
                  onChange={e => setNewOrderForm({ ...newOrderForm, reference_no: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)' }}
                />
              </div>

              {/* 4. DEALER */}
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>딜러사 검색 및 선택 *</label>
                <input
                  type="text"
                  list="dealer-list"
                  required
                  placeholder="딜러사를 입력하여 검색하세요"
                  value={newOrderForm.dealer_search_text || ''}
                  onChange={e => {
                    const text = e.target.value;
                    const matchedDealer = dealers.find(d => d.name === text);
                    setNewOrderForm({
                      ...newOrderForm,
                      dealer_search_text: text,
                      dealer_company_id: matchedDealer ? matchedDealer.id : ''
                    });
                  }}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)' }}
                />
                <datalist id="dealer-list">
                  {dealers.map(d => (
                    <option key={d.id} value={d.name} />
                  ))}
                </datalist>
                {!newOrderForm.dealer_company_id && newOrderForm.dealer_search_text && (
                  <div style={{ color: 'var(--status-shipping)', fontSize: '0.8rem', marginTop: '4px' }}>유효한 딜러사를 목록에서 선택해주세요.</div>
                )}
              </div>

              {/* 5. INCOTERMS */}
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Incoterms 검색 및 선택 *</label>
                <input
                  type="text"
                  list="incoterm-list"
                  required
                  placeholder="Incoterms 코드를 입력하여 검색하세요"
                  value={newOrderForm.incoterms}
                  onChange={e => setNewOrderForm({ ...newOrderForm, incoterms: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)' }}
                />
                <datalist id="incoterm-list">
                  {incotermCodes.map(ic => (
                    <option key={ic.incoterm_code} value={ic.incoterm_code} />
                  ))}
                </datalist>
              </div>

              {/* 6. PORT */}
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>도착지 항구 (Port) 검색 및 선택 *</label>
                <input
                  type="text"
                  list="port-list"
                  required
                  placeholder="항구 코드를 입력하여 검색하세요"
                  value={newOrderForm.destination_port}
                  onChange={e => setNewOrderForm({ ...newOrderForm, destination_port: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)' }}
                />
                <datalist id="port-list">
                  {portCodes.map(pc => (
                    <option key={pc.port_code} value={pc.port_code} />
                  ))}
                </datalist>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '16px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn btn-outline">취소</button>
                <button type="submit" disabled={creatingOrder} className="btn btn-primary">
                  {creatingOrder ? '생성 중...' : '발주 생성'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
