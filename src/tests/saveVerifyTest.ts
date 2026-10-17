import { mwaService } from '../services/mwaService';
import { executeSaveAndVerify, verifySavedRecord, SavePayload } from '../utils/saveVerification';

async function runAllTests() {
  console.log('==================================================');
  console.log('STARTING MWA IMPROVEMENT REPORT - SAVE + VERIFY TESTS');
  console.log('==================================================\n');

  let passedTests = 0;
  const totalTests = 4;

  const mockPayload: SavePayload = {
    submissionId: `MWA-TEST-${Date.now()}`,
    recorder: {
      title: 'นาย',
      name: 'สมศักดิ์',
      surname: 'สุขประเสริฐ',
      position: 'นักวิชาการคอมพิวเตอร์ 6',
      affiliation: 'สายงานเทคโนโลยีดิจิทัล',
      department: 'ฝ่ายพัฒนาระบบงานดิจิทัล',
      phone: '02-504-0123 ต่อ 4821',
      email: 'somsak.s@mwa.co.th'
    },
    executive: {
      month: 'มกราคม 2570',
      title: 'นาย',
      name: 'สุรชัย',
      surname: 'วงศ์ปัญญา',
      position: 'รองผู้ว่าการ (เทคโนโลยีดิจิทัล)',
      affiliation: 'สายงานเทคโนโลยีดิจิทัล',
      department: 'ฝ่ายพัฒนาระบบงานดิจิทัล'
    },
    topics: [
      {
        id: 1,
        selectedTopics: ['นโยบายการทำงานแบบดิจิทัล', 'การพัฒนาระบบบริการประชาชน'],
        details: 'ชี้แจงแนวทางการพัฒนาระบบดิจิทัลและการปรับปรุงงานบริการน้ำประปา',
        communicationTypes: { internal: true, external: true },
        internalChannels: ['การประชุมผู้บริหาร'],
        externalChannels: ['เว็บไซต์ กปน.'],
        internalAudiences: ['ผู้บริหารระดับฝ่ายและกอง'],
        internalAudienceDetails: {},
        externalAudiences: ['ประชาชนทั่วไป'],
        externalAudienceDetails: {},
        evidenceFiles: []
      }
    ],
    feedback: {
      problemsObstacles: 'ระบบเครือข่ายบางสาขายังมีความหน่วงในชั่วโมงเร่งด่วน',
      executiveSuggestions: 'เร่งรัดการปรับปรุงโครงสร้างพื้นฐานเครือข่ายความเร็วสูง'
    }
  };

  // ----------------------------------------------------
  // TEST 1: กรอกข้อมูลครบ -> SAVE -> READ-BACK -> VERIFY -> ได้ SUCCESS
  // ----------------------------------------------------
  console.log('--- TEST 1: SAVE -> READ-BACK -> VERIFY (Happy Path) ---');
  try {
    const result1 = await executeSaveAndVerify(mockPayload);
    console.log('Test 1 Status:', result1.status);
    console.log('Record ID:', result1.recordId, 'Submission ID:', result1.submissionId);
    console.log('Message:', result1.message);

    if (result1.status === 'SUCCESS' && result1.success === true && result1.recordId) {
      console.log('✅ TEST 1 PASSED: ได้สถานะ SUCCESS พร้อม Record ID และ Submission ID ถูกต้องครบถ้วน\n');
      passedTests++;
    } else {
      console.error('❌ TEST 1 FAILED: ผลลัพธ์ไม่เป็น SUCCESS', result1);
    }
  } catch (err) {
    console.error('❌ TEST 1 ERROR:', err);
  }

  // ----------------------------------------------------
  // TEST 2: SAVE สำเร็จ แต่จำลองให้ READ-BACK ไม่พบข้อมูล -> ต้องได้ VERIFY FAILED
  // ----------------------------------------------------
  console.log('--- TEST 2: READ-BACK Not Found Simulation ---');
  try {
    const test2Payload: SavePayload = {
      ...mockPayload,
      submissionId: `MWA-TEST-NOTFOUND-${Date.now()}`
    };
    const result2 = await executeSaveAndVerify(test2Payload, { simulateReadBackNotFound: true });
    console.log('Test 2 Status:', result2.status);
    console.log('Message:', result2.message);
    console.log('Errors logged:', result2.errors);

    if (result2.status === 'FAILED' && result2.success === false) {
      console.log('✅ TEST 2 PASSED: ได้สถานะ FAILED ไม่แสดง SUCCESS เมื่อ READ-BACK ไม่พบข้อมูล\n');
      passedTests++;
    } else {
      console.error('❌ TEST 2 FAILED: ระบบไม่ปฏิเสธเมื่อ READ-BACK ไม่พบข้อมูล', result2);
    }
  } catch (err) {
    console.error('❌ TEST 2 ERROR:', err);
  }

  // ----------------------------------------------------
  // TEST 3: SAVE สำเร็จ แต่ข้อมูลที่ READ-BACK กลับมาไม่ตรงกับข้อมูลที่ส่ง -> ต้องได้ VERIFY FAILED
  // ----------------------------------------------------
  console.log('--- TEST 3: Data Mismatch Simulation ---');
  try {
    const test3Payload: SavePayload = {
      ...mockPayload,
      submissionId: `MWA-TEST-MISMATCH-${Date.now()}`
    };
    const result3 = await executeSaveAndVerify(test3Payload, { simulateDataMismatch: true });
    console.log('Test 3 Status:', result3.status);
    console.log('Message:', result3.message);
    console.log('Errors logged:', result3.errors);

    if (result3.status === 'FAILED' && result3.success === false && result3.errors && result3.errors.length > 0) {
      console.log('✅ TEST 3 PASSED: ได้สถานะ FAILED ตรวจพบข้อมูลไม่ตรงกันและระบุรายละเอียดชัดเจน\n');
      passedTests++;
    } else {
      console.error('❌ TEST 3 FAILED: ระบบไม่จับความผิดพลาดเมื่อข้อมูลไม่ตรงกัน', result3);
    }
  } catch (err) {
    console.error('❌ TEST 3 ERROR:', err);
  }

  // ----------------------------------------------------
  // TEST 4: กดปุ่มบันทึกซ้ำอย่างรวดเร็ว (Duplicate Prevention / Idempotency)
  // ----------------------------------------------------
  console.log('--- TEST 4: Rapid Repeat Submissions (No Duplicate Record) ---');
  try {
    const test4Payload: SavePayload = {
      ...mockPayload,
      submissionId: `MWA-TEST-IDEMPOTENT-${Date.now()}`
    };

    const initialList = await mwaService.getCommunicationData();
    const initialCount = initialList.length;

    // Simulate 3 rapid concurrent/sequential saves with identical submissionId
    console.log('Simulating 3 rapid save requests with identical Submission ID...');
    const [resA, resB, resC] = await Promise.all([
      mwaService.submitReport(test4Payload),
      mwaService.submitReport(test4Payload),
      mwaService.submitReport(test4Payload)
    ]);

    const finalList = await mwaService.getCommunicationData();
    const finalCount = finalList.length;
    const addedCount = finalCount - initialCount;

    console.log(`Initial record count: ${initialCount}, Final record count: ${finalCount}`);
    console.log(`Records added: ${addedCount}`);
    console.log(`Returned record IDs: A=${resA.recordId}, B=${resB.recordId}, C=${resC.recordId}`);

    if (addedCount === 1 && resA.recordId === resB.recordId && resB.recordId === resC.recordId) {
      console.log('✅ TEST 4 PASSED: ไม่เกิด Duplicate Record โดยคืนค่า Record ID เดิมที่บันทึกไว้แล้ว\n');
      passedTests++;
    } else {
      console.error('❌ TEST 4 FAILED: พบ duplicate records เพิ่มขึ้น:', addedCount);
    }
  } catch (err) {
    console.error('❌ TEST 4 ERROR:', err);
  }

  console.log('==================================================');
  console.log(`TEST SUMMARY: ${passedTests}/${totalTests} TESTS PASSED`);
  console.log('==================================================');

  if (passedTests === totalTests) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runAllTests();
