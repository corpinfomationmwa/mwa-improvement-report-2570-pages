/**
 * Helper to compute Auto Suggested Executive Position from department and affiliation.
 * 
 * Rules:
 * - "ฝ่ายสื่อสารองค์กร" -> "ผู้อำนวยการฝ่ายสื่อสารองค์กร"
 * - "ฝ่ายเทคโนโลยีดิจิทัล" -> "ผู้อำนวยการฝ่ายเทคโนโลยีดิจิทัล"
 * - "สำนักงานประปาสาขา..." -> "ผู้จัดการสำนักงานประปาสาขา..."
 * - "ผู้ช่วยผู้ว่าการ..." -> "ผู้ช่วยผู้ว่าการ..."
 * - "รองผู้ว่าการ..." -> "รองผู้ว่าการ..."
 * - "ผู้ว่าการ" / "ผู้ว่าการ (กองเลขานุการ)" -> "ผู้ว่าการ"
 * 
 * Executive ranks supported:
 * - ผู้อำนวยการฝ่าย
 * - ผู้จัดการสำนักงานประปาสาขา
 * - ผู้ช่วยผู้ว่าการ
 * - รองผู้ว่าการ
 * - ผู้ว่าการ
 * 
 * Note: Non-executive ranks (ผู้อำนวยการกอง, หัวหน้ากอง, หัวหน้าส่วน, หัวหน้างาน,
 * นักประชาสัมพันธ์, นักบัญชี, นักทรัพยากรบุคคล, เจ้าหน้าที่ระดับปฏิบัติการ)
 * are strictly prohibited from executive position logic.
 */

export function getSuggestedExecutivePosition(department?: string, affiliation?: string): string {
  const dept = (department || '').trim();
  const aff = (affiliation || '').trim();

  if (!dept) {
    if (aff) {
      if (aff === 'สายงานผู้ว่าการ') return 'ผู้ว่าการ';
      if (aff.startsWith('สายงาน')) {
        const sub = aff.replace(/^สายงาน/, '').trim();
        return `รองผู้ว่าการ (${sub})`;
      }
      return 'รองผู้ว่าการ';
    }
    return '';
  }

  // 1. ผู้ว่าการ
  if (dept.includes('ผู้ว่าการ (กองเลขานุการ)') || dept === 'ผู้ว่าการ') {
    return 'ผู้ว่าการ';
  }

  // 2. ผู้ช่วยผู้ว่าการ
  if (dept.startsWith('ผู้ช่วยผู้ว่าการ')) {
    return dept;
  }

  // 3. รองผู้ว่าการ
  if (dept.startsWith('รองผู้ว่าการ')) {
    return dept;
  }

  // 4. สำนักงานประปาสาขา... -> ผู้จัดการสำนักงานประปาสาขา...
  if (dept.startsWith('สำนักงานประปาสาขา')) {
    return `ผู้จัดการ${dept}`;
  }

  // 5. ฝ่าย... -> ผู้อำนวยการฝ่าย...
  if (dept.startsWith('ฝ่าย')) {
    return `ผู้อำนวยการ${dept}`;
  }

  // 6. สำนัก... -> ผู้อำนวยการสำนัก...
  if (dept.startsWith('สำนัก')) {
    return `ผู้อำนวยการ${dept}`;
  }

  // 7. Special units under affiliation e.g. "กองความปลอดภัย สวัสดิภาพและอาชีวอนามัย"
  // Executive in charge is Assistant Governor or Deputy Governor (never ผู้อำนวยการกอง or หัวหน้างาน)
  if (aff === 'สายงานบริหาร') {
    return 'ผู้ช่วยผู้ว่าการ (บริหาร)';
  }
  if (aff.startsWith('สายงาน')) {
    const sub = aff.replace(/^สายงาน/, '').trim();
    return `ผู้ช่วยผู้ว่าการ (${sub})`;
  }

  return 'ผู้อำนวยการฝ่าย';
}
