import {
  Ctx,
  json,
  readJson,
  getSupabase,
  DB_NOT_READY,
  parseFileSizeToInt,
  generateCollisionSafeRecordId,
  buildReportRecordFromDatabase,
  syncReportToGoogleSheetSafe,
} from '../../_lib/shared';

// ---------------------------------------------------------------- GET /api/reports
export const onRequestGet = async ({ request, env }: Ctx): Promise<Response> => {
  const supabase = getSupabase(env);
  if (!supabase) return json(DB_NOT_READY, 500);

  try {
    const q = new URL(request.url).searchParams;
    const month = (q.get('month') || '').trim();
    const affiliation = (q.get('affiliation') || '').trim();
    const department = (q.get('department') || '').trim();
    const searchText = (q.get('searchText') || '').trim();

    const { data: reportRows, error: reportErr } = await supabase
      .from('reports')
      .select('*')
      .order('created_at', { ascending: false });
    if (reportErr) {
      return json({ success: false, message: 'เกิดข้อผิดพลาดในการดึงรายการรายงาน: ' + (reportErr.message || 'Database error') }, 500);
    }
    if (!reportRows || reportRows.length === 0) {
      return json({ success: true, source: 'supabase', data: [], total: 0 });
    }

    const reportIds = reportRows.map((r: any) => r.id).filter(Boolean);

    const { data: topicRows, error: topicErr } = await supabase
      .from('communication_topics')
      .select('*')
      .in('report_id', reportIds)
      .order('topic_number', { ascending: true });
    if (topicErr) {
      return json({ success: false, message: 'เกิดข้อผิดพลาดในการดึงหัวข้อการสื่อสาร: ' + (topicErr.message || 'Database error') }, 500);
    }

    const { data: attachmentRows, error: attachmentErr } = await supabase
      .from('attachments')
      .select('*')
      .in('report_id', reportIds);
    if (attachmentErr) {
      return json({ success: false, message: 'เกิดข้อผิดพลาดในการดึงไฟล์แนบ: ' + (attachmentErr.message || 'Database error') }, 500);
    }

    const topicsByReportId: Record<string, any[]> = {};
    const attachmentsByReportId: Record<string, any[]> = {};
    for (const t of topicRows || []) (topicsByReportId[String(t.report_id)] ||= []).push(t);
    for (const a of attachmentRows || []) (attachmentsByReportId[String(a.report_id)] ||= []).push(a);

    let records = reportRows.map((row: any) =>
      buildReportRecordFromDatabase(row, topicsByReportId[String(row.id)] || [], attachmentsByReportId[String(row.id)] || [])
    );

    const normalizedMonth = month.toLowerCase();
    const normalizedAffiliation = affiliation.toLowerCase();
    const normalizedDepartment = department.toLowerCase();
    const normalizedSearch = searchText.toLowerCase();

    records = records.filter((record: any) => {
      if (normalizedMonth) {
        const recordMonth = String(record.month || '').trim().toLowerCase().replace(/\s+/g, ' ');
        const requestedMonth = normalizedMonth.replace(/\s+/g, ' ');
        const requestedYearMatch = requestedMonth.match(/(?:^|\s)(\d{4})(?:$|\s)/);
        if (requestedYearMatch) {
          if (recordMonth !== requestedMonth) return false;
        } else {
          const requestedToken = requestedMonth.split(' ')[0] || '';
          const recordToken = recordMonth.split(' ')[0] || '';
          if (recordToken !== requestedToken) return false;
        }
      }
      if (normalizedAffiliation && normalizedAffiliation !== 'ทุกสายงาน') {
        if (!String(record.speakerAffiliation || '').trim().toLowerCase().includes(normalizedAffiliation)) return false;
      }
      if (normalizedDepartment) {
        if (!String(record.speakerDepartment || '').trim().toLowerCase().includes(normalizedDepartment)) return false;
      }
      if (normalizedSearch) {
        const searchable = [
          record.id, record.submissionId, record.month, record.speaker, record.speakerPosition,
          record.speakerAffiliation, record.speakerDepartment, record.topics, record.channel,
          record.audience, record.evidence, record.recorder, record.recordDate, record.details,
          record.problems, record.suggestions,
        ]
          .filter((v: any) => v !== undefined && v !== null && v !== '')
          .join(' ')
          .toLowerCase();
        if (!searchable.includes(normalizedSearch)) return false;
      }
      return true;
    });

    return json({
      success: true,
      source: 'supabase',
      data: records,
      total: records.length,
      filters: { month, affiliation, department, searchText },
    });
  } catch (err: any) {
    return json({ success: false, message: err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการดึงรายการรายงาน' }, 500);
  }
};

// ---------------------------------------------------------------- POST /api/reports
export const onRequestPost = async ({ request, env }: Ctx): Promise<Response> => {
  const formData = await readJson(request);

  if (!formData.submissionId) return json({ success: false, message: 'Missing submissionId in request body' }, 400);
  if (!formData.recorder || typeof formData.recorder !== 'object') return json({ success: false, message: 'Missing recorder details in request body' }, 400);
  if (!formData.executive || typeof formData.executive !== 'object') return json({ success: false, message: 'Missing executive details in request body' }, 400);
  if (!Array.isArray(formData.topics)) return json({ success: false, message: 'topics must be an array in request body' }, 400);
  if (!formData.feedback || typeof formData.feedback !== 'object') return json({ success: false, message: 'Missing feedback details in request body' }, 400);

  const supabase = getSupabase(env);
  if (!supabase) return json(DB_NOT_READY, 500);

  try {
    // Idempotency
    const { data: existingReport, error: checkError } = await supabase
      .from('reports')
      .select('id, record_id, submission_id')
      .eq('submission_id', formData.submissionId)
      .maybeSingle();

    if (!checkError && existingReport) {
      let numRecordId = Number(existingReport.record_id);
      if (isNaN(numRecordId) || numRecordId <= 0) numRecordId = Date.now();
      return json({
        success: true,
        message: 'บันทึกข้อมูลเรียบร้อยแล้ว',
        recordId: numRecordId,
        submissionId: existingReport.submission_id || formData.submissionId,
      });
    }

    const numericRecordId = await generateCollisionSafeRecordId(supabase);
    const strRecordId = String(numericRecordId);

    let savedSuccessfully = false;
    let finalReportId: string | null = null;

    try {
      const { data: rpcResult, error: rpcError } = await supabase.rpc('save_mwa_report', {
        payload: formData,
        p_record_id: strRecordId,
      });
      if (!rpcError && rpcResult && rpcResult.success) {
        savedSuccessfully = true;
        finalReportId = rpcResult.report_id;
      }
    } catch {
      /* fall back to manual inserts */
    }

    if (!savedSuccessfully) {
      const { data: reportInsert, error: reportError } = await supabase
        .from('reports')
        .insert({
          record_id: strRecordId,
          submission_id: formData.submissionId,
          status: 'SAVED',
          recorder_name: formData.recorder?.name || '',
          recorder_surname: formData.recorder?.surname || '',
          recorder_position: formData.recorder?.position || '',
          recorder_affiliation: formData.recorder?.affiliation || '',
          recorder_department: formData.recorder?.department || '',
          recorder_phone: formData.recorder?.phone || '',
          recorder_email: formData.recorder?.email || '',
          communication_month: formData.executive?.month || '',
          executive_name: formData.executive?.name || '',
          executive_surname: formData.executive?.surname || '',
          executive_position: formData.executive?.position || '',
          executive_affiliation: formData.executive?.affiliation || '',
          problems_obstacles: formData.feedback?.problemsObstacles || '',
          executive_suggestions: formData.feedback?.executiveSuggestions || '',
          form_data: formData,
        })
        .select('id')
        .single();

      if (reportError || !reportInsert) {
        throw new Error(
          reportError?.hint ? `${reportError.message} (${reportError.hint})` : reportError?.message || 'Failed to insert report'
        );
      }
      finalReportId = reportInsert.id;

      try {
        for (const topic of formData.topics) {
          const hasInternal = Boolean(topic.communicationTypes?.internal);
          const hasExternal = Boolean(topic.communicationTypes?.external);
          let commType = 'Internal';
          if (hasInternal && hasExternal) commType = 'Internal,External';
          else if (hasExternal) commType = 'External';

          const topicTitle =
            Array.isArray(topic.selectedTopics) && topic.selectedTopics.length > 0
              ? topic.selectedTopics.join(', ')
              : `หัวข้อที่ ${topic.id || 1}`;

          const { data: topicInsert, error: topicError } = await supabase
            .from('communication_topics')
            .insert({
              report_id: finalReportId,
              topic_number: Number(topic.id) || 1,
              topic_title: topicTitle,
              communication_type: commType,
              selected_topics: topic.selectedTopics || [],
              internal_channels: topic.internalChannels || [],
              external_channels: topic.externalChannels || [],
              internal_audience: topic.internalAudiences || [],
              external_audience: topic.externalAudiences || [],
              topic_details: topic.details || '',
              additional_details: topic.additionalDetails || '',
              topic_data: topic,
            })
            .select('id')
            .single();

          if (topicError || !topicInsert) throw new Error(topicError?.message || 'Failed to insert communication topic');

          const topicId = topicInsert.id;
          if (Array.isArray(topic.evidenceFiles) && topic.evidenceFiles.length > 0) {
            const attachmentRows = topic.evidenceFiles.map((file: any) => ({
              report_id: finalReportId,
              topic_id: topicId,
              file_name: file.name || 'ไฟล์แนบ',
              file_type: file.mimeType || file.fileType || null,
              file_size: parseFileSizeToInt(file.size),
              drive_file_id: file.driveFileId || file.fileId || null,
              drive_url:
                file.driveUrl || file.fileUrl || (typeof file.url === 'string' && !file.url.startsWith('data:') ? file.url : null),
              attachment_type: 'evidence',
            }));
            const { error: attachError } = await supabase.from('attachments').insert(attachmentRows);
            if (attachError) throw new Error(attachError?.message || 'Failed to insert attachments');
          }
        }
      } catch (childError) {
        console.error('[Supabase Save Compensation] rolling back report:', finalReportId, childError);
        await supabase.from('attachments').delete().eq('report_id', finalReportId);
        await supabase.from('communication_topics').delete().eq('report_id', finalReportId);
        await supabase.from('reports').delete().eq('id', finalReportId);
        throw childError;
      }
    }

    // Read-back verification
    const { data: readBackRecord, error: readBackError } = await supabase
      .from('reports')
      .select('id, record_id, submission_id')
      .eq('submission_id', formData.submissionId)
      .single();
    if (readBackError || !readBackRecord) {
      return json({ success: false, message: 'ระบบบันทึกข้อมูลแล้วแต่ไม่สามารถยืนยันการอ่านกลับได้ กรุณาลองใหม่อีกครั้ง' }, 500);
    }

    // Google Sheet / Drive sync (fault-isolated)
    const sync = await syncReportToGoogleSheetSafe(env, {
      recordId: numericRecordId,
      submissionId: formData.submissionId,
      formData,
    });
    console.log(`[Google Sheet Sync] synced=${sync.synced} error=${sync.error || 'none'}`);

    // Best-effort: persist Drive IDs/URLs back into Supabase
    if (sync.synced) {
      try {
        for (const topic of Array.isArray(formData.topics) ? formData.topics : []) {
          const files = Array.isArray(topic.evidenceFiles) ? topic.evidenceFiles : [];
          if (!files.length) continue;
          const { data: topicRow, error: lookupErr } = await supabase
            .from('communication_topics')
            .select('id')
            .eq('report_id', finalReportId)
            .eq('topic_number', Number(topic.id) || 1)
            .maybeSingle();
          if (lookupErr || !topicRow?.id) continue;
          for (const file of files) {
            if (!file.driveFileId || !file.driveUrl) continue;
            const { error: upErr } = await supabase
              .from('attachments')
              .update({ drive_file_id: file.driveFileId, drive_url: file.driveUrl })
              .eq('report_id', finalReportId)
              .eq('topic_id', topicRow.id)
              .eq('file_name', file.name || 'ไฟล์แนบ');
            if (upErr) console.warn('[Drive metadata sync] Failed:', upErr.message);
          }
        }
      } catch (e: any) {
        console.warn('[Drive metadata sync] Best-effort update failed:', e?.message || String(e));
      }
    }

    return json({
      success: true,
      message: 'บันทึกข้อมูลเรียบร้อยแล้ว',
      recordId: numericRecordId,
      submissionId: formData.submissionId,
      googleSheetSync: {
        synced: sync.synced,
        error: sync.error || null,
        uploadedFiles: sync.uploadedFiles || 0,
      },
    });
  } catch (err: any) {
    console.error('[POST /api/reports] Error saving report:', err);
    return json(
      { success: false, message: err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการบันทึกข้อมูลเข้าสู่ฐานข้อมูล' },
      500
    );
  }
};
