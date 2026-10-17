import { Ctx, json, readJson } from '../../_lib/shared';

export const onRequestPost = async ({ request, env }: Ctx): Promise<Response> => {
  const body = await readJson(request);
  const appsScriptUrl = env.GOOGLE_APPS_SCRIPT_URL;
  const fileDataUrl = typeof body.fileDataUrl === 'string' ? body.fileDataUrl : '';

  if (!body.submissionId || !body.fileName || !fileDataUrl.startsWith('data:')) {
    return json({ success: false, message: 'ข้อมูลไฟล์แนบไม่ครบถ้วน' }, 400);
  }
  if (!appsScriptUrl || !appsScriptUrl.trim()) {
    return json({ success: false, message: 'ยังไม่ได้ตั้งค่า Google Apps Script URL' }, 503);
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90000);
    let response: Response;
    let responseText = '';
    try {
      response = await fetch(appsScriptUrl.trim(), {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'uploadEvidence',
          submissionId: body.submissionId,
          topicId: String(body.topicId || '1_1'),
          fileName: body.fileName,
          mimeType: body.mimeType || 'application/octet-stream',
          fileDataUrl,
        }),
        redirect: 'follow',
        signal: controller.signal,
      });
      responseText = await response.text();
    } finally {
      clearTimeout(timeoutId);
    }

    let result: any = null;
    try { result = JSON.parse(responseText); } catch (_) {}
    if (!response.ok || !result || result.success !== true || !result.fileId || !result.fileUrl) {
      const detail = (result && (result.message || result.error)) || responseText.slice(0, 250) || `HTTP ${response.status}`;
      return json({ success: false, message: `อัปโหลดไฟล์ไป Google Drive ไม่สำเร็จ: ${detail}` }, 502);
    }
    return json({ success: true, fileId: result.fileId, fileUrl: result.fileUrl, fileName: body.fileName });
  } catch (err: any) {
    const message = err && err.name === 'AbortError' ? 'หมดเวลารอการอัปโหลดไฟล์ กรุณาลองอีกครั้ง' : (err && err.message) || 'อัปโหลดไฟล์ไม่สำเร็จ';
    return json({ success: false, message }, 502);
  }
};
