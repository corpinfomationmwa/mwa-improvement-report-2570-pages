import React from 'react';
import { ReportStatus } from '../../types/report';

interface StatusBadgeProps {
  status: ReportStatus;
  size?: 'sm' | 'md';
}

interface StatusConfig {
  label: string;
  dotColor: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
}

const statusConfigs: Record<ReportStatus, StatusConfig> = {
  draft: {
    label: 'ร่าง',
    dotColor: 'bg-slate-400',
    bgClass: 'bg-slate-100',
    textClass: 'text-slate-700',
    borderClass: 'border-slate-200'
  },
  submitted: {
    label: 'ส่งแล้ว',
    dotColor: 'bg-sky-500',
    bgClass: 'bg-sky-50',
    textClass: 'text-sky-800',
    borderClass: 'border-sky-200'
  },
  under_review: {
    label: 'อยู่ระหว่างตรวจสอบ',
    dotColor: 'bg-amber-500',
    bgClass: 'bg-amber-50',
    textClass: 'text-amber-800',
    borderClass: 'border-amber-200'
  },
  approved: {
    label: 'อนุมัติแล้ว',
    dotColor: 'bg-emerald-600',
    bgClass: 'bg-emerald-50',
    textClass: 'text-emerald-800',
    borderClass: 'border-emerald-200'
  },
  returned: {
    label: 'ส่งกลับแก้ไข',
    dotColor: 'bg-rose-500',
    bgClass: 'bg-rose-50',
    textClass: 'text-rose-800',
    borderClass: 'border-rose-200'
  }
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'sm' }) => {
  const config = statusConfigs[status] || statusConfigs.draft;
  
  const sizeClasses = size === 'sm' 
    ? 'px-2 py-0.5 text-xs' 
    : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded border ${config.bgClass} ${config.textClass} ${config.borderClass} ${sizeClasses} whitespace-nowrap`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dotColor} shrink-0`} aria-hidden="true" />
      <span>{config.label}</span>
    </span>
  );
};
