export type ReportStatus =
  | 'draft'               // ร่าง
  | 'submitted'           // ส่งแล้ว
  | 'under_review'        // อยู่ระหว่างตรวจสอบ
  | 'approved'            // อนุมัติแล้ว
  | 'returned';           // ส่งกลับแก้ไข

export interface ReportItem {
  id: string;             // เช่น MWA-2567-0048
  title: string;          // ชื่อเรื่องการปรับปรุงงาน
  department: string;     // หน่วยงาน เช่น ฝ่ายบริการลูกค้า, ฝ่ายบำรุงรักษาท่อประปา
  reporter: string;       // ชื่อผู้รายงาน
  reporterRole?: string;  // ตำแหน่ง
  date: string;           // วันที่รายงาน พ.ศ.
  status: ReportStatus;   // สถานะ
  category: string;       // ประเภทการปรับปรุง เช่น ลดขั้นตอนการทำงาน, ปรับปรุงระบบประปา, ระบบดิจิทัล
  summary?: string;       // รายละเอียดสังเขป
  impactLevel?: 'สูง' | 'ปานกลาง' | 'ปกติ'; // ระดับผลกระทบ
  updatedAt: string;
}

export interface DashboardSummary {
  totalReports: number;       // รายงานทั้งหมด
  draftCount: number;         // ร่าง
  pendingReviewCount: number; // รอตรวจสอบ
  approvedCount: number;      // อนุมัติแล้ว
}

export interface UserProfile {
  name: string;
  department: string;
  division: string;
  employeeId: string;
  avatarText: string;
}
