// Topic keyword matcher for auto-selecting communication topics based on text content

export interface TopicKeywordMap {
  topic: string;
  keywords: string[];
}

export const topicKeywordRules: TopicKeywordMap[] = [
  {
    topic: 'แผนน้ำประปาปลอดภัย "น้ำประปา สะอาด ดื่มได้"',
    keywords: [
      'ดื่มได้',
      'สะอาด ดื่มได้',
      'สะอาดดื่มได้',
      'น้ำประปาปลอดภัย',
      'ประปาปลอดภัย',
      'น้ำประปาสะอาด',
      'water safety',
      'wsp',
      'คุณภาพน้ำประปา',
      'คุณภาพน้ำ'
    ]
  },
  {
    topic: 'งานบริการของ กปน. (Digital Service)',
    keywords: [
      'digital service',
      'onmobile',
      'งานบริการ',
      'บริการของ กปน',
      'บริการประชาชน',
      'บริการดิจิทัล',
      'ผู้ใช้น้ำ'
    ]
  },
  {
    topic: 'การใช้น้ำอย่างรู้คุณค่าและฉลากประหยัดน้ำ',
    keywords: [
      'ประหยัดน้ำ',
      'รู้คุณค่า',
      'ฉลากประหยัดน้ำ',
      'ใช้น้ำอย่างรู้คุณค่า'
    ]
  },
  {
    topic: 'การรณรงค์ลดปริมาณการปล่อยก๊าซเรือนกระจก (CO2)',
    keywords: [
      'ก๊าซเรือนกระจก',
      'เรือนกระจก',
      'co2',
      'คาร์บอน',
      'carbon',
      'โลกร้อน',
      'greenhouse'
    ]
  },
  {
    topic: 'วิสัยทัศน์ พันธกิจ ค่านิยม',
    keywords: [
      'วิสัยทัศน์',
      'พันธกิจ',
      'ค่านิยม',
      'vision',
      'mission',
      'core value'
    ]
  },
  {
    topic: 'การลดน้ำสูญเสีย',
    keywords: [
      'น้ำสูญเสีย',
      'ลดน้ำสูญเสีย',
      'ท่อแตก',
      'ท่อรั่ว',
      'แตกรั่ว',
      'nrw',
      'น้ำรั่ว'
    ]
  },
  {
    topic: 'การกำกับดูแลกิจการที่ดี',
    keywords: [
      'กำกับดูแลกิจการ',
      'ธรรมาภิบาล',
      'จริยธรรม',
      'ต่อต้านทุจริต',
      'โปร่งใส',
      'ความโปร่งใส',
      'cg',
      'good governance'
    ]
  },
  {
    topic: 'การขับเคลื่อนองค์กรด้วยเทคโนโลยีดิจิทัล (Digital MWA)',
    keywords: [
      'digital',
      'ดิจิทัล',
      'ดิจิตอล',
      'เทคโนโลยีดิจิทัล',
      'digitalization',
      'transformation'
    ]
  },
  {
    topic: 'การบริหารความเสี่ยงและควบคุมภายใน',
    keywords: [
      'ความเสี่ยง',
      'ควบคุมภายใน',
      'บริหารความเสี่ยง',
      'risk'
    ]
  },
  {
    topic: 'การส่งเสริมนวัตกรรม',
    keywords: [
      'นวัตกรรม',
      'innovation',
      'ส่งเสริมนวัตกรรม',
      'สิ่งประดิษฐ์'
    ]
  },
  {
    topic: 'การจัดการความรู้ (KM)',
    keywords: [
      'km',
      'ความรู้',
      'จัดการความรู้',
      'knowledge',
      'คลังความรู้'
    ]
  },
  {
    topic: 'การเปลี่ยนแปลงสภาพแวดล้อมภายนอกที่สำคัญ',
    keywords: [
      'สภาพแวดล้อมภายนอก',
      'ภัยแล้ง',
      'น้ำทะเลหนุน',
      'น้ำเค็ม',
      'น้ำท่วม'
    ]
  },
  {
    topic: 'โครงสร้างพื้นฐานระบบประปา',
    keywords: [
      'โครงสร้างพื้นฐาน',
      'ท่อประธาน',
      'ระบบจ่ายน้ำ',
      'สถานีสูบจ่าย',
      'ท่อส่งน้ำ'
    ]
  },
  {
    topic: 'การดำเนินธุรกิจที่เกี่ยวเนื่อง',
    keywords: [
      'ธุรกิจที่เกี่ยวเนื่อง',
      'ธุรกิจเกี่ยวเนื่อง',
      'ธุรกิจเสริม',
      'รายได้เสริม',
      'เชิงพาณิชย์'
    ]
  },
  {
    topic: 'ความผูกพันองค์กร',
    keywords: [
      'ผูกพัน',
      'ผูกพันธ์',
      'ความผูกพัน',
      'ความผูกพันธ์',
      'engagement',
      'employee engagement'
    ]
  },
  {
    topic: 'การดำเนินงานด้านความปลอดภัย',
    keywords: [
      'ความปลอดภัย',
      'ปลอดภัย',
      'อาชีวอนามัย',
      'safety',
      'อุบัติเหตุ'
    ]
  },
  {
    topic: 'การบริหารความต่อเนื่องทางธุรกิจ (BCMS)',
    keywords: [
      'bcms',
      'bcp',
      'ความต่อเนื่อง',
      'ภาวะฉุกเฉิน',
      'ฉุกเฉิน',
      'business continuity'
    ]
  },
  {
    topic: 'การยกระดับบุคลากรสู่ความเป็นเลิศในการปฏิบัติงาน',
    keywords: [
      'บุคลากร',
      'ความเป็นเลิศ',
      'ยกระดับบุคลากร',
      'พัฒนาบุคลากร',
      'upskill',
      'reskill',
      'สมรรถนะ'
    ]
  }
];

/**
 * Given text from communication details, returns array of matching topics.
 */
export function matchTopicsFromText(text: string): string[] {
  if (!text || text.trim().length === 0) return [];
  const normalized = text.toLowerCase();

  const matchedTopics: string[] = [];

  for (const rule of topicKeywordRules) {
    const hasMatch = rule.keywords.some((kw) =>
      normalized.includes(kw.toLowerCase())
    );
    if (hasMatch) {
      matchedTopics.push(rule.topic);
    }
  }

  return matchedTopics;
}
