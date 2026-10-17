import { createClient } from '@supabase/supabase-js';

export interface Env {
  VITE_SUPABASE_URL?: string;
  SUPABASE_URL?: string;
  SUPABASE_SECRET_KEY?: string;
  GOOGLE_APPS_SCRIPT_URL?: string;
}

export type Ctx = {
  request: Request;
  env: Env;
  params: Record<string, string>;
};

export function json(data: any, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

export async function readJson(request: Request): Promise<any> {
  try {
    return (await request.json()) || {};
  } catch {
    return {};
  }
}

export function getSupabase(env: Env): any {
  const url = env.VITE_SUPABASE_URL || env.SUPABASE_URL;
  const key = env.SUPABASE_SECRET_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export const DB_NOT_READY = {
  success: false,
  message: 'ระบบฐานข้อมูลยังไม่พร้อมใช้งาน (Server-side Supabase configuration missing)',
};

export function parseFileSizeToInt(sizeVal: any): number | null {
  if (typeof sizeVal === 'number' && !isNaN(sizeVal)) return Math.round(sizeVal);
  if (typeof sizeVal === 'string') {
    const trimmed = sizeVal.trim();
    if (/^\d+$/.test(trimmed)) return parseInt(trimmed, 10);
    const match = trimmed.match(/^([\d.]+)\s*(kb|mb|gb|b)?$/i);
    if (match) {
      const num = parseFloat(match[1]);
      const unit = (match[2] || 'b').toLowerCase();
      if (!isNaN(num)) {
        if (unit === 'gb') return Math.round(num * 1024 * 1024 * 1024);
        if (unit === 'mb') return Math.round(num * 1024 * 1024);
        if (unit === 'kb') return Math.round(num * 1024);
        return Math.round(num);
      }
    }
  }
  return null;
}

export async function generateCollisionSafeRecordId(supabase: any): Promise<number> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = Date.now() * 1000 + Math.floor(Math.random() * 1000);
    const { data } = await supabase.from('reports').select('id').eq('record_id', String(candidate)).maybeSingle();
    if (!data) return candidate;
  }
  return Date.now();
}

export function buildReportRecordFromDatabase(reportRow: any, topicRows: any[] = [], attachmentRows: any[] = []): any {
  const formData = reportRow.form_data && typeof reportRow.form_data === 'object' ? reportRow.form_data : {};
  const numId = Number(reportRow.record_id);
  const validId = !isNaN(numId) && numId > 0 ? numId : Date.now();

  const sortedTopics = [...topicRows].sort((a, b) => (Number(a.topic_number) || 0) - (Number(b.topic_number) || 0));

  const attachmentsByTopicId: Record<string, any[]> = {};
  const evidenceFiles: any[] = [];

  for (const att of attachmentRows || []) {
    const fileObj = {
      name: att.file_name || 'ไฟล์แนบ',
      size: att.file_size ? `${att.file_size}` : '',
      url: att.drive_url || '',
      fileUrl: att.drive_url || '',
      mimeType: att.file_type || '',
      fileType: att.file_type || '',
      driveFileId: att.drive_file_id || '',
    };
    evidenceFiles.push(fileObj);
    if (att.topic_id) {
      if (!attachmentsByTopicId[att.topic_id]) attachmentsByTopicId[att.topic_id] = [];
      attachmentsByTopicId[att.topic_id].push({ ...fileObj });
    }
  }

  const rawTopics = sortedTopics.map((tr) => {
    if (tr.topic_data && typeof tr.topic_data === 'object' && Object.keys(tr.topic_data).length > 0) {
      const topicObj = { ...tr.topic_data };
      if (!Array.isArray(topicObj.evidenceFiles) || topicObj.evidenceFiles.length === 0) {
        topicObj.evidenceFiles = attachmentsByTopicId[tr.id] || [];
      }
      return topicObj;
    }
    const hasInternal = String(tr.communication_type || '').includes('Internal');
    const hasExternal = String(tr.communication_type || '').includes('External');
    return {
      id: Number(tr.topic_number) || 1,
      selectedTopics: Array.isArray(tr.selected_topics) ? tr.selected_topics : [],
      details: tr.topic_details || '',
      communicationTypes: { internal: hasInternal, external: hasExternal },
      internalChannels: Array.isArray(tr.internal_channels) ? tr.internal_channels : [],
      otherInternalChannel: '',
      externalChannels: Array.isArray(tr.external_channels) ? tr.external_channels : [],
      otherExternalChannel: '',
      internalAudiences: Array.isArray(tr.internal_audience) ? tr.internal_audience : [],
      internalAudienceDetails: {},
      externalAudiences: Array.isArray(tr.external_audience) ? tr.external_audience : [],
      externalAudienceDetails: {},
      audiences: Array.isArray(tr.internal_audience) ? tr.internal_audience : [],
      otherAudience: '',
      additionalDetails: tr.additional_details || '',
      evidenceFiles: attachmentsByTopicId[tr.id] || [],
    };
  });

  const allTopics =
    sortedTopics
      .map((t) => t.topic_title || (Array.isArray(t.selected_topics) ? t.selected_topics.join(', ') : ''))
      .filter(Boolean)
      .join(', ') || 'การสื่อสารตามแผนงาน';

  const allChannels =
    sortedTopics
      .flatMap((t) => [
        ...(Array.isArray(t.internal_channels) ? t.internal_channels : []),
        ...(Array.isArray(t.external_channels) ? t.external_channels : []),
      ])
      .filter(Boolean)
      .join(', ') || 'การประชุม';

  const allAudiences =
    sortedTopics
      .flatMap((t) => [
        ...(Array.isArray(t.internal_audience) ? t.internal_audience : []),
        ...(Array.isArray(t.external_audience) ? t.external_audience : []),
      ])
      .filter(Boolean)
      .join(', ') || 'พนักงานและลูกจ้าง กปน.';

  const allDetails = sortedTopics.map((t) => t.topic_details).filter(Boolean).join('\n\n') || '-';

  const speakerFullName =
    `${formData.executive?.title || ''}${reportRow.executive_name || ''} ${reportRow.executive_surname || ''}`.trim() || 'ผู้บริหาร';
  const authorFullName =
    `${formData.recorder?.title || ''}${reportRow.recorder_name || ''} ${reportRow.recorder_surname || ''}`.trim() || 'ผู้จัดทำเอกสาร';

  return {
    id: validId,
    submissionId: reportRow.submission_id,
    month: reportRow.communication_month || formData.executive?.month || '',
    speaker: speakerFullName,
    speakerPosition: reportRow.executive_position || formData.executive?.position || 'ผู้บริหาร',
    speakerAffiliation: reportRow.executive_affiliation || formData.executive?.affiliation || '',
    speakerDepartment: formData.executive?.department || formData.recorder?.department || reportRow.recorder_department || '',
    topics: allTopics,
    channel: allChannels,
    audience: allAudiences,
    evidence: evidenceFiles.length > 0 ? `${evidenceFiles.length} ไฟล์` : 'ไม่มี',
    evidenceFiles,
    recorder: authorFullName,
    recordDate: reportRow.created_at
      ? new Date(reportRow.created_at).toLocaleDateString('th-TH')
      : new Date().toLocaleDateString('th-TH'),
    details: allDetails,
    problems: reportRow.problems_obstacles || formData.feedback?.problemsObstacles || '',
    suggestions: reportRow.executive_suggestions || formData.feedback?.executiveSuggestions || '',
    phone: reportRow.recorder_phone || formData.recorder?.phone || '',
    email: reportRow.recorder_email || formData.recorder?.email || '',
    rawTopics: rawTopics.length > 0 ? rawTopics : formData.topics || [],

    recorderTitle: formData.recorder?.title || '',
    recorderName: reportRow.recorder_name || formData.recorder?.name || '',
    recorderSurname: reportRow.recorder_surname || formData.recorder?.surname || '',
    recorderPosition: reportRow.recorder_position || formData.recorder?.position || '',
    recorderAffiliation: reportRow.recorder_affiliation || formData.recorder?.affiliation || '',
    recorderDepartment: reportRow.recorder_department || formData.recorder?.department || '',
    executiveTitle: formData.executive?.title || '',
    executiveName: reportRow.executive_name || formData.executive?.name || '',
    executiveSurname: reportRow.executive_surname || formData.executive?.surname || '',
    executiveMonth: reportRow.communication_month || formData.executive?.month || '',
    rawRecorder: formData.recorder || {
      title: '',
      name: reportRow.recorder_name || '',
      surname: reportRow.recorder_surname || '',
      position: reportRow.recorder_position || '',
      affiliation: reportRow.recorder_affiliation || '',
      department: reportRow.recorder_department || '',
      phone: reportRow.recorder_phone || '',
      email: reportRow.recorder_email || '',
    },
    rawExecutive: formData.executive || {
      month: reportRow.communication_month || '',
      title: '',
      name: reportRow.executive_name || '',
      surname: reportRow.executive_surname || '',
      position: reportRow.executive_position || '',
      affiliation: reportRow.executive_affiliation || '',
      department: '',
    },
    rawFeedback: formData.feedback || {
      problemsObstacles: reportRow.problems_obstacles || '',
      executiveSuggestions: reportRow.executive_suggestions || '',
    },
  };
}

export async function postToAppsScript(appsScriptUrl: string, body: any, timeoutMs = 60000): Promise<any> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(appsScriptUrl.trim(), {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(body),
      redirect: 'follow',
      signal: controller.signal,
    });
    const textBody = await response.text();
    let result: any = null;
    try {
      result = JSON.parse(textBody);
    } catch {
      /* non-JSON */
    }
    if (!response.ok || !result || result.success !== true) {
      const detail = (result && (result.message || result.error)) || textBody.slice(0, 300) || `HTTP ${response.status}`;
      throw new Error(`Apps Script action ${body.action || 'unknown'} failed: ${detail}`);
    }
    return result;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function syncReportToGoogleSheetSafe(
  env: Env,
  payload: { recordId: number; submissionId: string; formData: any }
): Promise<{ synced: boolean; error?: string; uploadedFiles?: number }> {
  const appsScriptUrl = env.GOOGLE_APPS_SCRIPT_URL;
  if (!appsScriptUrl || !appsScriptUrl.trim()) {
    return { synced: false, error: 'GOOGLE_APPS_SCRIPT_URL not configured' };
  }
  const { recordId, submissionId, formData } = payload;

  try {
    let uploadedFiles = 0;
    const topics = Array.isArray(formData.topics) ? formData.topics : [];

    for (let topicIndex = 0; topicIndex < topics.length; topicIndex++) {
      const topic = topics[topicIndex];
      const files = Array.isArray(topic.evidenceFiles) ? topic.evidenceFiles : [];
      for (let fileIndex = 0; fileIndex < files.length; fileIndex++) {
        const file = files[fileIndex];
        const dataUrl = String(file.dataUrl || (String(file.url || '').startsWith('data:') ? file.url : '') || '').trim();
        const alreadyOnDrive = Boolean(file.driveFileId && (file.driveUrl || file.url));
        if (!dataUrl && alreadyOnDrive) continue;
        if (!dataUrl) {
          throw new Error(`ไฟล์แนบ "${file.name || 'ไม่ทราบชื่อ'}" ไม่มีข้อมูลไฟล์ต้นฉบับ กรุณาแนบไฟล์นี้ใหม่แล้วบันทึกอีกครั้ง`);
        }
        const uploadResult = await postToAppsScript(
          appsScriptUrl,
          {
            action: 'uploadEvidence',
            submissionId,
            topicId: `${topic.id ?? topicIndex + 1}_${fileIndex + 1}`,
            fileName: file.name || `evidence_${fileIndex + 1}`,
            mimeType: file.mimeType || file.type || 'application/octet-stream',
            fileDataUrl: dataUrl,
          },
          90000
        );
        if (!uploadResult.fileId || !uploadResult.fileUrl) {
          throw new Error(`Google Drive ไม่ส่ง File ID/URL กลับมาสำหรับไฟล์ ${file.name || ''}`);
        }
        file.driveFileId = uploadResult.fileId;
        file.driveUrl = uploadResult.fileUrl;
        file.url = uploadResult.fileUrl;
        delete file.dataUrl;
        uploadedFiles++;
      }
    }

    const cleanFormData = JSON.parse(JSON.stringify(formData));
    for (const topic of Array.isArray(cleanFormData.topics) ? cleanFormData.topics : []) {
      for (const file of Array.isArray(topic.evidenceFiles) ? topic.evidenceFiles : []) {
        delete file.dataUrl;
        delete file.previewUrl;
        if (file.driveUrl) file.url = file.driveUrl;
      }
    }

    const sheetPayload = {
      action: 'saveReport',
      recordId,
      submissionId,
      timestamp: new Date().toISOString(),
      recorder: cleanFormData.recorder || {},
      executive: cleanFormData.executive || {},
      topics: cleanFormData.topics || [],
      feedback: cleanFormData.feedback || {},
      data: cleanFormData,
      recorderName: `${cleanFormData.recorder?.title || ''}${cleanFormData.recorder?.name || ''} ${cleanFormData.recorder?.surname || ''}`.trim(),
      recorderEmail: cleanFormData.recorder?.email || '',
      executiveName: `${cleanFormData.executive?.title || ''}${cleanFormData.executive?.name || ''} ${cleanFormData.executive?.surname || ''}`.trim(),
      communicationMonth: cleanFormData.executive?.month || '',
      topicsCount: Array.isArray(cleanFormData.topics) ? cleanFormData.topics.length : 0,
    };

    const result = await postToAppsScript(appsScriptUrl, sheetPayload, 60000);
    if (result.success === true || result.saved === true) return { synced: true, uploadedFiles };
    throw new Error(result.message || 'Apps Script did not confirm Google Sheets save');
  } catch (err: any) {
    const errorMsg =
      err?.name === 'AbortError'
        ? 'Timeout while uploading evidence or connecting to Google Apps Script'
        : err?.message || String(err);
    console.warn(`[Google Sheet Sync] Sync failed gracefully: ${errorMsg}`);
    return { synced: false, error: errorMsg };
  }
}

/** Load one report (+topics +attachments) by a column and return a ready Response. */
export async function loadSingleReportResponse(supabase: any, column: 'record_id' | 'submission_id', value: string): Promise<Response> {
  try {
    const { data: reportRow, error: reportErr } = await supabase.from('reports').select('*').eq(column, value).maybeSingle();
    if (reportErr) {
      return json({ success: false, message: 'เกิดข้อผิดพลาดในการค้นหาข้อมูลรายงาน: ' + (reportErr.message || 'Database error') }, 500);
    }
    if (!reportRow) return json({ success: false, message: 'ไม่พบข้อมูลรายงาน' }, 404);

    const { data: topicRows, error: topicErr } = await supabase
      .from('communication_topics')
      .select('*')
      .eq('report_id', reportRow.id)
      .order('topic_number', { ascending: true });
    if (topicErr) {
      return json({ success: false, message: 'เกิดข้อผิดพลาดในการดึงข้อมูลหัวข้อการสื่อสาร: ' + (topicErr.message || 'Database error') }, 500);
    }

    const { data: attachmentRows, error: attachErr } = await supabase.from('attachments').select('*').eq('report_id', reportRow.id);
    if (attachErr) {
      return json({ success: false, message: 'เกิดข้อผิดพลาดในการดึงข้อมูลไฟล์แนบ: ' + (attachErr.message || 'Database error') }, 500);
    }

    return json({ success: true, data: buildReportRecordFromDatabase(reportRow, topicRows || [], attachmentRows || []) });
  } catch (err: any) {
    return json({ success: false, message: err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการดึงข้อมูลรายงาน' }, 500);
  }
}
