import { ReportRecord, DashboardStats } from '../types/mwa';

export const mockReportRecords: ReportRecord[] = [
  // มกราคม 2570
  {
    id: 1,
    month: "มกราคม 2570",
    speaker: "นายสุรชัย วงศ์ปัญญา",
    speakerPosition: "รองผู้ว่าการ (เทคโนโลยีดิจิทัล)",
    speakerAffiliation: "สายงานเทคโนโลยีดิจิทัล",
    speakerDepartment: "ฝ่ายพัฒนาระบบงานดิจิทัล",
    topics: "การขับเคลื่อนองค์กรด้วยเทคโนโลยีดิจิทัล (Digital MWA), การส่งเสริมนวัตกรรม",
    channel: "การประชุม, Line Application",
    audience: "พนักงานและลูกจ้าง กปน., ผู้บริหารระดับกลาง กปน.",
    evidence: "2 ไฟล์ (รูปภาพ)",
    evidenceFiles: [
      {
        name: "mwa_meeting_01.jpg",
        size: "1.2 MB",
        url: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=300&auto=format&fit=crop&q=80"
      },
      {
        name: "mwa_digital_presentation.png",
        size: "820 KB",
        url: "https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=300&auto=format&fit=crop&q=80"
      }
    ],
    recorder: "สมศักดิ์ สุขประเสริฐ",
    recordDate: "15/01/2570",
    details: "ถ่ายทอดแผนยุทธศาสตร์ด้านเทคโนโลยีดิจิทัลปี 2570 ให้ฝ่ายต่างๆ รับทราบและเตรียมพร้อมรับระบบใหม่",
    problems: "อุปกรณ์คอมพิวเตอร์ในบางส่วนงานยังไม่รองรับซอฟต์แวร์เวอร์ชันล่าสุด",
    suggestions: "จัดงบประมาณสนับสนุนการปรับปรุงเครื่องคอมพิวเตอร์ในสาขาบริการ",
    phone: "02-504-0123 ต่อ 4821",
    email: "recorder@mwa.co.th"
  },
  {
    id: 2,
    month: "มกราคม 2570",
    speaker: "นางสาวพิมพา ธนากูล",
    speakerPosition: "ผู้ช่วยผู้ว่าการ (บริการ 1)",
    speakerAffiliation: "สายงานบริการด้านตะวันออก",
    speakerDepartment: "สำนักงานประปาสาขาสุขุมวิท",
    topics: "งานบริการของ กปน. (Digital Service), การลดน้ำสูญเสีย",
    channel: "การประชุม, การตรวจเยี่ยม",
    audience: "พนักงานและลูกจ้าง กปน.",
    evidence: "2 ไฟล์ (รูปภาพ)",
    evidenceFiles: [
      {
        name: "service_inspection_01.jpg",
        size: "1.5 MB",
        url: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=300&auto=format&fit=crop&q=80"
      },
      {
        name: "mwa_pipe_repair.jpg",
        size: "950 KB",
        url: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=300&auto=format&fit=crop&q=80"
      }
    ],
    recorder: "วิชัย ภักดีรัตน์",
    recordDate: "18/01/2570",
    details: "เน้นย้ำเรื่องความรวดเร็วในการบริการประชาชนผ่าน MWA onMobile และการเข้าซ่อมท่อแตกฉุกเฉินภายใน 2 ชม.",
    problems: "ช่วงเวลาเร่งด่วนการจราจรติดขัด ทำให้การเดินทางเข้าจุดแตกรั่วล่าช้า",
    suggestions: "ประสานงานเจ้าหน้าที่ตำรวจจราจรเปิดช่องทางพิเศษในกรณีฉุกเฉิน",
    phone: "02-504-0123 ต่อ 2311",
    email: "wichai.p@mwa.co.th"
  },
  {
    id: 3,
    month: "มกราคม 2570",
    speaker: "นายสมเกียรติ สว่างอารมณ์",
    speakerPosition: "ผู้อำนวยการฝ่ายการเงิน",
    speakerAffiliation: "สายงานการเงิน",
    speakerDepartment: "ฝ่ายการเงินและงบประมาณ",
    topics: "การบริหารงบประมาณอย่างคุ้มค่า, การเบิกจ่ายงบลงทุนระบบดิจิทัล",
    channel: "การประชุม",
    audience: "ผู้บริหารระดับกลาง กปน., พนักงานและลูกจ้าง กปน.",
    evidence: "1 ไฟล์ (เอกสาร PDF)",
    evidenceFiles: [
      {
        name: "งบประมาณประจำปี2570.pdf",
        size: "2.1 MB"
      }
    ],
    recorder: "นภาลัย มิ่งขวัญ",
    recordDate: "22/01/2570",
    details: "ชี้แจงแนวทางการจัดสรรงบประมาณโครงการปรับปรุงระบบประปาและการเบิกจ่ายผ่านระบบ e-Budgeting",
    problems: "ขั้นตอนการอนุมัติผ่านเอกสารยังมีความซ้ำซ้อนในบางโครงการ",
    suggestions: "เร่งผลักดันระบบ e-Document และลายมือชื่ออิเล็กทรอนิกส์เต็มรูปแบบ",
    phone: "02-504-0123 ต่อ 1205",
    email: "napalai.m@mwa.co.th"
  },
  {
    id: 4,
    month: "มกราคม 2570",
    speaker: "นายวีระวัฒน์ ศรีสุข",
    speakerPosition: "ผู้อำนวยการสำนักผู้ว่าการ",
    speakerAffiliation: "สายงานผู้ว่าการ",
    speakerDepartment: "สำนักผู้ว่าการ",
    topics: "ยุทธศาสตร์และแผนวิสาหกิจ กปน., การสื่อสารธรรมาภิบาลในองค์กร",
    channel: "การประชุม, หนังสือเวียน",
    audience: "พนักงานและลูกจ้าง กปน.",
    evidence: "ไม่มี",
    evidenceFiles: [],
    recorder: "ชลธิชา เจริญศิลป์",
    recordDate: "28/01/2570",
    details: "เน้นย้ำค่านิยมองค์กร MWA DRIVE และการขับเคลื่อนองค์กรคุณธรรมและความโปร่งใส",
    problems: "การรับรู้ของพนักงานในส่วนภูมิภาคยังไม่ครอบคลุม",
    suggestions: "จัดกิจกรรม Town Hall แบบออนไลน์ทุกไตรมาส",
    phone: "02-504-0123 ต่อ 1002",
    email: "chonticha.c@mwa.co.th"
  },

  // กุมภาพันธ์ 2570
  {
    id: 5,
    month: "กุมภาพันธ์ 2570",
    speaker: "นายเกียรติศักดิ์ เจริญกิจ",
    speakerPosition: "รองผู้ว่าการ (ผลิตน้ำ)",
    speakerAffiliation: "สายงานผลิตน้ำ",
    speakerDepartment: "ฝ่ายโรงงานผลิตน้ำบางเขน",
    topics: 'แผนน้ำประปาปลอดภัย "น้ำประปา สะอาด ดื่มได้"',
    channel: "การตรวจเยี่ยม, การบรรยาย/เป็นวิทยากรภายนอก",
    audience: "ประชาชน/ผู้ใช้น้ำ, พนักงานและลูกจ้าง กปน.",
    evidence: "1 ไฟล์ (เอกสาร PDF)",
    evidenceFiles: [
      {
        name: "แผนน้ำประปาปลอดภัย_WHO.pdf",
        size: "3.4 MB"
      }
    ],
    recorder: "เกียรติศักดิ์ อุดมผล",
    recordDate: "05/02/2570",
    details: "ตรวจความพร้อมกระบวนการผลิตน้ำประปาสะอาดตามมาตรฐานองค์การอนามัยโลก (WHO) และการรับมือภัยแล้ง",
    problems: "สภาพน้ำดิบมีความเค็มขึ้นสูงในบางช่วงเวลาตามระดับน้ำทะเลหนุน",
    suggestions: "ติดตามการเปิด-ปิดประตูระบายน้ำคลองลัดโพธิ์อย่างใกล้ชิด",
    phone: "02-504-0123 ต่อ 3140",
    email: "kiattisak.u@mwa.co.th"
  },
  {
    id: 6,
    month: "กุมภาพันธ์ 2570",
    speaker: "นายประสิทธิ์ วรรณกิจ",
    speakerPosition: "ผู้ช่วยผู้ว่าการ (ก่อสร้าง)",
    speakerAffiliation: "สายงานวิศวกรรม",
    speakerDepartment: "ฝ่ายก่อสร้างระบบจ่ายน้ำ 1",
    topics: "โครงสร้างพื้นฐานระบบประปา, การดำเนินงานด้านความปลอดภัย",
    channel: "การตรวจเยี่ยม",
    audience: "พนักงานและลูกจ้าง กปน., หน่วยงานภาครัฐ/รัฐวิสาหกิจ",
    evidence: "1 ไฟล์ (รูปภาพ)",
    evidenceFiles: [
      {
        name: "pipe_construction_safety.jpg",
        size: "1.8 MB",
        url: "https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?w=300&auto=format&fit=crop&q=80"
      }
    ],
    recorder: "นันทนา ธนกิจวณิช",
    recordDate: "12/02/2570",
    details: "ตรวจความปลอดภัยงานขุดวางท่อประธานขนาด 1,000 มม. ถนนรามคำแหง",
    problems: "พื้นที่ก่อสร้างติดแนวรถไฟฟ้า มีข้อจำกัดเรื่องเวลาเข้าทำงานกลางคืน",
    suggestions: "เพิ่มป้ายเตือนไฟ LED สะท้อนแสงเพื่อความปลอดภัยของผู้ใช้ทาง",
    phone: "02-504-0123 ต่อ 5210",
    email: "nantana.t@mwa.co.th"
  },
  {
    id: 7,
    month: "กุมภาพันธ์ 2570",
    speaker: "นายสุรชัย วงศ์ปัญญา",
    speakerPosition: "รองผู้ว่าการ (เทคโนโลยีดิจิทัล)",
    speakerAffiliation: "สายงานเทคโนโลยีดิจิทัล",
    speakerDepartment: "ฝ่ายโครงสร้างพื้นฐานดิจิทัล",
    topics: "ความมั่นคงปลอดภัยทางไซเบอร์ (Cybersecurity), การยกระดับระบบคลาวด์",
    channel: "การประชุม, การอบรมสัมมนา",
    audience: "พนักงานและลูกจ้าง กปน., ผู้บริหารระดับกลาง กปน.",
    evidence: "1 ไฟล์ (รูปภาพ)",
    evidenceFiles: [
      {
        name: "cyber_drill_2570.jpg",
        size: "1.1 MB",
        url: "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=300&auto=format&fit=crop&q=80"
      }
    ],
    recorder: "สมศักดิ์ สุขประเสริฐ",
    recordDate: "20/02/2570",
    details: "ซักซ้อมแผนเผชิญเหตุด้านความมั่นคงปลอดภัยไซเบอร์ประจำปี 2570 ตามมาตรฐาน พ.ร.บ. ไซเบอร์",
    problems: "พนักงานบางกลุ่มยังขาดความตระหนักเรื่องฟิชชิ่งอีเมล",
    suggestions: "จัดทำคลิปวิดีโอสั้นให้ความรู้เกี่ยวกับภัยไซเบอร์ส่งผ่าน Line OA ภายใน",
    phone: "02-504-0123 ต่อ 4821",
    email: "recorder@mwa.co.th"
  },
  {
    id: 8,
    month: "กุมภาพันธ์ 2570",
    speaker: "นายธเนศ วรเชษฐ์",
    speakerPosition: "ผู้อำนวยการสำนักงานประปาสาขาภาษีเจริญ",
    speakerAffiliation: "สายงานบริการด้านตะวันตก",
    speakerDepartment: "สำนักงานประปาสาขาภาษีเจริญ",
    topics: "การลดน้ำสูญเสียเชิงรุก, การบริหารจัดการแรงดันน้ำ",
    channel: "การตรวจเยี่ยม, การประชุม",
    audience: "พนักงานและลูกจ้าง กปน.",
    evidence: "ไม่มี",
    evidenceFiles: [],
    recorder: "ศศิธร บุญทวี",
    recordDate: "25/02/2570",
    details: "ลงพื้นที่ตรวจค้นหาท่อรั่วใต้ดินในเวลากลางคืนโดยใช้เครื่องฟังเสียงแบบดิจิทัล (Acoustic Sensor)",
    problems: "สภาพเสียงรบกวนจากการจราจรในเวลากลางคืน",
    suggestions: "จัดหาเครื่องมือตรวจจับสัญญาณรั่วไหลแบบอัตโนมัติชนิดส่งสัญญาณระยะไกล (IoT Leak Sensor)",
    phone: "02-504-0123 ต่อ 2890",
    email: "sasithorn.b@mwa.co.th"
  },

  // มีนาคม 2570
  {
    id: 9,
    month: "มีนาคม 2570",
    speaker: "นายธีระศักดิ์ รัตนพงษ์",
    speakerPosition: "รองผู้ว่าการ (บริหาร)",
    speakerAffiliation: "สายงานบริหาร",
    speakerDepartment: "ฝ่ายพัฒนาทรัพยากรบุคคล",
    topics: "การจัดการความรู้ (KM), การยกระดับบุคลากรสู่ความเป็นเลิศในการปฏิบัติงาน",
    channel: "การประชุม, การจัดกิจกรรม/การเข้าร่วมกิจกรรม",
    audience: "พนักงานและลูกจ้าง กปน.",
    evidence: "ไม่มี",
    evidenceFiles: [],
    recorder: "ปาริฉัตร มั่นคง",
    recordDate: "02/03/2570",
    details: "การอบรมหลักสูตรผู้นำยุคใหม่กับการบริการที่ประทับใจ เพื่อยกระดับความพึงพอใจของลูกค้า",
    problems: "สถานที่ฝึกอบรมมีจำกัด",
    suggestions: "พัฒนาหลักสูตร E-Learning เพิ่มเติมเพื่อให้พนักงานเรียนรู้ได้ทุกที่",
    phone: "02-504-0123 ต่อ 1520",
    email: "parichat.m@mwa.co.th"
  },
  {
    id: 10,
    month: "มีนาคม 2570",
    speaker: "นายรังสรรค์ โชคพิบูลย์",
    speakerPosition: "ผู้อำนวยการฝ่ายแผนงานโครงการ",
    speakerAffiliation: "สายงานแผนและพัฒนา",
    speakerDepartment: "ฝ่ายแผนงานโครงการ",
    topics: "แผนแม่บทการพัฒนาโครงสร้างพื้นฐานระบบประปาปี 2570-2580",
    channel: "การประชุม, การบรรยาย/เป็นวิทยากรภายนอก",
    audience: "พนักงานและลูกจ้าง กปน., หน่วยงานภาครัฐ/รัฐวิสาหกิจ",
    evidence: "1 ไฟล์ (เอกสาร PDF)",
    evidenceFiles: [
      {
        name: "แผนแม่บทกปน_2570_2580.pdf",
        size: "4.8 MB"
      }
    ],
    recorder: "อนุชา แก้วมณี",
    recordDate: "14/03/2570",
    details: "ถ่ายทอดแผนแม่บทการขยายกำลังผลิตน้ำประปาฝั่งตะวันตกและโครงการอุโมงค์ส่งน้ำเชื่อมโยง",
    problems: "การประสานงานขอใช้พื้นที่เขตทางกับหน่วยงานเจ้าของพื้นที่",
    suggestions: "แต่งตั้งคณะทำงานประสานงานระดับกระทรวงเพื่อลดขั้นตอนเอกสาร",
    phone: "02-504-0123 ต่อ 6112",
    email: "anucha.k@mwa.co.th"
  },
  {
    id: 11,
    month: "มีนาคม 2570",
    speaker: "นายสุรชัย วงศ์ปัญญา",
    speakerPosition: "รองผู้ว่าการ (เทคโนโลยีดิจิทัล)",
    speakerAffiliation: "สายงานเทคโนโลยีดิจิทัล",
    speakerDepartment: "ฝ่ายพัฒนาระบบงานดิจิทัล",
    topics: "การเปิดตัวฟีเจอร์ใหม่บน MWA onMobile 3.0",
    channel: "การแถลงข่าว/สื่อมวลชน, Facebook / Social Media",
    audience: "ประชาชน/ผู้ใช้น้ำ, พนักงานและลูกจ้าง กปน.",
    evidence: "2 ไฟล์ (รูปภาพ)",
    evidenceFiles: [
      {
        name: "press_conference_mobile_app.jpg",
        size: "1.4 MB",
        url: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=300&auto=format&fit=crop&q=80"
      },
      {
        name: "app_banner_q1.jpg",
        size: "920 KB",
        url: "https://images.unsplash.com/photo-1556742049-0a67c5574f73?w=300&auto=format&fit=crop&q=80"
      }
    ],
    recorder: "สมศักดิ์ สุขประเสริฐ",
    recordDate: "21/03/2570",
    details: "แถลงข่าวเปิดตัวระบบแจ้งเตือนท่อแตกรั่วอัตโนมัติและชำระค่าน้ำผ่าน PromptPay ไร้ค่าธรรมเนียม",
    problems: "เครือข่ายอินเทอร์เน็ตช่วงแถลงข่าวมีผู้ใช้งานหนาแน่น",
    suggestions: "จัดเตรียมระบบสำรองเครือข่ายเฉพาะกิจในการแถลงข่าวครั้งต่อไป",
    phone: "02-504-0123 ต่อ 4821",
    email: "recorder@mwa.co.th"
  },
  {
    id: 12,
    month: "มีนาคม 2570",
    speaker: "นางดวงพร พงษ์สถิตย์",
    speakerPosition: "ผู้อำนวยการฝ่ายลูกค้าสัมพันธ์",
    speakerAffiliation: "สายงานบริการด้านตะวันออก",
    speakerDepartment: "สำนักงานประปาสาขาพระโขนง",
    topics: "การให้บริการที่เป็นเลิศ (Service Excellence), ความพึงพอใจของผู้ใช้น้ำ",
    channel: "การประชุม, การตรวจเยี่ยม",
    audience: "พนักงานและลูกจ้าง กปน.",
    evidence: "ไม่มี",
    evidenceFiles: [],
    recorder: "มานพ รัตนโชติ",
    recordDate: "29/03/2570",
    details: "มอบนโยบายการรับเรื่องร้องเรียนและแก้ไขปัญหาน้ำประปาไหลอ่อนภายใน 3 ชั่วโมง",
    problems: "ข้อมูลที่อยู่ของผู้ร้องเรียนบางรายไม่ชัดเจน",
    suggestions: "เพิ่มระบบปักหมุด GPS ในฟอร์มแจ้งเรื่องร้องเรียนของคอลเซ็นเตอร์ 1125",
    phone: "02-504-0123 ต่อ 2415",
    email: "manop.r@mwa.co.th"
  },

  // เมษายน 2570 (Q2)
  {
    id: 13,
    month: "เมษายน 2570",
    speaker: "นายเกียรติศักดิ์ เจริญกิจ",
    speakerPosition: "รองผู้ว่าการ (ผลิตน้ำ)",
    speakerAffiliation: "สายงานผลิตน้ำ",
    speakerDepartment: "ฝ่ายโรงงานผลิตน้ำมหาสวัสดิ์",
    topics: "การบริหารจัดการน้ำช่วงเทศกาลสงกรานต์และการรับมือภัยแล้ง",
    channel: "การตรวจเยี่ยม, การประชุม",
    audience: "พนักงานและลูกจ้าง กปน., ประชาชน/ผู้ใช้น้ำ",
    evidence: "1 ไฟล์ (รูปภาพ)",
    evidenceFiles: [
      {
        name: "songkran_water_readiness.jpg",
        size: "1.6 MB",
        url: "https://images.unsplash.com/photo-1544717305-2782549b5136?w=300&auto=format&fit=crop&q=80"
      }
    ],
    recorder: "เอกชัย เจนกิจ",
    recordDate: "08/04/2570",
    details: "ตรวจระบบสูบจ่ายน้ำเตรียมพร้อมรองรับการใช้น้ำช่วงวันหยุดยาวเทศกาลสงกรานต์",
    problems: "ระดับน้ำในแม่น้ำเจ้าพระยาลดลงเล็กน้อย",
    suggestions: "ประสานกรมชลประทานผันน้ำช่วยผลักดันน้ำเค็มอย่างต่อเนื่อง",
    phone: "02-504-0123 ต่อ 3312",
    email: "ekachai.j@mwa.co.th"
  },
  {
    id: 14,
    month: "เมษายน 2570",
    speaker: "นายสุรชัย วงศ์ปัญญา",
    speakerPosition: "รองผู้ว่าการ (เทคโนโลยีดิจิทัล)",
    speakerAffiliation: "สายงานเทคโนโลยีดิจิทัล",
    speakerDepartment: "ฝ่ายพัฒนาระบบงานดิจิทัล",
    topics: "การประยุกต์ใช้ปัญญาประดิษฐ์ (AI) ในการพยากรณ์ปริมาณการใช้น้ำ",
    channel: "การประชุม, การอบรมสัมมนา",
    audience: "ผู้บริหารระดับกลาง กปน., พนักงานและลูกจ้าง กปน.",
    evidence: "ไม่มี",
    evidenceFiles: [],
    recorder: "สมศักดิ์ สุขประเสริฐ",
    recordDate: "23/04/2570",
    details: "นำเสนอโมเดล AI พยากรณ์การใช้น้ำล่วงหน้า 7 วัน เพื่อช่วยวางแผนการสูบจ่ายน้ำและประหยัดพลังงานไฟฟ้า",
    problems: "ข้อมูลย้อนหลังบางสาขายังมีช่องว่าง (Data Gap)",
    suggestions: "ทำความสะอาดข้อมูล (Data Cleansing) และติดตั้งมิเตอร์ดิจิทัลเพิ่มเติม",
    phone: "02-504-0123 ต่อ 4821",
    email: "recorder@mwa.co.th"
  }
];

export const mockDashboardStats: DashboardStats = {
  totalReports: 14,
  completedDepartments: 8,
  pendingDepartments: 1,
  completionRate: "88.9%",
  affiliationStats: [
    { name: "สายงานผู้ว่าการ", submitted: 1, total: 2 },
    { name: "สายงานบริหาร", submitted: 1, total: 2 },
    { name: "สายงานการเงิน", submitted: 1, total: 2 },
    { name: "สายงานบริการด้านตะวันออก", submitted: 2, total: 2 },
    { name: "สายงานบริการด้านตะวันตก", submitted: 1, total: 2 },
    { name: "สายงานวิศวกรรม", submitted: 1, total: 2 },
    { name: "สายงานผลิตน้ำ", submitted: 2, total: 2 },
    { name: "สายงานแผนและพัฒนา", submitted: 1, total: 2 },
    { name: "สายงานเทคโนโลยีดิจิทัล", submitted: 4, total: 4 }
  ],
  topicStats: [
    { topic: "การขับเคลื่อนองค์กรด้วยเทคโนโลยีดิจิทัล (Digital MWA)", count: 4 },
    { topic: 'แผนน้ำประปาปลอดภัย "น้ำประปา สะอาด ดื่มได้"', count: 3 },
    { topic: "งานบริการของ กปน. (Digital Service)", count: 3 },
    { topic: "การลดน้ำสูญเสีย", count: 2 },
    { topic: "ความมั่นคงปลอดภัยทางไซเบอร์ (Cybersecurity)", count: 2 }
  ],
  channelStats: [
    { channel: "การประชุม", count: 10 },
    { channel: "การตรวจเยี่ยม", count: 6 },
    { channel: "Line Application", count: 3 },
    { channel: "Facebook / Social Media", count: 2 }
  ],
  audienceStats: [
    { audience: "พนักงานและลูกจ้าง กปน.", count: 12 },
    { audience: "ผู้บริหารระดับกลาง กปน.", count: 6 },
    { audience: "ประชาชน/ผู้ใช้น้ำ", count: 4 }
  ]
};
