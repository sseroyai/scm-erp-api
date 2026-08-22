import React from 'react';

/**
 * WIA MACHINE TOOLS Corporate Identity Logo Component
 * 공식 CI 가이드라인(01 Design Language - Brand Signature) 로고 이미지 반영
 */
export default function WiaLogo({ variant = 'main', size = 'medium', className = '', style = {}, onClick }) {
  // Size presets
  const sizes = {
    small: { height: 16 },
    medium: { height: 34 },
    large: { height: 44 },
    compact: { height: 32 }
  };

  const currentSize = sizes[size] || sizes.medium;
  const imgSrc = variant === 'compact' ? '/assets/favicon.svg' : '/assets/logo.png';

  return (
    <div 
      className={`wia-logo ${variant} ${className}`} 
      style={{ display: 'inline-flex', alignItems: 'center', minWidth: 0, cursor: onClick ? 'pointer' : 'default', ...style }}
      onClick={onClick}
    >
      <img 
        src={imgSrc} 
        alt="WIA MACHINE TOOLS" 
        style={{ height: currentSize.height, width: 'auto', maxWidth: '100%', objectFit: 'contain' }} 
        onError={(e) => {
          // 로고 이미지를 로드할 수 없을 때 대비용
          e.target.style.display = 'none';
        }}
      />
      <span style={{ 
        display: 'none', 
        fontFamily: 'SUITE, sans-serif', 
        fontWeight: 800, 
        color: '#0A1C8F',
        marginLeft: '8px'
      }}>
        WIA MACHINE TOOLS
      </span>
    </div>
  );
}
