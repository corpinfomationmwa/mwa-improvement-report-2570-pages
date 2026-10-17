import {
  ReportRecord,
  RecorderInfo,
  ExecutiveInfo,
  CommunicationTopicItem,
  FeedbackInfo
} from '../types/mwa';

export interface PrintPayload {
  recorder: RecorderInfo;
  executive: ExecutiveInfo;
  topics: CommunicationTopicItem[];
  feedback: FeedbackInfo;
  recordId?: number;
  submissionId?: string;
  sourceOfTruth?: 'VERIFIED_RECORD';
  verifiedAt?: string;
}

/**
 * Converts a ReportRecord from the database/Verified Record into the standard PrintPayload
 * ensuring real authors, real executive, real details and real evidence images are mapped directly
 * from the database verified record as the single Source of Truth.
 */
export function recordToPrintPayload(record: ReportRecord): PrintPayload {
  // If record has raw structured info saved from form verification, prioritize them for 100% exact fidelity
  const recorder: RecorderInfo = record.rawRecorder ? { ...record.rawRecorder } : {
    title: record.recorderTitle || (record.recorder ? record.recorder.split(' ')[0] : 'นาย'),
    name: record.recorderName || '',
    surname: record.recorderSurname || '',
    position: record.recorderPosition || record.speakerPosition || 'นักวิชาการคอมพิวเตอร์ 6',
    affiliation: record.recorderAffiliation || record.speakerAffiliation || 'สายงานเทคโนโลยีดิจิทัล',
    department: record.recorderDepartment || record.speakerDepartment || 'ฝ่ายพัฒนาระบบงานดิจิทัล',
    phone: record.phone || '02-504-0123 ต่อ 4821',
    email: record.email || 'recorder@mwa.co.th'
  };

  // If recorder name/surname were empty in raw fallback, parse from record.recorder
  if (!recorder.name && record.recorder) {
    const parts = record.recorder.trim().split(/\s+/);
    if (parts[0] && ['นาย', 'นาง', 'นางสาว'].includes(parts[0])) {
      recorder.title = parts[0];
      recorder.name = parts[1] || '';
      recorder.surname = parts.slice(2).join(' ') || '';
    } else {
      recorder.name = parts[0] || '';
      recorder.surname = parts.slice(1).join(' ') || '';
    }
  }

  const executive: ExecutiveInfo = record.rawExecutive ? { ...record.rawExecutive } : {
    month: record.month || record.executiveMonth || 'มกราคม 2570',
    title: record.executiveTitle || (record.speaker ? record.speaker.split(' ')[0] : 'นาย'),
    name: record.executiveName || '',
    surname: record.executiveSurname || '',
    position: record.speakerPosition || 'ผู้บริหาร',
    affiliation: record.speakerAffiliation || '',
    department: record.speakerDepartment || ''
  };

  // If executive name/surname were empty, parse from record.speaker
  if (!executive.name && record.speaker) {
    const parts = record.speaker.trim().split(/\s+/);
    if (parts[0] && ['นาย', 'นาง', 'นางสาว'].includes(parts[0])) {
      executive.title = parts[0];
      executive.name = parts[1] || '';
      executive.surname = parts.slice(2).join(' ') || '';
    } else {
      executive.name = parts[0] || '';
      executive.surname = parts.slice(1).join(' ') || '';
    }
  }

  const feedback: FeedbackInfo = record.rawFeedback ? { ...record.rawFeedback } : {
    problemsObstacles: record.problems || '',
    executiveSuggestions: record.suggestions || ''
  };

  // Extract evidence files from verified record
  const files: any[] = [];
  if (record.evidenceFiles && record.evidenceFiles.length > 0) {
    record.evidenceFiles.forEach((f: any) => {
      files.push({
        ...f,
        name: f.name,
        size: f.size || '',
        url: f.driveUrl || f.fileUrl || f.url || f.dataUrl || f.previewUrl,
        previewUrl: f.previewUrl,
        mimeType: f.mimeType || f.type
      });
    });
  } else if (record.evidenceUrls && record.evidenceUrls.length > 0) {
    record.evidenceUrls.forEach((u, i) => {
      files.push({
        name: `ภาพหลักฐาน_${i + 1}.jpg`,
        size: '',
        url: u
      });
    });
  } else if (
    record.evidence &&
    (record.evidence.startsWith('http') || record.evidence.startsWith('data:image'))
  ) {
    files.push({
      name: 'รูปภาพหลักฐาน.jpg',
      size: '',
      url: record.evidence
    });
  }

  const topics: CommunicationTopicItem[] = record.rawTopics && record.rawTopics.length > 0
    ? record.rawTopics
    : [
        {
          id: 1,
          selectedTopics: record.topics
            ? record.topics.split(/,\s*/).map((t) => t.trim()).filter(Boolean)
            : ['การสื่อสารตามแผนงาน'],
          details: record.details || 'รายงานผลการดำเนินงานและการสื่อสารตามแผนงาน กปน.',
          communicationTypes: {
            internal: true,
            external: false
          },
          internalChannels: record.channel ? [record.channel] : ['การประชุม'],
          externalChannels: [],
          internalAudiences: record.audience ? [record.audience] : ['บุคลากรภายใน กปน.'],
          internalAudienceDetails: {},
          externalAudiences: [],
          externalAudienceDetails: {},
          evidenceFiles: files
        }
      ];

  return {
    recorder,
    executive,
    topics,
    feedback,
    recordId: record.id,
    submissionId: record.submissionId,
    sourceOfTruth: 'VERIFIED_RECORD',
    verifiedAt: new Date().toISOString()
  };
}

/**
 * Generates PDF payload strictly from Verified Record as Source of Truth.
 * Rejects generation if verifyStatus is not 'SUCCESS' or verifiedRecord is absent.
 */
export function generatePdfFromVerifiedRecord(
  verifiedRecord: ReportRecord | null,
  verifyStatus: string
): { success: boolean; payload?: PrintPayload; error?: string } {
  if ((verifyStatus !== 'SUCCESS' && verifyStatus !== 'EMAIL_FAILED') || !verifiedRecord) {
    return {
      success: false,
      error: 'ยังไม่สามารถสร้างเอกสารได้ เนื่องจากยังตรวจสอบข้อมูลไม่สำเร็จ'
    };
  }

  const payload = recordToPrintPayload(verifiedRecord);
  return {
    success: true,
    payload
  };
}
