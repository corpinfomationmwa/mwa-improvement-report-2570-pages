export type EmailStatus = 'EMAIL_SUCCESS' | 'EMAIL_SENT' | 'EMAIL_FAILED';

export interface SendReportEmailPayload {
  action: 'sendEmail' | 'sendReportEmail' | 'sendVerifiedReport';
  recordId: number | string;
  submissionId: string;
  recipient?: string;
  recipientEmail: string;
  email?: string;
  emailRecipient?: string;
  receiverEmail?: string;
  Email?: string;
  ['อีเมล']?: string;
  ['emailผู้รับ']?: string;
  to?: string;
  recorderEmail?: string;
  userEmail?: string;
  senderEmail: string;
  subject: string;
  executiveName?: string;
  communicationMonth?: string;
  recorderName?: string;
  body?: string;
  htmlBody?: string;
  pdfFileName: string;
  pdfBase64: string;
  pdf?: {
    fileName: string;
    mimeType: string;
    base64: string;
  };
  reportData?: {
    executive?: string;
    communicationMonth?: string;
    recorder?: string;
    recorderEmail?: string;
  };
  data?: any;
  record?: any;
}

export interface SendReportEmailResponse {
  success: boolean;
  status: EmailStatus;
  stage?: string;
  message: string;
  recordId?: number | string;
  submissionId?: string;
  emailSent?: boolean;
  fileName?: string;
  attachmentName?: string;
}

/**
 * Normalizes recipient email from any possible property name.
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
        '';

      if (typeof candidate === 'string' && candidate.trim().length > 0 && candidate.includes('@')) {
        return candidate.trim();
      }
    }
  }
  return '';
}

/**
 * Submits verified report with PDF attachment to Google Apps Script Web App Bridge.
 * Strictly checks the real response from the backend.
 */
export async function submitReportToBackend(
  payload: SendReportEmailPayload
): Promise<SendReportEmailResponse> {
  const resolvedEmail = normalizeRecipientEmail(
    payload,
    payload.data,
    payload.record
  );

  console.log('\n========================================');
  console.log('EMAIL_START');
  console.log('recipient:', resolvedEmail);
  console.log('subject:', payload.subject);
  console.log('recordId:', payload.recordId);
  console.log('submissionId:', payload.submissionId);
  console.log('========================================');

  // Pre-validation: Ensure recipient email exists
  if (!resolvedEmail || !resolvedEmail.includes('@')) {
    return {
      success: false,
      status: 'EMAIL_FAILED',
      stage: 'EMAIL_FAILED',
      recordId: payload.recordId,
      submissionId: payload.submissionId,
      emailSent: false,
      message: 'ไม่พบ Email ผู้รับ'
    };
  }

  // Pre-validation: Validate PDF Base64 attachment length > 1000 and pure binary base64
  const rawPdfBase64 = (
    (typeof payload.pdf === 'object' && payload.pdf?.base64) ||
    payload.pdfBase64 ||
    (typeof payload.data?.pdf === 'object' && payload.data?.pdf?.base64) ||
    payload.data?.pdfBase64 ||
    ''
  ).toString();
  const cleanPdfBase64 = rawPdfBase64.replace(/^data:application\/pdf;base64,/, '').trim();

  if (!cleanPdfBase64 || cleanPdfBase64.length <= 1000) {
    console.log('[Email Dispatch] PDF Base64 validation failed: length <= 1000');
    return {
      success: false,
      status: 'EMAIL_FAILED',
      stage: 'EMAIL_FAILED',
      recordId: payload.recordId,
      submissionId: payload.submissionId,
      emailSent: false,
      message: 'สร้าง PDF ไม่สำเร็จ จึงยังไม่ส่ง Email'
    };
  }

  const resolvedFileName =
    (typeof payload.pdf === 'object' && payload.pdf?.fileName) ||
    payload.pdfFileName ||
    payload.data?.pdfFileName ||
    `MWA_Communication_Report_${payload.recordId}_${payload.submissionId}.pdf`;

  try {
    console.log('[EMAIL REQUEST]');
    console.log('recipient:', resolvedEmail);
    console.log('subject:', payload.subject);
    console.log('pdf.fileName:', resolvedFileName);
    console.log('pdf.base64 (length):', cleanPdfBase64.length);

    // Use backend proxy endpoint /api/submit-report (which securely forwards to GOOGLE_APPS_SCRIPT_URL)
    const baseUrl = typeof window !== 'undefined' && window.location?.origin ? window.location.origin : 'http://127.0.0.1:3000';
    const endpoint = `${baseUrl}/api/submit-report`;
    const normalizedBody = {
      ...payload,
      recipient: resolvedEmail,
      recipientEmail: resolvedEmail,
      subject: payload.subject,
      body: payload.body || '',
      pdf: {
        fileName: resolvedFileName,
        mimeType: 'application/pdf',
        base64: cleanPdfBase64
      },
      pdfFileName: resolvedFileName,
      pdfBase64: cleanPdfBase64,
      email: resolvedEmail,
      emailRecipient: resolvedEmail,
      receiverEmail: resolvedEmail,
      Email: resolvedEmail,
      ['อีเมล']: resolvedEmail,
      ['emailผู้รับ']: resolvedEmail,
      to: resolvedEmail,
      recorderEmail: resolvedEmail,
      userEmail: resolvedEmail,
      data: {
        ...(payload.data || {}),
        recipient: resolvedEmail,
        recipientEmail: resolvedEmail,
        subject: payload.subject,
        body: payload.body || '',
        pdf: {
          fileName: resolvedFileName,
          mimeType: 'application/pdf',
          base64: cleanPdfBase64
        },
        pdfFileName: resolvedFileName,
        pdfBase64: cleanPdfBase64,
        email: resolvedEmail,
        emailRecipient: resolvedEmail,
        receiverEmail: resolvedEmail,
        Email: resolvedEmail,
        ['อีเมล']: resolvedEmail,
        ['emailผู้รับ']: resolvedEmail
      }
    };

    const controller = new AbortController();
    const clientTimeoutId = setTimeout(() => controller.abort(), 95000);

    let response: Response;
    let httpStatus = 0;
    let textData = '';

    try {
      response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(normalizedBody),
        signal: controller.signal
      });
      httpStatus = response.status;
      textData = await response.text();
    } finally {
      clearTimeout(clientTimeoutId);
    }

    console.log('[EMAIL RESPONSE]');
    console.log('httpStatus:', httpStatus);
    console.log('responseText:', textData);

    let parsedResult: any;
    try {
      parsedResult = JSON.parse(textData);
    } catch {
      parsedResult = {
        success: false,
        status: 'EMAIL_FAILED',
        message: textData || 'Invalid non-JSON response from Email backend'
      };
    }

    // Strict validation: Only accept success if both success === true and status === 'EMAIL_SENT' (or 'EMAIL_SUCCESS')
    const isSuccess =
      parsedResult.success === true &&
      (parsedResult.status === 'EMAIL_SENT' || parsedResult.status === 'EMAIL_SUCCESS' || parsedResult.emailSent === true || parsedResult.stage === 'EMAIL_SUCCESS');

    console.log('[EMAIL RESULT]');
    console.log('success:', parsedResult.success);
    console.log('status:', parsedResult.status);
    console.log('recipient:', resolvedEmail);
    console.log('emailSent:', isSuccess);

    if (isSuccess) {
      console.log('EMAIL_SUCCESS (EMAIL_SENT)');
      return {
        success: true,
        status: 'EMAIL_SENT',
        stage: 'EMAIL_SUCCESS',
        message: parsedResult.message || 'ส่ง Email สำเร็จ',
        recordId: parsedResult.recordId || payload.recordId,
        submissionId: parsedResult.submissionId || payload.submissionId,
        fileName: parsedResult.fileName || payload.pdf?.fileName || payload.pdfFileName,
        attachmentName: parsedResult.fileName || payload.pdf?.fileName || payload.pdfFileName,
        emailSent: true
      };
    } else {
      console.log('[MWA Backend Client] Delivery reported:', parsedResult.message || parsedResult.status);
      return {
        success: false,
        status: 'EMAIL_FAILED',
        stage: 'EMAIL_FAILED',
        recordId: parsedResult.recordId || payload.recordId,
        submissionId: parsedResult.submissionId || payload.submissionId,
        fileName: parsedResult.fileName || payload.pdf?.fileName || payload.pdfFileName,
        attachmentName: parsedResult.fileName || payload.pdf?.fileName || payload.pdfFileName,
        emailSent: false,
        message: parsedResult.message || 'ผู้ให้บริการอีเมลส่งรายงานไม่สำเร็จ (EMAIL_FAILED)'
      };
    }

  } catch (error: any) {
    console.log('[EMAIL ERROR]');
    console.log('error.name:', error?.name);
    console.log('error.message:', error?.message);

    let errorMsg = error?.message || 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ส่ง Email ได้';
    if (error?.name === 'AbortError' || errorMsg.includes('aborted')) {
      errorMsg = 'การเชื่อมต่อระบบส่ง Email ใช้เวลานานเกินกำหนด (Timeout 95 วินาที) กรุณากดลองส่งอีกครั้ง';
    }

    return {
      success: false,
      status: 'EMAIL_FAILED',
      stage: 'EMAIL_FAILED',
      recordId: payload.recordId,
      submissionId: payload.submissionId,
      emailSent: false,
      message: errorMsg
    };
  }
}

/**
 * Retries sending email for an existing verified record (Idempotent: No duplicate rows!).
 */
export async function retryEmailWithBackend(
  params: {
    recordId: number | string;
    submissionId: string;
    recipientEmail: string;
    subject?: string;
    body?: string;
    htmlBody?: string;
    pdfFileName?: string;
    pdfBase64: string;
  }
): Promise<SendReportEmailResponse> {
  const payload: SendReportEmailPayload = {
    action: 'sendReportEmail',
    recordId: params.recordId,
    submissionId: params.submissionId,
    recipientEmail: params.recipientEmail,
    senderEmail: 'corpinfomationmwa@gmail.com',
    subject: params.subject || `รายงานการสื่อสารของผู้บริหาร ประจำปีงบประมาณ 2570 - Record ID #${params.recordId}`,
    body: params.body,
    htmlBody: params.htmlBody,
    pdfFileName: params.pdfFileName || `MWA_Communication_Report_${params.recordId}_${params.submissionId}.pdf`,
    pdfBase64: params.pdfBase64
  };

  return submitReportToBackend(payload);
}

