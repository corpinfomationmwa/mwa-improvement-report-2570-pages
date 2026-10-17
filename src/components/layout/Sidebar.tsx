import React from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  UserCheck, 
  PlusCircle, 
  HelpCircle, 
  X,
  Building2,
  ExternalLink
} from 'lucide-react';
import { useRouter } from '../../context/RouterContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  name: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
}

interface NavSection {
  title?: string;
  items: NavItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { currentPath, navigate } = useRouter();

  const navSections: NavSection[] = [
    {
      items: [
        {
          name: 'Dashboard',
          path: '/dashboard',
          icon: LayoutDashboard
        }
      ]
    },
    {
      title: 'รายงาน',
      items: [
        {
          name: 'รายงานทั้งหมด',
          path: '/reports',
          icon: FileText
        },
        {
          name: 'รายงานของฉัน',
          path: '/reports/mine',
          icon: UserCheck
        },
        {
          name: 'สร้างรายงาน',
          path: '/reports/new',
          icon: PlusCircle
        }
      ]
    },
    {
      title: 'ระบบ',
      items: [
        {
          name: 'วิธีใช้งาน',
          path: '/help',
          icon: HelpCircle
        }
      ]
    }
  ];

  const handleNavClick = (path: string) => {
    navigate(path);
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  const isItemActive = (path: string) => {
    if (path === '/dashboard') {
      return currentPath === '/' || currentPath === '/dashboard';
    }
    if (path === '/reports') {
      return currentPath === '/reports' || (currentPath.startsWith('/reports/') && currentPath !== '/reports/new' && currentPath !== '/reports/mine');
    }
    return currentPath === path;
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 lg:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Mobile Header in Drawer */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-200 lg:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-[#005696] flex items-center justify-center text-white">
              <svg className="w-4 h-4 fill-current text-white" viewBox="0 0 24 24">
                <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
              </svg>
            </div>
            <span className="font-bold text-sm text-[#003a6b]">การประปานครหลวง</span>
          </div>
          <button
            onClick={onClose}
            aria-label="ปิดเมนู"
            className="p-1.5 text-slate-500 hover:text-slate-800 rounded-md hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto py-5 px-3 space-y-6">
          {navSections.map((section, sIndex) => (
            <div key={sIndex} className="space-y-1">
              {section.title && (
                <div className="px-3 pb-1 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
                  {section.title}
                </div>
              )}
              {section.items.map((item) => {
                const active = isItemActive(item.path);
                const Icon = item.icon;

                return (
                  <button
                    key={item.path}
                    onClick={() => handleNavClick(item.path)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-md transition-colors text-left group ${
                      active
                        ? 'bg-[#005696] text-white shadow-xs font-semibold'
                        : 'text-slate-600 hover:text-[#005696] hover:bg-sky-50/70'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon
                        className={`w-4 h-4 shrink-0 transition-colors ${
                          active
                            ? 'text-white'
                            : 'text-slate-400 group-hover:text-[#005696]'
                        }`}
                      />
                      <span>{item.name}</span>
                    </div>

                    {item.badge && (
                      <span
                        className={`text-xs px-2 py-0.5 rounded font-mono ${
                          active
                            ? 'bg-white/20 text-white'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Sidebar Footer: System Info & Trust indicator */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/60">
          <div className="flex items-center gap-2 text-xs text-slate-600 mb-1">
            <Building2 className="w-4 h-4 text-[#005696] shrink-0" />
            <span className="font-medium text-slate-800">การประปานครหลวง</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            ระบบงานภายใน กปน. (ระยะที่ 1)
          </p>
          <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500">
            <span>เวอร์ชัน 1.0.0 (พ.ศ. 2567)</span>
          </div>
        </div>
      </aside>
    </>
  );
};
