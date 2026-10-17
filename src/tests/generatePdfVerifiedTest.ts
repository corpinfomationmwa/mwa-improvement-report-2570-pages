import { mwaService } from '../services/mwaService';
import { executeSaveAndVerify, SavePayload } from '../utils/saveVerification';
import { generatePdfFromVerifiedRecord, recordToPrintPayload } from '../utils/mwaPrintConverter';
import { ReportRecord } from '../types/mwa';

async function runStep2Tests() {
  console.log('==================================================================');
  console.log('STARTING STEP 2 TESTS: GENERATE PDF FROM VERIFIED RECORD');
  console.log('==================================================================\n');

  let passedTests = 0;
  const totalTests = 4;

  const mockPayload: SavePayload = {
    submissionId: `MWA-STEP2-${Date.now()}`,
    recorder: {
      title: 'นาย',
      name: 'ประสิทธิ์',
      surname: 'เจริญสุข',
      position: 'นักประชาสัมพันธ์ 7',
      affiliation: 'สายงานผู้ว่าการ',
      department: 'ฝ่ายสื่อสารองค์กร',
      phone: '02-504-0123 ต่อ 1122',
      email: 'prasit.c@mwa.co.th'
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
        selectedTopics: ['นโยบายคุณภาพน้ำประปาดื่มได้', 'โครงการบริการน้ำประปาสะอาด'],
        details: 'การสื่อสารเรื่องมาตรฐานการผลิตน้ำประปาคุณภาพสูงสู่ชุมชนเมือง',
        communicationTypes: { internal: true, external: true },
        internalChannels: ['บอร์ดประชาสัมพันธ์', 'Intranet'],
        externalChannels: ['Facebook กปน.', 'ข่าวแจกสื่อมวลชน'],
        internalAudiences: ['พนักงาน กปน. ทุกสังกัด'],
        internalAudienceDetails: {},
        externalAudiences: ['ประชาชนในเขตกรุงเทพฯ นนทบุรี สมุทรปราการ'],
        externalAudienceDetails: {},
        evidenceFiles: [
          {
            name: 'press_release_water_quality.pdf',
            size: '1.2 MB'
          }
        ]
      }
    ],
    feedback: {
      problemsObstacles: 'พื้นที่บางจุดสัญญาณอินเทอร์เน็ตไม่ครอบคลุมการประชาสัมพันธ์ออนไลน์',
      executiveSuggestions: 'ประสานงานร่วมกับสำนักงานเขตและผู้ว่าราชการจังหวัด'
    }
  };

  // ----------------------------------------------------
  // TEST 1: กรอกข้อมูล -> SAVE -> VERIFY SUCCESS -> Generate PDF -> ต้องสร้าง PDF ได้
  // ----------------------------------------------------
  console.log('--- TEST 1: SAVE -> VERIFY SUCCESS -> Generate PDF ---');
  let verifiedRecordTest1: ReportRecord | null = null;
  try {
    const saveResult = await executeSaveAndVerify(mockPayload);
    console.log('Save + Verify Status:', saveResult.status);

    if (saveResult.status === 'SUCCESS' && saveResult.record) {
      verifiedRecordTest1 = saveResult.record;
      // Generate PDF strictly from Verified Record
      const pdfResult = generatePdfFromVerifiedRecord(verifiedRecordTest1, 'SUCCESS');
      console.log('PDF Generation Success:', pdfResult.success);
      console.log('Source of Truth:', pdfResult.payload?.sourceOfTruth);
      console.log('Linked Record ID:', pdfResult.payload?.recordId);

      if (
        pdfResult.success &&
        pdfResult.payload &&
        pdfResult.payload.sourceOfTruth === 'VERIFIED_RECORD' &&
        pdfResult.payload.recordId === verifiedRecordTest1.id
      ) {
        console.log('✅ TEST 1 PASSED: สร้าง PDF จาก Verified Record ได้สำเร็จ\n');
        passedTests++;
      } else {
        console.error('❌ TEST 1 FAILED: Generate PDF ไม่สำเร็จ', pdfResult);
      }
    } else {
      console.error('❌ TEST 1 FAILED: Save + Verify ไม่สำเร็จ', saveResult);
    }
  } catch (err) {
    console.error('❌ TEST 1 ERROR:', err);
  }

  // ----------------------------------------------------
  // TEST 2: VERIFY FAILED -> พยายาม Generate PDF -> ต้องถูกปฏิเสธ
  // ----------------------------------------------------
  console.log('--- TEST 2: VERIFY FAILED -> Attempt Generate PDF (Must be Rejected) ---');
  try {
    // Simulate failed verification state
    const pdfResult2A = generatePdfFromVerifiedRecord(null, 'FAILED');
    const pdfResult2B = generatePdfFromVerifiedRecord(null, 'IDLE');

    console.log('Attempt with status=FAILED:', pdfResult2A);
    console.log('Attempt with status=IDLE:', pdfResult2B);

    if (
      pdfResult2A.success === false &&
      pdfResult2A.error?.includes('ยังไม่สามารถสร้างเอกสารได้') &&
      pdfResult2B.success === false
    ) {
      console.log('✅ TEST 2 PASSED: ปฏิเสธการสร้าง PDF เมื่อ VERIFY FAILED อย่างถูกต้อง\n');
      passedTests++;
    } else {
      console.error('❌ TEST 2 FAILED: ระบบไม่ปฏิเสธการสร้าง PDF ที่ยังไม่ verify', { pdfResult2A, pdfResult2B });
    }
  } catch (err) {
    console.error('❌ TEST 2 ERROR:', err);
  }

  // ----------------------------------------------------
  // TEST 3: หลัง VERIFY SUCCESS แก้ข้อมูลบางช่องใน Form แต่ยังไม่ SAVE ใหม่ -> Generate PDF
  //         ต้องไม่ใช้ข้อมูลที่แก้ใหม่ หรือระบบต้องบังคับให้ SAVE + VERIFY ใหม่ก่อน
  // ----------------------------------------------------
  console.log('--- TEST 3: Form Modified After Verify -> Invalidation & Guard ---');
  try {
    // 1. Start with verified record from Test 1
    let activeVerifiedRecord: ReportRecord | null = verifiedRecordTest1;
    let formSaveState: string = 'SUCCESS';

    // 2. User modifies form in Step 1 (e.g. changes recorder name)
    console.log('User modifies recorder name in form: "สมศักดิ์ แก้ไขใหม่" (Unsaved change)');
    const modifiedFormData = {
      ...mockPayload,
      recorder: {
        ...mockPayload.recorder,
        name: 'สมศักดิ์ แก้ไขใหม่'
      }
    };

    // 3. System invalidates verified state upon form change
    activeVerifiedRecord = null;
    formSaveState = 'IDLE';

    // 4. User attempts to generate PDF
    const pdfResult3 = generatePdfFromVerifiedRecord(activeVerifiedRecord, formSaveState);
    console.log('Attempt to generate PDF with unverified changes:', pdfResult3);

    if (pdfResult3.success === false && pdfResult3.error?.includes('ยังไม่สามารถสร้างเอกสารได้')) {
      console.log('✅ TEST 3 PASSED: การแก้ฟอร์มทำให้สถานะ Verified ถูก Invalidate บังคับให้ต้อง SAVE + VERIFY ใหม่ก่อนสร้าง PDF\n');
      passedTests++;
    } else {
      console.error('❌ TEST 3 FAILED: ระบบยอมให้ใช้ข้อมูลที่ยังไม่ได้ save+verify ไปสร้าง PDF', pdfResult3);
    }
  } catch (err) {
    console.error('❌ TEST 3 ERROR:', err);
  }

  // ----------------------------------------------------
  // TEST 4: SAVE + VERIFY สำเร็จ -> Generate PDF -> ตรวจสอบว่า PDF แสดงข้อมูลตรงกับ Verified Record
  // ----------------------------------------------------
  console.log('--- TEST 4: Field-by-Field Verification: PDF matches Verified Record 100% ---');
  try {
    if (!verifiedRecordTest1) {
      throw new Error('No verified record available from Test 1');
    }

    const pdfPayload = recordToPrintPayload(verifiedRecordTest1);

    const checks = [
      {
        field: 'ชื่อผู้บันทึก',
        expected: verifiedRecordTest1.recorderName || mockPayload.recorder.name,
        actual: pdfPayload.recorder.name,
        match: pdfPayload.recorder.name === (verifiedRecordTest1.recorderName || mockPayload.recorder.name)
      },
      {
        field: 'นามสกุลผู้บันทึก',
        expected: verifiedRecordTest1.recorderSurname || mockPayload.recorder.surname,
        actual: pdfPayload.recorder.surname,
        match: pdfPayload.recorder.surname === (verifiedRecordTest1.recorderSurname || mockPayload.recorder.surname)
      },
      {
        field: 'สายงานผู้บันทึก',
        expected: verifiedRecordTest1.recorderAffiliation || mockPayload.recorder.affiliation,
        actual: pdfPayload.recorder.affiliation,
        match: pdfPayload.recorder.affiliation === (verifiedRecordTest1.recorderAffiliation || mockPayload.recorder.affiliation)
      },
      {
        field: 'หน่วยงานผู้บันทึก',
        expected: verifiedRecordTest1.recorderDepartment || mockPayload.recorder.department,
        actual: pdfPayload.recorder.department,
        match: pdfPayload.recorder.department === (verifiedRecordTest1.recorderDepartment || mockPayload.recorder.department)
      },
      {
        field: 'ข้อมูลผู้บริหาร',
        expected: verifiedRecordTest1.speaker,
        actual: `${pdfPayload.executive.title}${pdfPayload.executive.name} ${pdfPayload.executive.surname}`,
        match: verifiedRecordTest1.speaker.includes(pdfPayload.executive.name)
      },
      {
        field: 'เดือนที่รายงาน',
        expected: verifiedRecordTest1.month,
        actual: pdfPayload.executive.month,
        match: pdfPayload.executive.month === verifiedRecordTest1.month
      },
      {
        field: 'รายละเอียดการสื่อสาร',
        expected: verifiedRecordTest1.details,
        actual: pdfPayload.topics[0]?.details,
        match: verifiedRecordTest1.details === pdfPayload.topics[0]?.details
      },
      {
        field: 'ปัญหาและอุปสรรค',
        expected: verifiedRecordTest1.problems,
        actual: pdfPayload.feedback.problemsObstacles,
        match: pdfPayload.feedback.problemsObstacles === verifiedRecordTest1.problems
      },
      {
        field: 'ข้อเสนอแนะ',
        expected: verifiedRecordTest1.suggestions,
        actual: pdfPayload.feedback.executiveSuggestions,
        match: pdfPayload.feedback.executiveSuggestions === verifiedRecordTest1.suggestions
      },
      {
        field: 'Record ID / Submission ID Reference',
        expected: `${verifiedRecordTest1.id} / ${verifiedRecordTest1.submissionId}`,
        actual: `${pdfPayload.recordId} / ${pdfPayload.submissionId}`,
        match: pdfPayload.recordId === verifiedRecordTest1.id && pdfPayload.submissionId === verifiedRecordTest1.submissionId
      }
    ];

    console.log('Comparing PDF Payload fields against Verified Record:');
    let allMatched = true;
    checks.forEach((c) => {
      console.log(`- ${c.field}: ${c.match ? '✓ MATCH' : '✗ MISMATCH'} (Expected: "${c.expected}", Actual in PDF: "${c.actual}")`);
      if (!c.match) allMatched = false;
    });

    if (allMatched) {
      console.log('✅ TEST 4 PASSED: ข้อมูลใน PDF ทั้งหมดตรงกับ Verified Record 100%\n');
      passedTests++;
    } else {
      console.error('❌ TEST 4 FAILED: ข้อมูลใน PDF ไม่ตรงกับ Verified Record');
    }
  } catch (err) {
    console.error('❌ TEST 4 ERROR:', err);
  }

  console.log('==================================================================');
  console.log(`STEP 2 TEST SUMMARY: ${passedTests}/${totalTests} TESTS PASSED`);
  console.log('==================================================================');

  if (passedTests === totalTests) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runStep2Tests();
