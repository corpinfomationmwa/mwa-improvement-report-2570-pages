import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  description?: string;
  accentColor?: 'blue' | 'slate' | 'amber' | 'emerald';
  onClick?: () => void;
}

const colorStyles = {
  blue: {
    iconBg: 'bg-sky-50 text-[#005696]',
    borderHover: 'hover:border-[#005696]/40',
    topBar: 'bg-[#005696]'
  },
  slate: {
    iconBg: 'bg-slate-100 text-slate-700',
    borderHover: 'hover:border-slate-400',
    topBar: 'bg-slate-500'
  },
  amber: {
    iconBg: 'bg-amber-50 text-amber-700',
    borderHover: 'hover:border-amber-400',
    topBar: 'bg-amber-500'
  },
  emerald: {
    iconBg: 'bg-emerald-50 text-emerald-700',
    borderHover: 'hover:border-emerald-400',
    topBar: 'bg-emerald-600'
  }
};

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  description,
  accentColor = 'blue',
  onClick
}) => {
  const styles = colorStyles[accentColor];

  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={`relative bg-white rounded-lg border border-slate-200 p-5 shadow-xs transition-all duration-150 ${
        onClick ? 'cursor-pointer hover:shadow-sm ' + styles.borderHover : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500 mb-1">{title}</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-slate-900 font-mono tabular-nums">
              {value.toLocaleString('th-TH')}
            </span>
            <span className="text-xs text-slate-400 font-normal">รายการ</span>
          </div>
          {description && (
            <p className="text-xs text-slate-500 mt-2">{description}</p>
          )}
        </div>
        <div className={`p-2.5 rounded-md ${styles.iconBg} shrink-0`}>
          <Icon className="w-5 h-5" strokeWidth={2} />
        </div>
      </div>
    </div>
  );
};
