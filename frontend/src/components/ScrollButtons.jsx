import React from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';

export default function ScrollButtons() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToBottom = () => {
    window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });
  };

  return (
    <div className="scroll-buttons-container">
      <button className="scroll-btn" onClick={scrollToTop} aria-label="맨 위로 이동">
        <ArrowUp size={15} color="#003399" strokeWidth={2.5} />
      </button>
      <div className="scroll-divider" />
      <button className="scroll-btn" onClick={scrollToBottom} aria-label="맨 아래로 이동">
        <ArrowDown size={15} color="#003399" strokeWidth={2.5} />
      </button>
    </div>
  );
}
