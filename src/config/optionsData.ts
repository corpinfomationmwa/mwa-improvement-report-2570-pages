import { AppOptionsConfig } from '../types/options';
import {
  CASCADING_AFFILIATIONS,
  CASCADING_ORGANIZATION_DATA,
  getDepartmentsByAffiliation
} from './cascadingDepartmentConfig';

// 1. เดือนที่ทำการสื่อสาร (ปีงบประมาณ 2570)
export const monthsConfig: string[] = [
  'ตุลาคม 2569',
  'พฤศจิกายน 2569',
  'ธันวาคม 2569',
  'มกราคม 2570',
  'กุมภาพันธ์ 2570',
  'มีนาคม 2570',
  'เมษายน 2570',
  'พฤษภาคม 2570',
  'มิถุนายน 2570',
  'กรกฎาคม 2570',
  'สิงหาคม 2570',
  'กันยายน 2570'
];

// 2. คำนำหน้าผู้บริหาร
export const executiveTitlesConfig: string[] = [
  'นาย',
  'นาง',
  'นางสาว',
  'ดร.',
  'ว่าที่ ร.ต.'
];

// 3. สายงาน (9 สายงาน) - Cascading Dropdown Master Data
export const affiliationsConfig: string[] = CASCADING_AFFILIATIONS;

// 4. หน่วยงานตามสายงาน (Department Mapping) - Cascading Dropdown Master Data
export const departmentMappingConfig: Record<string, string[]> = CASCADING_ORGANIZATION_DATA;
export { getDepartmentsByAffiliation };

// 5. ตำแหน่ง (ผู้บันทึก และ ผู้บริหาร)
export const recorderPositionsConfig: string[] = [
  'ผู้อำนวยการกอง',
  'หัวหน้าส่วน',
  'นักประชาสัมพันธ์ 6',
  'นักประชาสัมพันธ์ 5',
  'นักประชาสัมพันธ์ 4',
  'นักประชาสัมพันธ์',
  'นักบัญชี 6',
  'นักบัญชี 5',
  'นักบัญชี 4',
  'นักบัญชี',
  'นักทรัพยากรบุคคล 6',
  'นักทรัพยากรบุคคล 5',
  'นักทรัพยากรบุคคล 4',
  'นักทรัพยากรบุคคล',
  'นักวิชาการคอมพิวเตอร์ 7',
  'นักวิชาการคอมพิวเตอร์ 6',
  'นักวิชาการคอมพิวเตอร์ 5',
  'นักวิชาการคอมพิวเตอร์ 4',
  'วิศวกร 7',
  'วิศวกร 6',
  'วิศวกร 5',
  'วิศวกร 4',
  'นักวิเคราะห์นโยบายและแผน 6',
  'นักวิเคราะห์นโยบายและแผน 5',
  'นักวิเคราะห์นโยบายและแผน 4',
  'นิติกร 6',
  'นิติกร 5',
  'นิติกร 4',
  'นักวิทยาศาสตร์ 6',
  'นักวิทยาศาสตร์ 5',
  'นักวิทยาศาสตร์ 4',
  'ช่างเทคนิค 6',
  'ช่างเทคนิค 5',
  'ช่างเทคนิค 4',
  'พนักงานพัสดุ 5',
  'พนักงานพัสดุ 4',
  'พนักงานการเงินและบัญชี 5',
  'พนักงานการเงินและบัญชี 4',
];

export const executivePositionsConfig: string[] = [
  'ผู้ว่าการ',
  'รองผู้ว่าการ (บริหาร)',
  'รองผู้ว่าการ (การเงิน)',
  'รองผู้ว่าการ (บริการด้านตะวันออก)',
  'รองผู้ว่าการ (บริการด้านตะวันตก)',
  'รองผู้ว่าการ (วิศวกรรม)',
  'รองผู้ว่าการ (ผลิตน้ำ)',
  'รองผู้ว่าการ (แผนและพัฒนา)',
  'รองผู้ว่าการ (เทคโนโลยีดิจิทัล)',
  'ผู้ช่วยผู้ว่าการ (บริหาร)',
  'ผู้ช่วยผู้ว่าการ (ทรัพยากรบุคคล)',
  'ผู้ช่วยผู้ว่าการ (บัญชี)',
  'ผู้ช่วยผู้ว่าการ (การเงิน)',
  'ผู้ช่วยผู้ว่าการ (บริการ 1)',
  'ผู้ช่วยผู้ว่าการ (บริการ 2)',
  'ผู้ช่วยผู้ว่าการ (บริการ 3)',
  'ผู้ช่วยผู้ว่าการ (บริการ 4)',
  'ผู้ช่วยผู้ว่าการ (บริการ 5)',
  'ผู้ช่วยผู้ว่าการ (วิศวกรรม)',
  'ผู้ช่วยผู้ว่าการ (ก่อสร้าง)',
  'ผู้ช่วยผู้ว่าการ (แหล่งน้ำและคุณภาพน้ำ)',
  'ผู้ช่วยผู้ว่าการ (ระบบผลิตน้ำ)',
  'ผู้ช่วยผู้ว่าการ (บำรุงรักษา)',
  'ผู้ช่วยผู้ว่าการ (แผนและพัฒนา)',
  'ผู้ช่วยผู้ว่าการ (ธุรกิจ)',
  'ผู้ช่วยผู้ว่าการ (เทคโนโลยีดิจิทัล)',
  'ผู้อำนวยการฝ่าย',
  'ผู้จัดการสำนักงานประปาสาขา'
];

// 6. ประเด็นการสื่อสาร (18 ประเด็น)
export const communicationTopicsConfig: string[] = [
  'แผนน้ำประปาปลอดภัย "น้ำประปา สะอาด ดื่มได้"',
  'งานบริการของ กปน. (Digital Service)',
  'การใช้น้ำอย่างรู้คุณค่าและฉลากประหยัดน้ำ',
  'การรณรงค์ลดปริมาณการปล่อยก๊าซเรือนกระจก (CO2)',
  'วิสัยทัศน์ พันธกิจ ค่านิยม',
  'การลดน้ำสูญเสีย',
  'การกำกับดูแลกิจการที่ดี',
  'การขับเคลื่อนองค์กรด้วยเทคโนโลยีดิจิทัล (Digital MWA)',
  'การบริหารความเสี่ยงและควบคุมภายใน',
  'การส่งเสริมนวัตกรรม',
  'การจัดการความรู้ (KM)',
  'การเปลี่ยนแปลงสภาพแวดล้อมภายนอกที่สำคัญ',
  'โครงสร้างพื้นฐานระบบประปา',
  'การดำเนินธุรกิจที่เกี่ยวเนื่อง',
  'ความผูกพันองค์กร',
  'การดำเนินงานด้านความปลอดภัย',
  'การบริหารความต่อเนื่องทางธุรกิจ (BCMS)',
  'การยกระดับบุคลากรสู่ความเป็นเลิศในการปฏิบัติงาน'
];

// 7. ประเภทการสื่อสาร
export const communicationTypesConfig = [
  { id: 'internal' as const, label: 'การสื่อสารภายใน' },
  { id: 'external' as const, label: 'การสื่อสารภายนอก' }
];

// 8. ช่องทางการสื่อสารภายใน
export const internalChannelsConfig: string[] = [
  'การประชุม',
  'การตรวจเยี่ยม',
  'การเป็นประธานในพิธีเปิดงาน/กิจกรรม',
  'ช่องทาง Social Media ของหน่วยงาน',
  'Line Application',
  'หนังสือเวียน หนังสือสั่งการ',
  'การเป็นวิทยากร',
  'การจัดกิจกรรม/การเข้าร่วมกิจกรรม',
  'E-mail กปน.',
  'อื่นๆ'
];

// 9. ช่องทางการสื่อสารภายนอก
export const externalChannelsConfig: string[] = [
  'ช่องทาง Social Media ของหน่วยงาน',
  'Line Application ที่ใช้สำหรับติดต่อกับหน่วยงานภายนอก',
  'การแถลงข่าว/การให้สัมภาษณ์',
  'การเป็นวิทยากร',
  'การจัดกิจกรรม/การเข้าร่วมกิจกรรม',
  'การศึกษาดูงาน',
  'หนังสือภายนอก',
  'E-mail ส่งถึงบุคคล/หน่วยงานภายนอก',
  'อื่นๆ'
];

// 10. กลุ่มผู้รับสารภายใน
export const internalAudiencesConfig = [
  { id: 'staff', label: 'บุคลากรภายใน กปน.', placeholder: 'ระบุชื่อหน่วยงาน/ตำแหน่ง/กลุ่มบุคลากร' }
];

// 11. กลุ่มผู้รับสารภายนอก
export const externalAudiencesConfig = [
  { id: 'policy', label: 'หน่วยงานเชิงนโยบายและผู้ถือหุ้นภาครัฐ', placeholder: 'ระบุชื่อหน่วยงานฯ' },
  { id: 'mission', label: 'หน่วยงานที่เกี่ยวข้องในเชิงภารกิจ', placeholder: 'ระบุชื่อหน่วยงานฯ' },
  { id: 'partner', label: 'พันธมิตร', placeholder: 'ระบุชื่อพันธมิตรฯ' },
  { id: 'vendor', label: 'คู่ค้า', placeholder: 'ระบุชื่อคู่ค้าฯ' },
  { id: 'customer', label: 'ลูกค้า', placeholder: 'ระบุกลุ่มลูกค้าฯ' },
  { id: 'community', label: 'ชุมชนและสังคม', placeholder: 'ระบุชื่อชุมชนฯ' },
  { id: 'media', label: 'สื่อมวลชน', placeholder: 'ระบุชื่อสื่อฯ' }
];

// 12. ประเภทปัญหาและอุปสรรค (Common Problem Types)
export const problemTypesConfig: string[] = [
  'ปัญหาด้านสถานที่และอุปกรณ์การสื่อสาร',
  'ปัญหาด้านสัญญาณเครือข่าย/เทคโนโลยีสารสนเทศ',
  'ปัญหาด้านเวลาและการประสานงานระหว่างหน่วยงาน',
  'ข้อจำกัดด้านจำนวนและภาระงานของบุคลากร',
  'ปัญหาด้านความเข้าใจในเนื้อหาและเอกสารประกอบ',
  'อื่นๆ'
];

// 13. ประเภทข้อเสนอแนะ (Common Suggestion Types)
export const suggestionTypesConfig: string[] = [
  'เพิ่มช่องทางการสื่อสารดิจิทัล / สื่อวิดีโอออนไลน์',
  'พัฒนาหลักสูตร E-Learning และคลังความรู้แบบ On-Demand',
  'ขยายเวลาและเพิ่มรอบการจัดกิจกรรมสื่อสาร',
  'เพิ่มการมีส่วนร่วมและการรับฟังความคิดเห็นสองทาง (Two-way Communication)',
  'จัดทำคู่มือ / อินโฟกราฟิกสรุปประเด็นเข้าใจง่าย',
  'พัฒนาระบบแจ้งเตือนและติดตามผลการดำเนินงานแบบเรียลไทม์'
];

// 14. สถานะรายงาน (Report Statuses)
export const reportStatusesConfig: string[] = [
  'บันทึกเรียบร้อย',
  'รอดำเนินการตรวจสอบ',
  'ตรวจสอบแล้ว',
  'อนุมัติแล้ว'
];

// Master Centralized Configuration Object
export const defaultAppOptionsConfig: AppOptionsConfig = {
  affiliations: affiliationsConfig,
  departmentMapping: departmentMappingConfig,
  recorderPositions: recorderPositionsConfig,
  executivePositions: executivePositionsConfig,
  executiveTitles: executiveTitlesConfig,
  months: monthsConfig,
  topics: communicationTopicsConfig,
  communicationTypes: communicationTypesConfig,
  internalChannels: internalChannelsConfig,
  externalChannels: externalChannelsConfig,
  internalAudiences: internalAudiencesConfig,
  externalAudiences: externalAudiencesConfig,
  problemTypes: problemTypesConfig,
  suggestionTypes: suggestionTypesConfig,
  reportStatuses: reportStatusesConfig
};
