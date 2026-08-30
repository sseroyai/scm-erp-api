import React, { useState, useEffect } from 'react';
import { FileSpreadsheet, Upload, Mail, Plus, X, ShoppingCart } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function UploadSettings() {
  const [emailConfigs, setEmailConfigs] = useState([]);
  const [productModels, setProductModels] = useState([]);
  const [dealers, setDealers] = useState([]);
  const [ncCodes, setNcCodes] = useState([]);
  const [incotermCodes, setIncotermCodes] = useState([]);
  const [portCodes, setPortCodes] = useState([]);

  // 단건 발주 생성 상태
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newOrderForm, setNewOrderForm] = useState({
    reference_no: '',
    product_model_id: '',
    dealer_company_id: '',
    nc: '',
    incoterms: '',
    destination_port: '',
    dealer_order_date: ''
  });
  const [creatingOrder, setCreatingOrder] = useState(false);

  // 엑셀 업로드 상태
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadResult, setUploadResult] = useState(null);
  const [uploading, setUploading] = useState(false);

  const loadConfigs = async () => {
    try {
      const [emailRes, modelsRes, dealersRes, ncRes, incotermRes, portRes] = await Promise.all([
        fetch('/api/email-configs'),
        fetch('/api/models'),
        fetch('/api/dealers'),
        fetch('/api/master-data/nc-codes'),
        fetch('/api/master-data/incoterm-codes'),
        fetch('/api/master-data/port-codes')
      ]);
      setEmailConfigs(await emailRes.json());
      setProductModels(await modelsRes.json());
      setDealers(await dealersRes.json());
      setNcCodes(await ncRes.json());
      setIncotermCodes(await incotermRes.json());
      setPortCodes(await portRes.json());
    } catch (e) {
      console.error("Config fetch error:", e);
    }
  };

  useEffect(() => {
    loadConfigs();
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
          destination_port: newOrderForm.destination_port,
          dealer_order_date: newOrderForm.dealer_order_date || null
        })
      });

      if (res.ok) {
        alert("신규 발주가 성공적으로 생성되었습니다.");
        setShowCreateModal(false);
        setNewOrderForm({ reference_no: '', product_model_id: '', dealer_company_id: '', nc: '', incoterms: '', destination_port: '', dealer_order_date: '' });
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
    } catch (err) {
      setUploadResult({ status: 'error', message: '서버 통신 중 오류가 발생했습니다.' });
    } finally {
      setUploading(false);
    }
  };

  const handleToggleEmailRule = async (configId, currentActive) => {
    try {
      await fetch(`/api/email-configs/${configId}?is_active=${!currentActive}`, {
        method: 'PATCH'
      });
      loadConfigs();
    } catch (e) {
      alert("알림 설정 변경 실패");
    }
  };

  const { t } = useTranslation();

  return (
    <div className="page-body">
      <div style={{ marginBottom: '24px', paddingTop: '4px', paddingLeft: '28px' }}>
        <h1 style={{ fontSize: '1.8rem', marginBottom: '4px' }}>{t('management.page_title', 'Upload / Setting')}</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          {t('management.page_desc', 'On this page, you can upload a new order and set an alert for the schedule.')}
        </p>
      </div>

      {/* 신규 단건 발주 생성 */}
      <div className="glass-card" style={{ padding: '28px', marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
          <ShoppingCart color="var(--accent-blue)" size={24} />
          <h2 style={{ fontSize: '1.3rem' }}> {t('management.create_order_title', 'Upload New A or F Order')}</h2>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '20px' }}>
          {t('management.create_order_desc', 'You can create new orders for A or F in real-time.')}
        </p>

        <button
          onClick={() => setShowCreateModal(true)}
          className="btn btn-primary upload-hover-btn"
          style={{ padding: '10px 20px', fontSize: '0.95rem' }}
        >
          <Plus size={18} />
          <span>{t('management.btn_create_order', 'Create New Order')}</span>
        </button>
      </div>

      <div className="glass-card" style={{ padding: '28px', marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
          <FileSpreadsheet color="var(--accent-cyan)" size={24} />
          <h2 style={{ fontSize: '1.3rem' }}>{t('management.bulk_upload_title', 'Order Upload(Bulk)')}</h2>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '20px' }}>
          {t('management.bulk_upload_desc', 'You can upload both dealer orders and WME stock orders.')}
        </p>

        <form onSubmit={handleFileUpload} style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', background: 'var(--bg-secondary)', padding: '20px', borderRadius: '12px', border: '1px dashed var(--border-color)' }}>
          <input
            type="file"
            accept=".xlsx, .xls"
            onChange={e => setSelectedFile(e.target.files[0])}
            style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}
          />
          <button type="submit" disabled={uploading || !selectedFile} className="btn btn-primary upload-hover-btn">
            <Upload size={16} />
            <span>{uploading ? 'Data validation and upload...' : t('management.btn_upload', 'Upload Standard EXCEL Template')}</span>
          </button>

          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            * {t('management.standard_headers', 'Standard Headers')}: <code>MODEL, NC, P/O, PRICE, DEALER, DETAIL SPEC, INCOTERMS, PORT</code>
          </div>
        </form>

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

      <div className="glass-card" style={{ padding: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
          <Mail color="var(--accent-purple)" size={24} />
          <h2 style={{ fontSize: '1.3rem' }}>Set Up Automated Schedule Notifications and Frequency</h2>
        </div>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '20px' }}>
          <ul style={{ paddingLeft: '20px', lineHeight: 1.6 }}>
            <li>1. <strong>출항(ETD) 직후:</strong> ETD 및 초기 ETA 일정안내 이메일 발송</li>
            <li>2. <strong>해상 운송 중:</strong> 10일 주기로 정기 ETA 정보 통지</li>
            <li>3. <strong>유럽 항구 도착:</strong> 함부르크 항구 도착(HHLA API 연동) 정보 자동 업데이트</li>
            <li>4. <strong>창고 입고:</strong> 입고 완료 시 가용재고 상태전환 알림 발송</li>
          </ul>
        </div>

        <div className="data-table-container">
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

              {/* 4.5. Dealer Order Date */}
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{t('menu4.order_date', '딜러발주 일자')}</label>
                <input
                  type="date"
                  value={newOrderForm.dealer_order_date}
                  onChange={e => setNewOrderForm({ ...newOrderForm, dealer_order_date: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)' }}
                />
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
      <style>{`
        .upload-hover-btn:hover:not(:disabled) {
          background-color: rgb(205, 170, 125) !important;
          border-color: rgb(205, 170, 125) !important;
        }
      `}</style>
    </div>
  );
}
