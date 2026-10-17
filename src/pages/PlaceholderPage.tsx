import React from 'react';
import { ArrowLeft, Clock, Construction, FileText, PlusCircle, UserCheck, HelpCircle } from 'lucide-react';
import { useRouter } from '../context/RouterContext';

interface PlaceholderPageProps {
  pageTitle: string;
  routeKey: 'reports' | 'new' | 'mine' | 'detail' | 'help';
  reportId?: string;
}

const pageConfigs = {
  reports: {
    icon: FileText,
    desc: 'หน้ารวมรายการรายงานการปรับปรุงและพัฒนางานทั้งหมดของการประปานครหลวง พร้อมระบบกรองขั้นสูงและการส่งออกข้อมูล',
    futureFeatures: ['ระบบค้นหาและกรองตามสังกัด/ฝ่าย', 'การส่งออกรายงาน (Excel/PDF)', 'การจัดกลุ่มหมวดหมู่นวัตกรรม']
  },
  new: {
    icon: PlusCircle,
    desc: 'แบบฟอร์มการสร้างและส่งข้อเสนอแนะการปรับปรุงงานใหม่ พร้อมระบบแนบเอกสารและรูปภาพ',
    futureFeatures: ['แบบฟอร์มกรอกข้อมูลตามมาตรฐาน กปน.', 'ระบบบันทึกแบบร่างอัตโนมัติ', 'การแนบไฟล์หลักฐานและภาพถ่าย']
  },
  mine: {
    icon: UserCheck,
    desc: 'หน้ารายการรายงานที่ท่านเป็นผู้สร้างหรือมีส่วนร่วมรับผิดชอบ พร้อมสถานะการติดตามผล',
    futureFeatures: ['รายการแบบร่างส่วนตัว', 'ประวัติการส่งรายงานย้อนหลัง', 'การแจ้งเตือนผลการพิจารณา']
  },
  detail: {
    icon: FileText,
    desc: 'หน้าแสดงรายละเอียดฉบับเต็มของรายงาน ประวัติการพิจารณา และข้อคิดเห็นจากผู้ตรวจสอบ',
    futureFeatures: ['รายละเอียดโครงการฉบับสมบูรณ์', 'ไทม์ไลน์การอนุมัติและข้อคิดเห็น', 'เอกสารแนบและการรับรองผล']
  },
  help: {
    icon: HelpCircle,
    desc: 'คู่มือขั้นตอนการใช้งานระบบ การจัดทำรายงานการปรับปรุงงาน และคำถามที่พบบ่อย (FAQ)',
    futureFeatures: ['คู่มือการใช้งานสำหรับเจ้าหน้าที่', 'เกณฑ์การประเมินและการให้คะแนน', 'ช่องทางติดต่อทีมงานสนับสนุน']
  }
};

export const PlaceholderPage: React.FC<PlaceholderPageProps> = ({
  pageTitle,
  routeKey,
  reportId
}) => {
  const { navigate } = useRouter();
  const config = pageConfigs[routeKey] || pageConfigs.reports;
  const IconComponent = config.icon;

  const displayTitle = reportId ? `${pageTitle} (${reportId})` : pageTitle;

  return (
    <div className="space-y-6">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <button
          onClick={() => navigate('/dashboard')}
          className="hover:text-[#005696] flex items-center gap-1 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>กลับไปหน้า Dashboard</span>
        </button>
        <span>/</span>
        <span className="text-slate-800 font-medium">{displayTitle}</span>
      </div>

      {/* Main Placeholder Container */}
      <div className="bg-white rounded-lg border border-slate-200 p-8 sm:p-12 text-center shadow-xs">
        <div className="max-w-md mx-auto space-y-4">
          {/* Icon Badge */}
          <div className="w-14 h-14 bg-sky-50 text-[#005696] rounded-xl flex items-center justify-center mx-auto border border-sky-100">
            <IconComponent className="w-7 h-7" />
          </div>

          {/* Required Page Title */}
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {displayTitle}
            </h1>
            
            {/* Required notice text */}
            <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded bg-amber-50 text-amber-800 border border-amber-200 text-xs font-semibold">
              <Construction className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>หน้านี้จะพัฒนาในขั้นตอนถัดไป</span>
            </div>
          </div>

          {/* Description */}
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
            {config.desc}
          </p>

          {/* Upcoming Features preview */}
          <div className="pt-4 pb-2 border-t border-slate-100 text-left">
            <p className="text-xs font-semibold text-slate-700 mb-2">
              ฟังก์ชันการทำงานที่จะพร้อมใช้งานในระยะถัดไป:
            </p>
            <ul className="space-y-1.5 text-xs text-slate-600">
              {config.futureFeatures.map((feat, idx) => (
                <li key={idx} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#005696] shrink-0" />
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Action button back to Dashboard */}
          <div className="pt-2">
            <button
              onClick={() => navigate('/dashboard')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>กลับสู่หน้าหลัก Dashboard</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
