import { Ctx, json, readJson } from './shared';

const SENDER = 'corpinfomationmwa@gmail.com';

const extractEmail = (source: any): string => {
  if (!source || typeof source !== 'object') return '';
  const candidate =
    source.email || source.recipientEmail || source.emailRecipient || source.receiverEmail || source.Email ||
    source['อีเมล'] || source['emailผู้รับ'] || source.to || source.recorderEmail || source.userEmail ||
    source.targetEmail || source.recipient || source.data?.email || source.data?.recipientEmail ||
    source.data?.['อีเมล'] || source.data?.['emailผู้รับ'] || source.rawRecorder?.email ||
    source.rawRecorder?.['อีเมล'] || source.rawRecorder?.['emailผู้รับ'] || source.recorder?.email ||
    source.recorder?.['อีเมล'] || source.recorder?.['emailผู้รับ'] || '';
  return typeof candidate === 'string' && candidate.trim().length > 0 && candidate.includes('@') ? candidate.trim() : '';
};

export const handleEmail = async ({ request, env }: Ctx): Promise<Response> => {
  const bodyData = await readJson(request);
  const { recordId, submissionId, subject, body, executiveName, communicationMonth, recorderName } = bodyData;

  const to =
    extractEmail(bodyData) || extractEmail(bodyData.data) || extractEmail(bodyData.record) ||
    extractEmail(bodyData.reportData) || extractEmail(bodyData.rawRecorder) || extractEmail(bodyData.recorder) || '';

  const fail = (message: string) =>
    json({ success: false, status: 'EMAIL_FAILED', stage: 'EMAIL_FAILED', recordId, submissionId, message });

  const targetSubject = subject || `รายงานการสื่อสารของผู้บริหาร ประจำปีงบประมาณ 2570 - Record ID #${recordId}`;
  const appsScriptUrl = env.GOOGLE_APPS_SCRIPT_URL;

  if (!to || !to.includes('@')) return fail('ไม่พบ Email ผู้รับ');

  const rawPdfBase64 = (
    (typeof bodyData.pdf === 'object' && bodyData.pdf?.base64) ||
    bodyData.pdfBase64 ||
    (typeof bodyData.data?.pdf === 'object' && bodyData.data?.pdf?.base64) ||
    bodyData.data?.pdfBase64 ||
    (typeof bodyData.pdf === 'string' ? bodyData.pdf : '')
  ).toString();
  const cleanPdfBase64 = rawPdfBase64.replace(/^data:application\/pdf;base64,/, '').trim();

  const fileName =
    (typeof bodyData.pdf === 'object' && bodyData.pdf?.fileName) ||
    bodyData.pdfFileName ||
    (typeof bodyData.data?.pdf === 'object' && bodyData.data?.pdf?.fileName) ||
    bodyData.data?.pdfFileName ||
    `MWA_Communication_Report_${recordId}_${submissionId}.pdf`;

  if (!cleanPdfBase64 || cleanPdfBase64.length <= 1000) return fail('สร้าง PDF ไม่สำเร็จ จึงยังไม่ส่ง Email');

  const effectiveBody = body || bodyData.data?.body || 'รายงานการสื่อสารของผู้บริหาร การประปานครหลวง ประจำปีงบประมาณ 2570';

  if (!appsScriptUrl || !appsScriptUrl.trim()) {
    return fail('ยังไม่ได้เชื่อมต่อระบบส่ง Email (GOOGLE_APPS_SCRIPT_URL ยังไม่ได้ตั้งค่า)');
  }

  const exec = executiveName || bodyData.data?.executiveName || '';
  const month = communicationMonth || bodyData.data?.communicationMonth || '';
  const recName = recorderName || bodyData.data?.recorderName || '';

  const core = {
    action: 'sendEmail',
    to,
    recipient: to,
    subject: targetSubject,
    body: effectiveBody,
    emailBody: effectiveBody,
    pdf: { fileName, mimeType: 'application/pdf', base64: cleanPdfBase64 },
    reportData: { executive: exec, communicationMonth: month, recorder: recName, recorderEmail: to },
    executiveName: exec,
    communicationMonth: month,
    recorderName: recName,
    recorderEmail: to,
    recordId,
    submissionId,
    pdfFileName: fileName,
    pdfBase64: cleanPdfBase64,
    recipientEmail: to,
    email: to,
    emailRecipient: to,
    receiverEmail: to,
    Email: to,
    ['อีเมล']: to,
    ['emailผู้รับ']: to,
    userEmail: to,
  };
  const gasPayload = { ...core, senderEmail: SENDER, data: core };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90000);
    let status = 0;
    let textData = '';
    try {
      const gasResponse = await fetch(appsScriptUrl.trim(), {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(gasPayload),
        redirect: 'follow',
        signal: controller.signal,
      });
      status = gasResponse.status;
      textData = await gasResponse.text();
    } finally {
      clearTimeout(timeoutId);
    }

    let parsed: any;
    try {
      parsed = JSON.parse(textData);
    } catch {
      let cleanMsg = `Google Apps Script ตอบกลับในรูปแบบที่ไม่ถูกต้อง (HTTP ${status})`;
      if (textData.includes('<title>Page not found</title>') || textData.includes('Sorry, unable to open the file')) {
        cleanMsg = 'Google Apps Script แจ้งว่า Page not found (กรุณาตรวจสอบสิทธิ์ Deployment: Execute as: Me และ Who has access: Anyone)';
      } else if (textData.includes('<html') || textData.includes('<!DOCTYPE')) {
        cleanMsg = 'Google Apps Script ตอบกลับเป็นหน้า HTML แทน JSON (กรุณาตรวจสอบการตั้งค่า Deploy)';
      }
      parsed = { success: false, message: cleanMsg };
    }

    const isSuccess =
      parsed.success === true &&
      (parsed.status === 'EMAIL_SENT' || parsed.status === 'EMAIL_SUCCESS' || parsed.emailSent === true || parsed.stage === 'EMAIL_SUCCESS');

    if (isSuccess) {
      return json({
        ...parsed,
        success: true,
        status: parsed.status === 'EMAIL_SENT' || parsed.status === 'EMAIL_SUCCESS' ? parsed.status : 'EMAIL_SUCCESS',
        stage: 'EMAIL_SUCCESS',
        message: parsed.message || 'ส่ง Email สำเร็จ',
        emailSent: true,
      });
    }
    return json({
      ...parsed,
      success: false,
      status: 'EMAIL_FAILED',
      stage: 'EMAIL_FAILED',
      message: parsed.message || 'ผู้ให้บริการอีเมลส่งรายงานไม่สำเร็จ (EMAIL_FAILED)',
      emailSent: false,
    });
  } catch (err: any) {
    let detail = err?.message || String(err);
    if (err?.name === 'AbortError' || detail.includes('aborted')) {
      detail = 'การเชื่อมต่อ Google Apps Script ใช้เวลานานเกินกำหนด (Timeout 90 วินาที) กรุณากดลองส่งอีกครั้ง';
    }
    return fail(`ไม่สามารถเชื่อมต่อ Google Apps Script ได้: ${detail}`);
  }
};
