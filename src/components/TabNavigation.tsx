import React from 'react';
import { PenSquare, FileSpreadsheet, BarChart3 } from 'lucide-react';

export type TabType = 'form' | 'data' | 'dashboard';

interface TabNavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export const TabNavigation: React.FC<TabNavigationProps> = ({
  activeTab,
  onTabChange
}) => {
  return (
    <nav className="mwa-tabs" role="tablist">
      <button
        role="tab"
        aria-selected={activeTab === 'form'}
        className={`mwa-tab ${activeTab === 'form' ? 'active' : ''}`}
        onClick={() => onTabChange('form')}
      >
        <PenSquare className="w-4 h-4" />
        <span>บันทึกข้อมูล</span>
      </button>

      <button
        role="tab"
        aria-selected={activeTab === 'data'}
        className={`mwa-tab ${activeTab === 'data' ? 'active' : ''}`}
        onClick={() => onTabChange('data')}
      >
        <FileSpreadsheet className="w-4 h-4" />
        <span>ข้อมูลการสื่อสาร</span>
      </button>

      <button
        role="tab"
        aria-selected={activeTab === 'dashboard'}
        className={`mwa-tab ${activeTab === 'dashboard' ? 'active' : ''}`}
        onClick={() => onTabChange('dashboard')}
      >
        <BarChart3 className="w-4 h-4" />
        <span>Dashboard</span>
      </button>
    </nav>
  );
};
