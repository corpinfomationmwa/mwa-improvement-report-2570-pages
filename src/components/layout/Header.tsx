import React, { useState } from 'react';
import { Bell, Menu, User, ChevronDown, CheckCircle2, ShieldCheck, LogOut } from 'lucide-react';
import { UserProfile } from '../../types/report';

interface HeaderProps {
  user: UserProfile;
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
}

export const Header: React.FC<HeaderProps> = ({ user, onToggleSidebar }) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 h-16 flex items-center justify-between px-4 sm:px-6">
      {/* Left zone: Brand and mobile menu toggle */}
      <div className="flex items-center gap-3 sm:gap-4">
        <button
          onClick={onToggleSidebar}
          aria-label="เปิด/ปิด เมนู"
          className="p-2 -ml-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md lg:hidden focus:outline-none focus:ring-2 focus:ring-[#005696]"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Brand Lockup */}
        <div className="flex items-center gap-3">
          {/* MWA Watermark/Emblem Badge */}
          <div className="w-9 h-9 rounded-md bg-[#005696] flex items-center justify-center text-white shadow-xs shrink-0">
            <svg
              className="w-5 h-5 fill-current text-white"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
            </svg>
          </div>

          <div className="flex flex-col">
            <div className="flex items-baseline gap-2">
              <span className="text-base sm:text-lg font-bold tracking-tight text-[#003a6b]">
                MWA Improvement Report
              </span>
              <span className="hidden md:inline-block text-xs text-slate-400 font-light">
                | การประปานครหลวง
              </span>
            </div>
            <span className="text-[11px] text-slate-500 leading-tight hidden sm:block">
              ระบบรายงานการปรับปรุงและพัฒนางาน
            </span>
          </div>
        </div>
      </div>

      {/* Right zone: Notifications & User profile */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowUserMenu(false);
            }}
            aria-label="การแจ้งเตือน"
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-full relative focus:outline-none focus:ring-2 focus:ring-[#005696]"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white" />
          </button>

          {/* Notification Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-slate-200 py-2 z-50 text-left">
              <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-800">การแจ้งเตือนระบบ</span>
                <span className="text-[11px] text-[#005696] font-medium cursor-pointer hover:underline">
                  อ่านทั้งหมด
                </span>
              </div>
              <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
                <div className="px-4 py-3 hover:bg-slate-50 cursor-pointer">
                  <p className="text-xs font-medium text-slate-800">รายงาน MWA-2567-0053 ได้รับการอนุมัติแล้ว</p>
                  <p className="text-[11px] text-slate-400 mt-1">10 นาทีที่แล้ว · ฝ่ายบริการและควบคุม</p>
                </div>
                <div className="px-4 py-3 hover:bg-slate-50 cursor-pointer">
                  <p className="text-xs font-medium text-slate-800">มีรายงานใหม่รอตรวจสอบ 1 รายการ</p>
                  <p className="text-[11px] text-slate-400 mt-1">2 ชั่วโมงที่แล้ว · ฝ่ายบำรุงรักษา</p>
                </div>
              </div>
              <div className="px-4 py-2 border-t border-slate-100 bg-slate-50/50 text-center">
                <span className="text-[11px] text-slate-500">การแจ้งเตือนทั้งหมด 2 รายการ</span>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Area */}
        <div className="relative">
          <button
            onClick={() => {
              setShowUserMenu(!showUserMenu);
              setShowNotifications(false);
            }}
            className="flex items-center gap-2.5 p-1.5 sm:px-2.5 rounded-lg hover:bg-slate-100 transition-colors text-left focus:outline-none focus:ring-2 focus:ring-[#005696]"
          >
            <div className="w-8 h-8 rounded-full bg-[#005696] text-white flex items-center justify-center font-medium text-xs tracking-wider ring-2 ring-slate-100">
              {user.avatarText}
            </div>
            <div className="hidden sm:flex flex-col">
              <span className="text-xs font-semibold text-slate-800 leading-snug">
                {user.name}
              </span>
              <span className="text-[11px] text-slate-500 leading-snug truncate max-w-[140px]">
                {user.department}
              </span>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400 hidden sm:block" />
          </button>

          {/* User Menu Dropdown */}
          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-slate-200 py-2 z-50">
              <div className="px-4 py-2.5 border-b border-slate-100">
                <p className="text-xs font-semibold text-slate-900">{user.name}</p>
                <p className="text-[11px] text-slate-500">{user.department}</p>
                <div className="mt-1 flex items-center gap-1.5 text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded w-fit">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>เจ้าหน้าที่ กปน. (ปกติ)</span>
                </div>
              </div>
              <div className="py-1">
                <div className="px-4 py-2 text-xs text-slate-600 flex items-center gap-2.5 hover:bg-slate-50 cursor-pointer">
                  <User className="w-4 h-4 text-slate-400" />
                  <span>ข้อมูลผู้ใช้งาน ({user.employeeId})</span>
                </div>
                <div className="px-4 py-2 text-xs text-slate-600 flex items-center gap-2.5 hover:bg-slate-50 cursor-pointer">
                  <CheckCircle2 className="w-4 h-4 text-slate-400" />
                  <span>สถานะการเชื่อมต่อ: พร้อมใช้งาน</span>
                </div>
              </div>
              <div className="border-t border-slate-100 pt-1">
                <div className="px-4 py-2 text-xs text-slate-500 flex items-center gap-2.5 hover:bg-slate-50 cursor-pointer">
                  <LogOut className="w-4 h-4 text-slate-400" />
                  <span>ออกจากระบบ</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
