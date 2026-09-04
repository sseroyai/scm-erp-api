import React from 'react';
import { ClipboardCheck, Wrench, Package, Ship, Anchor, Warehouse } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function StepBar({ currentStatus }) {
  const { t } = useTranslation();

  const STEPS = [
    { key: 'CONFIRMED', label: t('stepbar.confirmed'), icon: ClipboardCheck },
    { key: 'IN_PRODUCTION', label: t('stepbar.in_production'), icon: Wrench },
    { key: 'SHIPPING', label: t('stepbar.shipping'), icon: Ship },
    { key: 'ARRIVED', label: t('stepbar.arrived'), icon: Anchor },
    { key: 'IN_STOCK', label: t('stepbar.in_stock'), icon: Warehouse },
  ];

  const currentIndex = STEPS.findIndex(s => s.key === currentStatus);

  return (
    <div className="step-bar-container">
      {STEPS.map((step, index) => {
        const isCompleted = index < currentIndex;
        const isActive = index === currentIndex;
        const IconComponent = step.icon;
        
        let dotClass = "step-dot";
        if (isCompleted) dotClass += " completed";
        if (isActive) dotClass += " active";

        let labelClass = "step-label";
        if (isActive || isCompleted) labelClass += " active";

        return (
          <div key={step.key} className="step-node">
            <div className={dotClass} style={isActive ? { position: 'relative' } : {}}>
              <IconComponent size={18} strokeWidth={1.5} />
            </div>
            <span className={labelClass} style={isActive ? { color: 'var(--text-primary)', fontWeight: 800 } : {}}>{step.label}</span>
            {index < STEPS.length - 1 && (
              <div className="step-connector">
                <span className="dot"></span>
                <span className="dot"></span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
