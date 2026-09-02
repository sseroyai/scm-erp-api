import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Filter, Book, FileText, Settings, Download, X, Upload, ShieldAlert, FolderOpen } from 'lucide-react';
import { productLibraryModels } from '../data/productLibraryModels';

export default function ProductLibrary({ currentRole, isMobileView }) {
  const { t, i18n } = useTranslation();
  const isKo = i18n.language === 'ko';
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  const getDocTitle = (title) => {
    if (title.includes('카탈로그')) return isKo ? '카탈로그(EN). PDF' : 'CATALOG (EN). PDF';
    if (title.includes('세일즈 가이드')) return isKo ? '세일즈 가이드 (EN). PDF' : 'SALES GUIDE (EN). PDF';
    return title;
  };
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModel, setSelectedModel] = useState(null); // For Quick View Modal

  // Categories
  const categories = ['ALL', 'CNC T/C', 'Vertical M/C', 'Horizontal M/C', 'Multi-Tasking', '5-Axis M/C'];

  // Mock Data: Models
  const mockModels = productLibraryModels;

  const filteredModels = mockModels.filter(model => {
    const matchesCategory = selectedCategory === 'ALL' || model.category === selectedCategory;

    // 검색어 및 모델명에서 띄어쓰기, 하이픈, 슬래시 등을 제거하고 비교 (강력한 검색 지원)
    const normalizedSearch = searchQuery.toLowerCase().replace(/[\s\-\/]/g, '');
    const normalizedName = (model.name || '').toLowerCase().replace(/[\s\-\/]/g, '');
    const matchesSearch = normalizedName.includes(normalizedSearch);

    return matchesCategory && matchesSearch;
  });

  const getDocIcon = (type) => {
    switch (type) {
      case 'BROCHURE': return <Book size={18} color="var(--wia-blue)" />;
      case 'MANUAL': return <FileText size={18} color="var(--wia-gold)" />;
      case 'DRAWING': return <FolderOpen size={18} color="var(--wia-light-gold)" />;
      case 'COST': return <ShieldAlert size={18} color="var(--wia-red)" />;
      case 'SERVICE': return <Settings size={18} color="var(--text-muted)" />;
      default: return <FileText size={18} />;
    }
  };

  const handleDownload = async (doc) => {
    if (!doc.filename) {
      alert('다운로드할 파일이 설정되지 않았습니다.');
      return;
    }

    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await fetch(`${baseUrl}/api/documents/${doc.filename}/download`);

      if (!response.ok) {
        throw new Error('파일을 찾을 수 없습니다.');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = doc.filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      alert('다운로드 실패: ' + error.message);
    }
  };

  return (
    <div style={{ padding: isMobileView ? '16px' : '32px', animation: 'fadeIn 0.4s ease-out' }}>

      {/* Header */}
      <div style={{ display: 'flex', flexDirection: isMobileView ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobileView ? 'stretch' : 'center', gap: '16px', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', color: 'var(--wia-blue)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FolderOpen size={28} />
            {t('menu7.page_title')}
          </h1>
        </div>

        {/* Write Access for SCM_ADMIN */}
        {currentRole === 'SCM_ADMIN' && (
          <button style={{
            background: 'var(--wia-blue)', color: 'white', border: 'none', padding: '10px 20px',
            borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 600,
            boxShadow: 'var(--glass-shadow)', alignSelf: isMobileView ? 'stretch' : 'auto', justifyContent: 'center'
          }}>
            <Upload size={18} />
            <span>신규 자료 업로드</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="clean-card" style={{ padding: '16px', marginBottom: '24px', display: 'flex', flexDirection: isMobileView ? 'column' : 'row', gap: '16px', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', width: isMobileView ? '100%' : 'auto' }}>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`category-btn ${selectedCategory === cat ? 'active' : ''}`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div style={{ position: 'relative', width: isMobileView ? '100%' : '300px' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder={t('menu7.search_placeholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '10px 12px 10px 40px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none' }}
          />
        </div>
      </div>

      {/* Master List View (Grid) */}
      <div className="library-grid">
        {filteredModels.map(model => (
          <div
            key={model.id}
            className="clean-card library-product-card"
            style={{ overflow: 'hidden', cursor: 'pointer', display: 'flex', flexDirection: 'column' }}
            onClick={() => setSelectedModel(model)}
          >
            <div style={{ height: '190px', background: 'transparent', position: 'relative' }}>
              {model.image ? (
                <img src={model.image} alt={model.name} style={{ width: '100%', height: '100%', paddingTop: '5px', objectFit: 'contain' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontWeight: 700, fontSize: '1.2rem', background: 'transparent' }}>
                  {model.id} 썸네일
                </div>
              )}
              <span style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(0,0,0,0.6)', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
                {model.category}
              </span>
            </div>
            <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ fontSize: '1.55rem', marginBottom: '4px' }}>{model.name}</h3>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: 0 }}>{model.series || '-'}</p>
                </div>
                <div style={{
                  border: '1px solid var(--border-color)',
                  borderRadius: '10px',
                  padding: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--wia-blue)',
                  backgroundColor: 'white',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.03)'
                }}>
                  <Download size={14} strokeWidth={2.5} />
                </div>
              </div>

              <div style={{ marginTop: 'auto', background: 'var(--bg-secondary)', padding: '12px', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                  {model.typeCategory || '-'}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {model.typeDescription || '-'}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick View Modal */}
      {selectedModel && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
          padding: isMobileView ? '16px' : '40px', backdropFilter: 'blur(4px)'
        }}>
          <div className="clean-card" style={{
            background: 'var(--bg-primary)', width: '100%', maxWidth: '800px', maxHeight: '90vh',
            overflowY: 'auto', borderRadius: '16px', display: 'flex', flexDirection: 'column'
          }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: 'var(--bg-primary)', zIndex: 10 }}>
              <h2 style={{ fontSize: '1.5rem', margin: 0 }}>{selectedModel.name} <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>{selectedModel.category}</span></h2>
              <button onClick={() => setSelectedModel(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={24} />
              </button>
            </div>

            <div style={{ padding: '24px', display: 'flex', flexDirection: isMobileView ? 'column-reverse' : 'row', gap: '32px' }}>
              {/* Left Column: Specs */}
              <div style={{ flex: '1' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', color: 'var(--text-primary)' }}>{isKo ? '핵심 스펙' : 'Specifications'}</h3>
                <div style={{ background: 'var(--bg-secondary)', borderRadius: '8px', overflow: 'hidden' }}>
                  {Object.entries(selectedModel.specs).map(([key, value], idx) => (
                    <div key={key} style={{ display: 'flex', padding: '8px', borderBottom: idx !== Object.entries(selectedModel.specs).length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                      <span style={{ flex: '0 0 60%', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                        {key}
                      </span>
                      <span style={{ flex: '0 0 40%', fontWeight: 600, fontSize: '0.9rem', textAlign: 'right' }}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: Digital File Download Hub */}
              <div style={{ flex: '1.5' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', color: 'var(--text-primary)' }}>{isKo ? '다운로드 (EN)' : 'DOWNLOAD (EN)'}</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {selectedModel.documents
                    // RBAC Logic: Filter INTERNAL documents if user is DEALER
                    .filter(doc => currentRole !== 'DEALER' || doc.securityLevel !== 'INTERNAL')
                    .map(doc => (
                      <div key={doc.id} className="clean-card no-hover-bg" style={{
                        padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        borderLeft: doc.securityLevel === 'INTERNAL' ? '4px solid var(--wia-red)' : '4px solid var(--wia-blue)'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ background: 'var(--bg-secondary)', padding: '8px', borderRadius: '8px' }}>
                            {getDocIcon(doc.type)}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{getDocTitle(doc.title)}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', gap: '8px', marginTop: '4px' }}>
                              <span>{doc.size}</span>
                              {doc.securityLevel === 'INTERNAL' && (
                                <span style={{ color: 'var(--wia-red)', fontWeight: 600 }}><ShieldAlert size={10} style={{ display: 'inline' }} /> 보안 등급: 대외비</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <button onClick={() => handleDownload(doc)} style={{
                          background: 'none', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '8px',
                          cursor: 'pointer', color: 'var(--wia-blue)', transition: 'all 0.2s',
                          display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }} title="다운로드 / 열람">
                          <Download size={18} />
                        </button>
                      </div>
                    ))}

                  {selectedModel.documents.filter(doc => currentRole !== 'DEALER' || doc.securityLevel !== 'INTERNAL').length === 0 && (
                    <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                      이용 가능한 문서가 없습니다.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .library-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 20px;
        }
        @media (min-width: 1600px) {
          .library-grid {
            grid-template-columns: repeat(5, 1fr);
          }
        }
        .library-product-card:hover {
          border-color: rgb(205, 170, 125) !important;
          /* Base border is 1px, inset shadow adds 1px for a total 2px visual border */
          box-shadow: inset 0 0 0 1px rgb(205, 170, 125), var(--shadow-lg) !important;
          background-color: var(--bg-card) !important;
        }
      `}</style>
    </div>
  );
}
