import { ReportRecord } from '../types/mwa';
import { submitReportToBackend, retryEmailWithBackend } from './backendService';
import { getCurrentPdfBase64, getCurrentPdfBlob, getCurrentPdfFileName } from './currentPdfStore';

export interface EmailAttachment {
  filename: string;
  blob?: Blob;
  base64?: string;
  mimeType: string;
  sizeBytes?: number;
}

export interface EmailPayload {
  recordId: number;
  submissionId: string;
  recipientEmail: string;
  recipientName: string;
  subject: string;
  body: string;
  htmlBody?: string;
  month: string;
  affiliation: string;
  department: string;
  pdfAttachment: EmailAttachment;
  record?: ReportRecord;
  executiveName: string;
  communicationMonth: string;
  recorderName: string;
  recorderEmail: string;
}

export interface EmailSendResult {
  success: boolean;
  status: 'EMAIL_SENT' | 'EMAIL_FAILED' | 'EMAIL_SUCCESS';
  stage?: string;
  messageId?: string;
  sentAt?: string;
  sender: string;
  recipient: string;
  subject: string;
  attachmentName: string;
  alreadySent?: boolean;
  error?: string;
  driveFileUrl?: string;
}

export interface EmailAuditLog {
  id: string;
  recordId: number;
  submissionId: string;
  recipient: string;
  subject: string;
  sentAt: string;
  status: 'SENT' | 'FAILED';
  attachmentName: string;
}

// System Sender Configuration: corpinfomationmwa@gmail.com
export const MWA_EMAIL_SENDER = {
  name: 'ส่วนข้อมูลข่าวสารและประเมินผลการสื่อสาร ฝ่ายสื่อสารองค์กร การประปานครหลวง',
  email: 'corpinfomationmwa@gmail.com'
};

// Internal registry for Duplicate Email Prevention (Idempotency)
const sentEmailRegistry = new Set<string>();
const emailAuditLogs: EmailAuditLog[] = [];

/**
 * Converts a Blob to a base64 string
 */
async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve(reader.result as string);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Builds the official MWA Confirmation Email content from a Verified Record.
 * Strictly uses data from Verified Record as the single Source of Truth.
 */
/**
 * Normalizes recipient email from any possible property name.
 * Searches: email, recipientEmail, emailRecipient, receiverEmail, Email, อีเมล, emailผู้รับ, etc.
 */
export function normalizeRecipientEmail(...sources: any[]): string {
  for (const source of sources) {
    if (!source) continue;
    if (typeof source === 'string' && source.includes('@')) {
      return source.trim();
    }
    if (typeof source === 'object') {
      const candidate =
        source.email ||
        source.recipientEmail ||
        source.emailRecipient ||
        source.receiverEmail ||
        source.Email ||
        source['อีเมล'] ||
        source['emailผู้รับ'] ||
        source.to ||
        source.recorderEmail ||
        source.userEmail ||
        source.targetEmail ||
        source.data?.email ||
        source.data?.recipientEmail ||
        source.data?.['อีเมล'] ||
        source.data?.['emailผู้รับ'] ||
        source.rawRecorder?.email ||
        source.rawRecorder?.['อีเมล'] ||
        source.rawRecorder?.['emailผู้รับ'] ||
        source.recorder?.email ||
        source.recorder?.['อีเมล'] ||
        source.recorder?.['emailผู้รับ'] ||
        '';

      if (typeof candidate === 'string' && candidate.trim().length > 0 && candidate.includes('@')) {
        return candidate.trim();
      }
    }
  }
  return '';
}

/**
 * Builds the official Confirmation Email Payload strictly from a Verified Record.
 * Extract 100% dynamic values: executiveName, communicationMonth, recorderName, recorderEmail
 */
export function buildConfirmationEmailContent(
  record: ReportRecord,
  pdfAttachment: EmailAttachment,
  fallbackEmail?: string
): EmailPayload {
  // 1. Resolve Executive Full Name from Verified Record
  const rawExec = record.rawExecutive;
  const execFullName = rawExec
    ? `${rawExec.title || ''}${rawExec.name || ''} ${rawExec.surname || ''}`.trim()
    : (record.executiveName
        ? `${record.executiveTitle || ''}${record.executiveName} ${record.executiveSurname || ''}`.trim()
        : (record.speaker || '').trim());
  const executiveName = execFullName;

  // 2. Resolve Communication Month from Verified Record
  const rawMonth = (
    rawExec?.month ||
    record.executiveMonth ||
    record.month ||
    ''
  ).trim();
  const communicationMonth = rawMonth.replace(/^ประจำเดือน\s*/, '').trim();

  // 3. Resolve Recorder Full Name & Position/Department from Verified Record
  const rawRec = record.rawRecorder;
  const recFullName = rawRec
    ? `${rawRec.title || ''}${rawRec.name || ''} ${rawRec.surname || ''}`.trim()
    : (record.recorderName
        ? `${record.recorderTitle || ''}${record.recorderName} ${record.recorderSurname || ''}`.trim()
        : (record.recorder || '').trim());
  const recorderName = recFullName;

  const recorderPositionOrDept = (
    rawRec?.position ||
    record.recorderPosition ||
    rawRec?.department ||
    record.recorderDepartment ||
    ''
  ).trim();

  const recorderWithPosition =
    recorderPositionOrDept && !recorderName.includes(`(${recorderPositionOrDept})`)
      ? `${recorderName} (${recorderPositionOrDept})`
      : recorderName;

  // 4. Resolve Recorder Email strictly from Verified Record
  const recorderEmail = normalizeRecipientEmail(
    record,
    rawRec,
    record.recorder,
    fallbackEmail
  );

  if (!recorderEmail || !recorderEmail.includes('@')) {
    throw new Error('ไม่พบ Email ผู้รับในข้อมูล Record ที่บันทึก');
  }

  const recordId = record.id;
  const submissionId = record.submissionId || `MWA-${recordId}`;

  // Subject as specified: รายงานการสื่อสารของผู้บริหาร ประจำปีงบประมาณ 2570 - Record ID #{recordId}
  const subject = `รายงานการสื่อสารของผู้บริหาร ประจำปีงบประมาณ 2570 - Record ID #${recordId}`;

  // Plain Text Body as specified (100% Plain Text, no HTML tags, no Markdown links)
  const body = `สวัสดีครับคุณ ${recorderWithPosition},

ส่วนข้อมูลข่าวสารและประเมินผลการสื่อสาร
กองบริหารภาพลักษณ์และแผนการสื่อสาร ฝ่ายสื่อสารองค์กร
ได้รับข้อมูลการส่งรายงานการสื่อสารภายในและภายนอกองค์กรสำหรับผู้บริหาร
ประจำปีงบประมาณ 2570 ที่ท่านได้บันทึกไว้เรียบร้อยแล้ว


(เอกสาร PDF รายงานฉบับเต็มได้ถูกแนบมาในอีเมลนี้แล้ว)


รายละเอียดโดยย่อ:
- ผู้บริหาร: ${executiveName}
- เดือนที่สื่อสาร: ${communicationMonth}
- ผู้บันทึก: ${recorderWithPosition} (${recorderEmail})


ส่วนข้อมูลข่าวสารและประเมินผลการสื่อสาร
กองบริหารภาพลักษณ์และแผนการสื่อสาร ฝ่ายสื่อสารองค์กร
ขอขอบคุณที่ส่งรายงานการสื่อสารภายในและภายนอกองค์กรสำหรับผู้บริหาร
ประจำปีงบประมาณ 2570


(นี่คืออีเมลอัตโนมัติ กรุณาอย่าตอบกลับ)`;

  const month = communicationMonth;
  const affiliation = record.speakerAffiliation || record.recorderAffiliation || '-';
  const department = record.speakerDepartment || record.recorderDepartment || '-';

  const standardAttachmentName = `MWA_Communication_Report_${recordId}_${submissionId}.pdf`;

  const sanitizedAttachment: EmailAttachment = {
    ...pdfAttachment,
    filename: pdfAttachment.filename || standardAttachmentName
  };

  return {
    recordId,
    submissionId,
    recipientEmail: recorderEmail,
    recipientName: recorderName,
    subject,
    body,
    month,
    affiliation,
    department,
    pdfAttachment: sanitizedAttachment,
    record,
    executiveName,
    communicationMonth,
    recorderName,
    recorderEmail
  };
}

/**
 * Sends real confirmation email with PDF attachment via Backend API / Google Apps Script.
 * Strictly verifies provider response and does NOT simulate success.
 */
export async function sendConfirmationEmail(payload: EmailPayload): Promise<EmailSendResult> {
  console.log('\n========================================');
  console.log('EMAIL_START');
  console.log('recipient:', payload.recipientEmail);
  console.log('subject:', payload.subject);
  console.log('recordId:', payload.recordId);
  console.log('submissionId:', payload.submissionId);
  console.log('========================================');

  // 1. Duplicate Email Prevention Check (Idempotency)
  const registryKey = `${payload.submissionId}::${payload.recordId}`;
  if (sentEmailRegistry.has(registryKey) || sentEmailRegistry.has(payload.submissionId)) {
    console.warn(`[MWA EMAIL SERVICE] Email already sent for Submission ID: ${payload.submissionId} (Record ID: ${payload.recordId}). Skipping duplicate send.`);
    return {
      success: true,
      status: 'EMAIL_SENT',
      alreadySent: true,
      sender: MWA_EMAIL_SENDER.email,
      recipient: payload.recipientEmail,
      subject: payload.subject,
      attachmentName: payload.pdfAttachment.filename,
      messageId: `MWA-MSG-ALREADY-SENT-${payload.recordId}`
    };
  }

  // 2. Validate Recipient Email
  if (!payload.recipientEmail || !payload.recipientEmail.includes('@')) {
    const errorMsg = 'ไม่พบ Email ผู้รับ';
    console.log('[MWA Email Service] Validation notice:', errorMsg);
    return {
      success: false,
      status: 'EMAIL_FAILED',
      sender: MWA_EMAIL_SENDER.email,
      recipient: payload.recipientEmail,
      subject: payload.subject,
      attachmentName: payload.pdfAttachment.filename,
      error: errorMsg
    };
  }

  // 3. Validate PDF Attachment & Base64 (from Web Page PDF Single Source of Truth)
  let rawPdfBase64 = payload.pdfAttachment?.base64 || getCurrentPdfBase64() || undefined;
  const authoritativeBlob = payload.pdfAttachment?.blob || getCurrentPdfBlob() || undefined;
  if (!rawPdfBase64 && authoritativeBlob) {
    try {
      rawPdfBase64 = await blobToBase64(authoritativeBlob);
    } catch (err) {
      console.error('[MWA Email Service] Blob to Base64 conversion failed:', err);
    }
  }

  const cleanPdfBase64 = (rawPdfBase64 || '').replace(/^data:application\/pdf;base64,/, '').trim();

  if (!cleanPdfBase64 || cleanPdfBase64.length <= 1000) {
    const errorMsg = 'สร้าง PDF ไม่สำเร็จ จึงยังไม่ส่ง Email';
    console.log('[MWA Email Service] Validation notice:', errorMsg);
    return {
      success: false,
      status: 'EMAIL_FAILED',
      sender: MWA_EMAIL_SENDER.email,
      recipient: payload.recipientEmail,
      subject: payload.subject,
      attachmentName: payload.pdfAttachment?.filename || getCurrentPdfFileName() || '',
      error: errorMsg
    };
  }

  try {
    const pdfFileName =
      payload.pdfAttachment?.filename ||
      getCurrentPdfFileName() ||
      `MWA_Communication_Report_${payload.recordId}_${payload.submissionId}.pdf`;
    const pdfBlob = authoritativeBlob;

    console.log("PDF filename:", pdfFileName);
    console.log("PDF mimeType:", pdfBlob?.type || "application/pdf");
    console.log("PDF size:", pdfBlob ? pdfBlob.size : (payload.pdfAttachment?.sizeBytes || cleanPdfBase64.length));
    console.log("PDF base64 length:", cleanPdfBase64.length);

    console.log({
      recipient: payload.recipientEmail,
      subject: payload.subject,
      pdfFileName,
      pdfMimeType: "application/pdf",
      pdfBase64Length: cleanPdfBase64.length
    });

    // 5. Send to Google Apps Script Web App Backend via submitReportToBackend
    const backendResult = await submitReportToBackend({
      action: 'sendEmail',
      to: payload.recipientEmail,
      recipient: payload.recipientEmail,
      subject: payload.subject,
      body: payload.body,
      pdf: {
        fileName: payload.pdfAttachment.filename,
        mimeType: 'application/pdf',
        base64: cleanPdfBase64
      },
      reportData: {
        executive: payload.executiveName,
        communicationMonth: payload.communicationMonth,
        recorder: payload.recorderName,
        recorderEmail: payload.recorderEmail
      },
      executiveName: payload.executiveName,
      communicationMonth: payload.communicationMonth,
      recorderName: payload.recorderName,
      recorderEmail: payload.recorderEmail,
      recordId: payload.recordId,
      submissionId: payload.submissionId,
      pdfFileName: payload.pdfAttachment.filename,
      pdfBase64: cleanPdfBase64,
      recipientEmail: payload.recipientEmail,
      email: payload.recipientEmail,
      emailRecipient: payload.recipientEmail,
      receiverEmail: payload.recipientEmail,
      Email: payload.recipientEmail,
      ['อีเมล']: payload.recipientEmail,
      ['emailผู้รับ']: payload.recipientEmail,
      userEmail: payload.recipientEmail,
      senderEmail: MWA_EMAIL_SENDER.email,
      data: {
        recipient: payload.recipientEmail,
        recipientEmail: payload.recipientEmail,
        email: payload.recipientEmail,
        emailRecipient: payload.recipientEmail,
        receiverEmail: payload.recipientEmail,
        Email: payload.recipientEmail,
        ['อีเมล']: payload.recipientEmail,
        ['emailผู้รับ']: payload.recipientEmail,
        recordId: payload.recordId,
        submissionId: payload.submissionId,
        subject: payload.subject,
        body: payload.body,
        executiveName: payload.executiveName,
        communicationMonth: payload.communicationMonth,
        recorderName: payload.recorderName,
        recorderEmail: payload.recorderEmail,
        pdfFileName: payload.pdfAttachment.filename,
        pdfBase64: cleanPdfBase64 || ''
      }
    });

    // 6. CRITICAL SUCCESS RULE:
    // Only accept when success === true AND (status === "EMAIL_SENT" || emailSent === true)
    const isConfirmedSuccess =
      backendResult.success === true &&
      (backendResult.status === 'EMAIL_SENT' || backendResult.status === 'EMAIL_SUCCESS' || backendResult.emailSent === true || backendResult.stage === 'EMAIL_SUCCESS');

    if (isConfirmedSuccess) {
      const messageId = `GAS-MSG-${Date.now()}-${payload.recordId}`;
      const sentAt = new Date().toISOString();

      // Register sent status for idempotency / duplicate prevention
      sentEmailRegistry.add(registryKey);
      sentEmailRegistry.add(payload.submissionId);
      sentEmailRegistry.add(String(payload.recordId));

      // Audit log
      emailAuditLogs.unshift({
        id: messageId,
        recordId: payload.recordId,
        submissionId: payload.submissionId,
        recipient: payload.recipientEmail,
        subject: payload.subject,
        sentAt,
        status: 'SENT',
        attachmentName: payload.pdfAttachment.filename
      });

      return {
        success: true,
        status: (backendResult.status === 'EMAIL_SUCCESS' || backendResult.status === 'EMAIL_SENT') ? backendResult.status : 'EMAIL_SUCCESS',
        stage: 'EMAIL_SUCCESS',
        messageId,
        sentAt,
        sender: MWA_EMAIL_SENDER.email,
        recipient: payload.recipientEmail,
        subject: payload.subject,
        attachmentName: payload.pdfAttachment.filename
      };
    } else {
      const errorMsg = backendResult.message || 'ผู้ให้บริการอีเมลส่งรายงานไม่สำเร็จ (EMAIL_FAILED)';

      emailAuditLogs.unshift({
        id: `FAIL-${Date.now()}`,
        recordId: payload.recordId,
        submissionId: payload.submissionId,
        recipient: payload.recipientEmail,
        subject: payload.subject,
        sentAt: new Date().toISOString(),
        status: 'FAILED',
        attachmentName: payload.pdfAttachment.filename
      });

      return {
        success: false,
        status: 'EMAIL_FAILED',
        stage: backendResult.stage,
        sender: MWA_EMAIL_SENDER.email,
        recipient: payload.recipientEmail,
        subject: payload.subject,
        attachmentName: payload.pdfAttachment.filename,
        error: errorMsg
      };
    }
  } catch (error: any) {
    const errorMsg = error?.message || 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ส่ง Email ได้';

    return {
      success: false,
      status: 'EMAIL_FAILED',
      stage: 'ERROR',
      sender: MWA_EMAIL_SENDER.email,
      recipient: payload.recipientEmail,
      subject: payload.subject,
      attachmentName: payload.pdfAttachment.filename,
      error: errorMsg
    };
  }
}

/**
 * Checks if an email has already been sent for a given submissionId or recordId.
 */
export function isEmailAlreadySent(submissionId?: string, recordId?: number): boolean {
  if (submissionId && sentEmailRegistry.has(submissionId)) return true;
  if (recordId && sentEmailRegistry.has(String(recordId))) return true;
  if (submissionId && recordId && sentEmailRegistry.has(`${submissionId}::${recordId}`)) return true;
  return false;
}

/**
 * Returns the audit logs of all sent emails.
 */
export function getEmailAuditLogs(): EmailAuditLog[] {
  return [...emailAuditLogs];
}
