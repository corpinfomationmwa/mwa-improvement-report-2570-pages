import { buildConfirmationEmailContent, sendConfirmationEmail, MWA_EMAIL_SENDER } from '../services/emailService';
import { ReportRecord } from '../types/mwa';

async function runRealEmailValidation() {
  console.log('========================================================================');
  console.log('REAL EMAIL DISPATCHER VERIFICATION TEST');
  console.log('Sender: corpinfomationmwa@gmail.com');
  console.log('========================================================================\n');

  const dummyRecord: ReportRecord = {
    id: 9991,
    submissionId: 'MWA-TEST-GMAIL-9991',
    recordDate: '2026-09-30',
    recorder: 'นาย สมศักดิ์ สุขประเสริฐ',
    recorderPosition: 'นักวิชาการคอมพิวเตอร์ 6',
    recorderAffiliation: 'สายงานเทคโนโลยีดิจิทัล',
    recorderDepartment: 'ฝ่ายพัฒนาระบบงานดิจิทัล',
    phone: '02-504-0123 ต่อ 4821',
    email: 'kcpong10@gmail.com',
    executiveMonth: 'มกราคม 2570',
    month: 'มกราคม 2570',
    speaker: 'นาย สุรชัย วงศ์ปัญญา',
    speakerPosition: 'รองผู้ว่าการ (เทคโนโลยีดิจิทัล)',
    speakerAffiliation: 'สายงานเทคโนโลยีดิจิทัล',
    speakerDepartment: 'ฝ่ายพัฒนาระบบงานดิจิทัล',
    topics: 'การปรับปรุงระบบงานดิจิทัลและการสื่อสาร',
    channel: 'การประชุมผู้บริหาร',
    audience: 'ผู้บริหารระดับฝ่ายและกอง',
    evidence: 'รายงาน.pdf',
    problems: 'ไม่มี',
    suggestions: 'เร่งรัดการดำเนินงาน'
  };

  const samplePdfAttachment = {
    filename: 'MWA_Communication_Report_9991_MWA-TEST-GMAIL-9991.pdf',
    base64: 'JVBERi0xLjQKJcTl8uXrCjEgMCBvYmoKPDwKL1R5cGUgL0NhdGFsb2cKL1BhZ2VzIDIgMCBSCj4+CmVuZG9iaiAyIDAgb2JqCjw8Ci9UeXBlIC9QYWdlcwovS2lkcyBbMyAwIFJdCi9Db3VudCAxCj4+CmVuZG9iaiAzIDAgb2JqCjw8Ci9UeXBlIC9QYWdlCi9QYXJlbnQgMiAwIFIKL01lZGlhQm94IFswIDAgNTk1IDg0Ml0KPj4KZW5kb2JqCnRyYWlsZXIKPDwKL1Jvb3QgMSAwIFIKPj4KJSVFT0YK',
    mimeType: 'application/pdf',
    sizeBytes: 180
  };

  // -----------------------------------------------------------------------------------
  // TEST 1: Dispatch to Gmail (kcpong10@gmail.com)
  // -----------------------------------------------------------------------------------
  console.log('--- TEST 1: Dispatch to Gmail (kcpong10@gmail.com) ---');
  const gmailPayload = buildConfirmationEmailContent(dummyRecord, samplePdfAttachment);
  console.log('Sender Email:', MWA_EMAIL_SENDER.email);
  console.log('Recipient Email:', gmailPayload.recipientEmail);
  console.log('Subject:', gmailPayload.subject);
  console.log('Record ID:', gmailPayload.recordId);
  console.log('Submission ID:', gmailPayload.submissionId);

  const gmailResult = await sendConfirmationEmail(gmailPayload);
  console.log('Test 1 Dispatch Result:', {
    success: gmailResult.success,
    status: gmailResult.status,
    recipient: gmailResult.recipient,
    error: gmailResult.error || 'none'
  });

  if (gmailResult.success && gmailResult.status === 'EMAIL_SENT') {
    console.log('✅ TEST 1 PASSED: Gmail Delivery Confirmed (EMAIL_SENT)\n');
  } else {
    console.log(`ℹ️ TEST 1 RESULT: Email service reported ${gmailResult.status}: "${gmailResult.error}"\n`);
  }

  // -----------------------------------------------------------------------------------
  // TEST 2: Dispatch to Hotmail / Outlook (kingkong_noy@hotmail.com)
  // -----------------------------------------------------------------------------------
  console.log('--- TEST 2: Dispatch to Hotmail (kingkong_noy@hotmail.com) ---');
  const hotmailRecord: ReportRecord = {
    ...dummyRecord,
    id: 9992,
    submissionId: 'MWA-TEST-HOTMAIL-9992',
    email: 'kingkong_noy@hotmail.com'
  };

  const hotmailAttachment = {
    ...samplePdfAttachment,
    filename: 'MWA_Communication_Report_9992_MWA-TEST-HOTMAIL-9992.pdf'
  };

  const hotmailPayload = buildConfirmationEmailContent(hotmailRecord, hotmailAttachment);
  console.log('Sender Email:', MWA_EMAIL_SENDER.email);
  console.log('Recipient Email:', hotmailPayload.recipientEmail);
  console.log('Subject:', hotmailPayload.subject);
  console.log('Record ID:', hotmailPayload.recordId);
  console.log('Submission ID:', hotmailPayload.submissionId);

  const hotmailResult = await sendConfirmationEmail(hotmailPayload);
  console.log('Test 2 Dispatch Result:', {
    success: hotmailResult.success,
    status: hotmailResult.status,
    recipient: hotmailResult.recipient,
    error: hotmailResult.error || 'none'
  });

  if (hotmailResult.success && hotmailResult.status === 'EMAIL_SENT') {
    console.log('✅ TEST 2 PASSED: Hotmail Delivery Confirmed (EMAIL_SENT)\n');
  } else {
    console.log(`ℹ️ TEST 2 RESULT: Email service reported ${hotmailResult.status}: "${hotmailResult.error}"\n`);
  }

  console.log('========================================================================');
  console.log('REAL EMAIL VALIDATION TEST COMPLETED');
  console.log('========================================================================');
}

runRealEmailValidation().catch(console.error);
