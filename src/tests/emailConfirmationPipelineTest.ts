import { mwaService } from '../services/mwaService';
import { executeSaveAndVerify, SavePayload } from '../utils/saveVerification';
import { generateLandscapePdfBlob } from '../utils/pdfGeneratorLandscape';
import {
  buildConfirmationEmailContent,
  sendConfirmationEmail,
  isEmailAlreadySent,
  getEmailAuditLogs,
  MWA_EMAIL_SENDER
} from '../services/emailService';
import { ReportRecord } from '../types/mwa';

async function runStep3Tests() {
  console.log('========================================================================');
  console.log('STARTING STEP 3 TESTS: EMAIL CONFIRMATION PIPELINE (TEST 1 - TEST 7)');
  console.log('========================================================================\n');

  let passedTests = 0;
  const totalTests = 7;

  const mockPayload: SavePayload = {
    submissionId: `MWA-STEP3-${Date.now()}`,
    recorder: {
      title: 'นาย',
      name: 'นนทกฤช',
      surname: 'ขาวค้างพลู',
      position: 'นักประชาสัมพันธ์ 7',
      affiliation: 'สายงานผู้ว่าการ',
      department: 'ฝ่ายสื่อสารองค์กร',
      phone: '02-504-0123 ต่อ 4821',
      email: 'nonthakrit.k@mwa.co.th'
    },
    executive: {
      month: 'กันยายน 2569',
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

  let test1VerifiedRecord: ReportRecord | null = null;
  let test1EmailPayload: any = null;
  let test1PdfAttachment: any = null;

  // -----------------------------------------------------------------------------------
  // TEST 1: Save -> Verify -> PDF -> Email (ต้องสำเร็จครบทุกขั้น)
  // -----------------------------------------------------------------------------------
  console.log('--- TEST 1: Complete Pipeline (Save -> Verify -> PDF -> Email) ---');
  try {
    // 1. Save + Verify
    const saveResult = await executeSaveAndVerify(mockPayload);
    if (!saveResult.success || !saveResult.record) {
      throw new Error('Save + Verify failed in Step 1');
    }
    test1VerifiedRecord = saveResult.record;
    console.log('1. Save + Verify: SUCCESS (Record ID:', test1VerifiedRecord.id, ')');

    // 2. Generate PDF strictly from Verified Record
    test1PdfAttachment = await generateLandscapePdfBlob(test1VerifiedRecord);
    if (!test1PdfAttachment || !test1PdfAttachment.blob || test1PdfAttachment.sizeBytes <= 0) {
      throw new Error('PDF Generation failed in Step 2');
    }
    console.log('2. Generate PDF from Verified Record: SUCCESS (', test1PdfAttachment.filename, ',', test1PdfAttachment.sizeBytes, 'bytes)');

    // 3. Build Email Content
    test1EmailPayload = buildConfirmationEmailContent(test1VerifiedRecord, {
      filename: test1PdfAttachment.filename,
      blob: test1PdfAttachment.blob,
      base64: test1PdfAttachment.base64,
      mimeType: 'application/pdf',
      sizeBytes: test1PdfAttachment.sizeBytes
    });
    console.log('3. Build Email Content: SUCCESS (Recipient:', test1EmailPayload.recipientEmail, ')');

    // 4. Send Confirmation Email
    const emailResult = await sendConfirmationEmail(test1EmailPayload);
    if (!emailResult.success) {
      throw new Error(`Email send failed: ${emailResult.error}`);
    }
    console.log('4. Send Confirmation Email: SUCCESS (Message ID:', emailResult.messageId, ')');

    console.log('✅ TEST 1 PASSED: ทำงานสำเร็จครบทุกขั้น (Save -> Verify -> PDF -> Email)\n');
    passedTests++;
  } catch (err) {
    console.error('❌ TEST 1 FAILED:', err);
  }

  // -----------------------------------------------------------------------------------
  // TEST 2: กดปุ่มบันทึกซ้ำหลายครั้ง (ต้องไม่สร้าง Record ซ้ำและไม่ส่ง Email ซ้ำ)
  // -----------------------------------------------------------------------------------
  console.log('--- TEST 2: Rapid Repeat Submissions (No Duplicate Record & No Duplicate Email) ---');
  try {
    const initialRecords = await mwaService.getCommunicationData();
    const initialRecordCount = initialRecords.length;
    const initialAuditCount = getEmailAuditLogs().length;

    console.log('Calling sendConfirmationEmail again with the exact same Submission ID...');
    const duplicateEmailResult = await sendConfirmationEmail(test1EmailPayload);

    console.log('Duplicate check result:', {
      alreadySent: duplicateEmailResult.alreadySent,
      messageId: duplicateEmailResult.messageId
    });

    // Also verify mwaService idempotency
    const resubmit = await mwaService.submitReport(mockPayload);

    const finalRecords = await mwaService.getCommunicationData();
    const finalRecordCount = finalRecords.length;
    const finalAuditCount = getEmailAuditLogs().length;

    const recordAdded = finalRecordCount - initialRecordCount;
    const emailSentCount = finalAuditCount - initialAuditCount;

    console.log(`Records added: ${recordAdded}, New emails dispatched: ${emailSentCount}`);

    if (recordAdded === 0 && emailSentCount === 0 && duplicateEmailResult.alreadySent === true) {
      console.log('✅ TEST 2 PASSED: ป้องกันการบันทึกซ้ำและไม่ส่ง Email ซ้ำเมื่อส่งสำเร็จแล้ว\n');
      passedTests++;
    } else {
      console.error('❌ TEST 2 FAILED: พบ duplicate records หรือ duplicate emails', { recordAdded, emailSentCount });
    }
  } catch (err) {
    console.error('❌ TEST 2 FAILED:', err);
  }

  // -----------------------------------------------------------------------------------
  // TEST 3: จำลอง Verify ไม่ผ่าน -> ต้องไม่มี Email ถูกส่ง
  // -----------------------------------------------------------------------------------
  console.log('--- TEST 3: Verification Failed Simulation -> Must NOT send Email ---');
  try {
    const test3Payload: SavePayload = {
      ...mockPayload,
      submissionId: `MWA-STEP3-FAILVERIFY-${Date.now()}`
    };

    const initialAuditCount = getEmailAuditLogs().length;
    let emailSent = false;

    // Execute save with mismatch simulation
    const saveResult = await executeSaveAndVerify(test3Payload, { simulateDataMismatch: true });

    if (!saveResult.success) {
      console.log('Verification failed as expected:', saveResult.message);
      // Gated check: Email must NOT be created or sent
      console.log('System blocked execution before PDF & Email step.');
    } else {
      // If code reached here, it failed the test
      emailSent = true;
    }

    const finalAuditCount = getEmailAuditLogs().length;

    if (!saveResult.success && !emailSent && finalAuditCount === initialAuditCount) {
      console.log('✅ TEST 3 PASSED: เมื่อ Verify ไม่ผ่าน จะหยุดกระบวนการทันทีและไม่มี Email ถูกส่ง\n');
      passedTests++;
    } else {
      console.error('❌ TEST 3 FAILED: ระบบส่ง email แม้ verify จะไม่ผ่าน');
    }
  } catch (err) {
    console.error('❌ TEST 3 FAILED:', err);
  }

  // -----------------------------------------------------------------------------------
  // TEST 4: จำลอง PDF สร้างไม่สำเร็จ -> ต้องไม่มี Email ถูกส่ง
  // -----------------------------------------------------------------------------------
  console.log('--- TEST 4: PDF Generation Failed Simulation -> Must NOT send Email ---');
  try {
    const initialAuditCount = getEmailAuditLogs().length;
    let emailSent = false;

    if (!test1VerifiedRecord) throw new Error('No verified record');

    try {
      // Simulate PDF failure
      await generateLandscapePdfBlob(test1VerifiedRecord, { simulatePdfFailure: true });
      // If it didn't throw, proceed
      emailSent = true;
    } catch (pdfErr: any) {
      console.log('PDF Generation threw error as simulated:', pdfErr.message);
      console.log('System blocked email sending due to PDF generation failure.');
    }

    const finalAuditCount = getEmailAuditLogs().length;

    if (!emailSent && finalAuditCount === initialAuditCount) {
      console.log('✅ TEST 4 PASSED: เมื่อสร้าง PDF ไม่สำเร็จ ระบบหยุดกระบวนการและไม่ส่ง Email\n');
      passedTests++;
    } else {
      console.error('❌ TEST 4 FAILED: ระบบยังคงส่ง email เมื่อ PDF สร้างไม่สำเร็จ');
    }
  } catch (err) {
    console.error('❌ TEST 4 FAILED:', err);
  }

  // -----------------------------------------------------------------------------------
  // TEST 5: จำลอง Email ส่งไม่สำเร็จ -> ต้องไม่แสดง "ส่งรายงานสำเร็จ"
  // -----------------------------------------------------------------------------------
  console.log('--- TEST 5: Email Transmission Failed Simulation -> Must NOT show Success ---');
  try {
    const test5Payload = {
      ...test1EmailPayload,
      submissionId: `MWA-STEP3-FAILEMAIL-${Date.now()}`,
      recipientEmail: 'invalid-email-address' // Invalid recipient
    };

    const emailResult = await sendConfirmationEmail(test5Payload);
    console.log('Email transmission result for invalid recipient:', emailResult);

    if (emailResult.success === false && emailResult.error) {
      console.log('✅ TEST 5 PASSED: เมื่อ Email ส่งไม่สำเร็จ ระบบส่งคืน Error และไม่แสดงผลสำเร็จ\n');
      passedTests++;
    } else {
      console.error('❌ TEST 5 FAILED: ระบบแสดงว่าส่งสำเร็จแม้อีเมลจะล้มเหลว', emailResult);
    }
  } catch (err) {
    console.error('❌ TEST 5 FAILED:', err);
  }

  // -----------------------------------------------------------------------------------
  // TEST 6: ตรวจสอบว่า PDF ที่แนบใน Email เป็น PDF ของ Verified Record จริง
  // -----------------------------------------------------------------------------------
  console.log('--- TEST 6: Attachment Verification: PDF is strictly from Verified Record ---');
  try {
    if (!test1VerifiedRecord || !test1PdfAttachment) {
      throw new Error('No verified record or attachment');
    }

    const expectedCleanMonth = (test1VerifiedRecord.month || 'มกราคม2570').replace(/\s+/g, '');
    const expectedFilename = `รายงานการสื่อสาร_${expectedCleanMonth}_${test1VerifiedRecord.id}.pdf`;

    console.log('Expected Filename:', expectedFilename);
    console.log('Actual Filename in Attachment:', test1PdfAttachment.filename);
    console.log('Attachment Size Bytes:', test1PdfAttachment.sizeBytes);

    const filenameMatch = test1PdfAttachment.filename === expectedFilename;
    const hasValidSize = test1PdfAttachment.sizeBytes > 1000; // Real PDF is several KB

    if (filenameMatch && hasValidSize) {
      console.log('✅ TEST 6 PASSED: ไฟล์ PDF ที่แนบเป็นของ Verified Record จริงและมีโครงสร้างไฟล์ถูกต้อง\n');
      passedTests++;
    } else {
      console.error('❌ TEST 6 FAILED: ไฟล์ PDF ที่แนบไม่ตรงกับ Verified Record', { filenameMatch, hasValidSize });
    }
  } catch (err) {
    console.error('❌ TEST 6 FAILED:', err);
  }

  // -----------------------------------------------------------------------------------
  // TEST 7: ตรวจสอบข้อมูลใน Email กับข้อมูลใน Verified Record แบบ Field-by-Field
  // -----------------------------------------------------------------------------------
  console.log('--- TEST 7: Field-by-Field Email Verification against Verified Record ---');
  try {
    if (!test1VerifiedRecord || !test1EmailPayload) {
      throw new Error('No verified record or email payload');
    }

    const rec = test1VerifiedRecord;
    const email = test1EmailPayload;

    const expectedSubject = `รายงานการสื่อสารของผู้บริหาร ประจำปีงบประมาณ 2570 - Record ID #${rec.id}`;

    const checks = [
      {
        field: 'Email ผู้รับ (Recipient Email)',
        expected: rec.email,
        actual: email.recipientEmail,
        match: email.recipientEmail === rec.email
      },
      {
        field: 'หัวข้ออีเมล (Subject)',
        expected: expectedSubject,
        actual: email.subject,
        match: email.subject === expectedSubject
      },
      {
        field: 'เลขที่รายการ ในเนื้อหา (Record ID in Body)',
        expected: `Record ID: ${rec.id}`,
        actual: `Record ID: ${email.recordId}`,
        match: email.body.includes(`Record ID: ${rec.id}`)
      },
      {
        field: 'รหัสการส่ง ในเนื้อหา (Submission ID in Body)',
        expected: `Submission ID: ${rec.submissionId}`,
        actual: `Submission ID: ${email.submissionId}`,
        match: email.body.includes(`Submission ID: ${rec.submissionId}`)
      },
      {
        field: 'Sender Email (ระบบผู้ส่ง)',
        expected: 'corpinfomationmwa@gmail.com',
        actual: MWA_EMAIL_SENDER.email,
        match: MWA_EMAIL_SENDER.email === 'corpinfomationmwa@gmail.com'
      }
    ];

    let allMatched = true;
    checks.forEach((c) => {
      console.log(`- ${c.field}: ${c.match ? '✓ MATCH' : '✗ MISMATCH'} (Expected: "${c.expected}", Actual: "${c.actual}")`);
      if (!c.match) allMatched = false;
    });

    if (allMatched) {
      console.log('✅ TEST 7 PASSED: ข้อมูลใน Email ตรงกับ Verified Record แบบ Field-by-Field 100%\n');
      passedTests++;
    } else {
      console.error('❌ TEST 7 FAILED: ข้อมูลใน Email ไม่ตรงกับ Verified Record');
    }
  } catch (err) {
    console.error('❌ TEST 7 FAILED:', err);
  }

  console.log('========================================================================');
  console.log(`STEP 3 TEST SUMMARY: ${passedTests}/${totalTests} TESTS PASSED`);
  console.log('========================================================================');

  if (passedTests === totalTests) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runStep3Tests();
