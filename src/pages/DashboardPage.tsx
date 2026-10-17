import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  FileEdit, 
  Clock, 
  CheckCircle, 
  Plus, 
  RefreshCw,
  TrendingUp,
  Download
} from 'lucide-react';
import { StatCard } from '../components/common/StatCard';
import { RecentReportsTable } from '../components/dashboard/RecentReportsTable';
import { ReportDetailModal } from '../components/dashboard/ReportDetailModal';
import { reportService } from '../services/reportService';
import { DashboardSummary, ReportItem } from '../types/report';
import { useRouter } from '../context/RouterContext';

export const DashboardPage: React.FC = () => {
  const { navigate } = useRouter();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<ReportItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [summaryData, reportsData] = await Promise.all([
          reportService.getDashboardSummary(),
          reportService.getRecentReports()
        ]);
        setSummary(summaryData);
        setReports(reportsData);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleViewDetail = (report: ReportItem) => {
    setSelectedReport(report);
    setIsDetailOpen(true);
  };

  const handleEdit = (report: ReportItem) => {
    // Navigate to report or show quick action
    navigate(`/reports/${report.id}`);
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#003a6b]">
              Dashboard
            </h1>
            <span className="text-xs bg-sky-100 text-[#005696] font-medium px-2 py-0.5 rounded">
              ระยะที่ 1 (UI)
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-0.5">
            ระบบรายงานการปรับปรุงและพัฒนางาน
          </p>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => navigate('/reports/new')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#005696] hover:bg-[#00467a] text-white text-xs sm:text-sm font-medium rounded-md shadow-xs transition-colors focus:outline-none focus:ring-2 focus:ring-[#005696] focus:ring-offset-2"
          >
            <Plus className="w-4 h-4" />
            <span>สร้างรายงานใหม่</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="รายงานทั้งหมด"
          value={summary?.totalReports ?? 54}
          icon={FileText}
          description="รวมทุกสถานะในระบบ"
          accentColor="blue"
          onClick={() => navigate('/reports')}
        />
        <StatCard
          title="ร่าง"
          value={summary?.draftCount ?? 7}
          icon={FileEdit}
          description="ยังไม่จัดส่งเพื่อพิจารณา"
          accentColor="slate"
          onClick={() => navigate('/reports/mine')}
        />
        <StatCard
          title="รอตรวจสอบ"
          value={summary?.pendingReviewCount ?? 15}
          icon={Clock}
          description="อยู่ระหว่างการพิจารณาตรวจสอบ"
          accentColor="amber"
          onClick={() => navigate('/reports')}
        />
        <StatCard
          title="อนุมัติแล้ว"
          value={summary?.approvedCount ?? 32}
          icon={CheckCircle}
          description="ผ่านการอนุมัติเรียบร้อย"
          accentColor="emerald"
          onClick={() => navigate('/reports')}
        />
      </div>

      {/* Main Content: รายงานล่าสุด Table */}
      <div className="space-y-4">
        <RecentReportsTable
          reports={reports}
          onViewDetail={handleViewDetail}
          onEdit={handleEdit}
        />
      </div>

      {/* Detail Modal */}
      <ReportDetailModal
        report={selectedReport}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        onEdit={handleEdit}
      />
    </div>
  );
};
