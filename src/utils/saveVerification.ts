import {
  RecorderInfo,
  ExecutiveInfo,
  CommunicationTopicItem,
  FeedbackInfo,
  ReportRecord
} from '../types/mwa';
import { mwaService } from '../services/mwaService';

export interface SavePayload {
  submissionId: string;
  recorder: RecorderInfo;
  executive: ExecutiveInfo;
  topics: CommunicationTopicItem[];
  feedback: FeedbackInfo;
}

export interface VerificationResult {
  isValid: boolean;
  errors: string[];
  submissionId?: string;
  recordId?: number;
  verifiedFields: string[];
}

export interface SaveAndVerifyResult {
  success: boolean;
  status: 'SUCCESS' | 'FAILED';
  recordId?: number;
  submissionId?: string;
  message: string;
  errors?: string[];
  record?: ReportRecord;
}

/**
 * Normalizes text for comparison (trims whitespace)
 */
function normalize(val?: string | null): string {
  return (val || '').trim();
}

/**
 * Strict comparator between submitted form data and read-back database record.
 * Verifies every required field:
 * - Submission ID
 * - Recorder: name, surname, position, affiliation, department, phone, email
 * - Executive: title, name, surname, position, affiliation, department, month
 * - Communication topics, details, channels, audiences
 * - Feedback: problems & obstacles, executive suggestions
 */
export function verifySavedRecord(
  payload: SavePayload,
  record: ReportRecord | null
): VerificationResult {
  const errors: string[] = [];
  const verifiedFields: string[] = [];

  if (!record) {
    return {
      isValid: false,
      errors: ['READ-BACK FAILED: ไม่พบข้อมูลบันทึกในระบบฐานข้อมูลตาม Submission ID / Record ID ที่ระบุ'],
      verifiedFields: []
    };
  }

  // 1. Submission ID check
  if (record.submissionId && payload.submissionId) {
    if (normalize(record.submissionId) !== normalize(payload.submissionId)) {
      errors.push(
        `Submission ID ไม่ตรงกัน (ส่ง: "${payload.submissionId}", บันทึก: "${record.submissionId}")`
      );
    } else {
      verifiedFields.push('Submission ID');
    }
  }

  // 2. ข้อมูลผู้บันทึกข้อมูล (Recorder)
  // ชื่อ
  const expectedRecName = normalize(payload.recorder.name);
  const actualRecName = normalize(record.recorderName || (record.rawRecorder?.name));
  if (actualRecName !== expectedRecName && !record.recorder?.includes(expectedRecName)) {
    errors.push(`ชื่อผู้บันทึกไม่ตรงกัน (ส่ง: "${expectedRecName}", บันทึก: "${actualRecName}")`);
  } else {
    verifiedFields.push('ชื่อผู้บันทึกข้อมูล');
  }

  // นามสกุล
  const expectedRecSurname = normalize(payload.recorder.surname);
  const actualRecSurname = normalize(record.recorderSurname || (record.rawRecorder?.surname));
  if (actualRecSurname !== expectedRecSurname && !record.recorder?.includes(expectedRecSurname)) {
    errors.push(`นามสกุลผู้บันทึกไม่ตรงกัน (ส่ง: "${expectedRecSurname}", บันทึก: "${actualRecSurname}")`);
  } else {
    verifiedFields.push('นามสกุลผู้บันทึกข้อมูล');
  }

  // ตำแหน่ง
  const expectedRecPos = normalize(payload.recorder.position);
  const actualRecPos = normalize(record.recorderPosition || record.rawRecorder?.position);
  if (actualRecPos !== expectedRecPos) {
    errors.push(`ตำแหน่งผู้บันทึกไม่ตรงกัน (ส่ง: "${expectedRecPos}", บันทึก: "${actualRecPos}")`);
  } else {
    verifiedFields.push('ตำแหน่งผู้บันทึกข้อมูล');
  }

  // สายงาน
  const expectedRecAffil = normalize(payload.recorder.affiliation);
  const actualRecAffil = normalize(record.recorderAffiliation || record.rawRecorder?.affiliation);
  if (actualRecAffil !== expectedRecAffil) {
    errors.push(`สายงานผู้บันทึกไม่ตรงกัน (ส่ง: "${expectedRecAffil}", บันทึก: "${actualRecAffil}")`);
  } else {
    verifiedFields.push('สายงานผู้บันทึกข้อมูล');
  }

  // หน่วยงาน
  const expectedRecDept = normalize(payload.recorder.department);
  const actualRecDept = normalize(record.recorderDepartment || record.rawRecorder?.department);
  if (actualRecDept !== expectedRecDept) {
    errors.push(`หน่วยงานผู้บันทึกไม่ตรงกัน (ส่ง: "${expectedRecDept}", บันทึก: "${actualRecDept}")`);
  } else {
    verifiedFields.push('หน่วยงานผู้บันทึกข้อมูล');
  }

  // เบอร์โทรศัพท์
  const expectedPhone = normalize(payload.recorder.phone);
  const actualPhone = normalize(record.phone);
  if (actualPhone !== expectedPhone) {
    errors.push(`เบอร์โทรศัพท์ผู้บันทึกไม่ตรงกัน (ส่ง: "${expectedPhone}", บันทึก: "${actualPhone}")`);
  } else {
    verifiedFields.push('เบอร์โทรศัพท์ผู้บันทึกข้อมูล');
  }

  // อีเมล
  const expectedEmail = normalize(payload.recorder.email);
  const actualEmail = normalize(record.email);
  if (actualEmail !== expectedEmail) {
    errors.push(`อีเมลผู้บันทึกไม่ตรงกัน (ส่ง: "${expectedEmail}", บันทึก: "${actualEmail}")`);
  } else {
    verifiedFields.push('อีเมลผู้บันทึกข้อมูล');
  }

  // 3. ข้อมูลผู้บริหาร (Executive)
  // เดือนที่รายงาน
  const expectedMonth = normalize(payload.executive.month);
  const actualMonth = normalize(record.month);
  if (actualMonth !== expectedMonth && !actualMonth.includes(expectedMonth)) {
    errors.push(`เดือนที่รายงานไม่ตรงกัน (ส่ง: "${expectedMonth}", บันทึก: "${actualMonth}")`);
  } else {
    verifiedFields.push('เดือนที่รายงาน');
  }

  // ชื่อผู้บริหาร
  const expectedExecName = normalize(payload.executive.name);
  const actualExecName = normalize(record.executiveName || record.rawExecutive?.name);
  if (actualExecName !== expectedExecName && !record.speaker?.includes(expectedExecName)) {
    errors.push(`ชื่อผู้บริหารไม่ตรงกัน (ส่ง: "${expectedExecName}", บันทึก: "${actualExecName}")`);
  } else {
    verifiedFields.push('ชื่อผู้บริหาร');
  }

  // นามสกุลผู้บริหาร
  const expectedExecSurname = normalize(payload.executive.surname);
  const actualExecSurname = normalize(record.executiveSurname || record.rawExecutive?.surname);
  if (actualExecSurname !== expectedExecSurname && !record.speaker?.includes(expectedExecSurname)) {
    errors.push(`นามสกุลผู้บริหารไม่ตรงกัน (ส่ง: "${expectedExecSurname}", บันทึก: "${actualExecSurname}")`);
  } else {
    verifiedFields.push('นามสกุลผู้บริหาร');
  }

  // ตำแหน่งผู้บริหาร
  const expectedExecPos = normalize(payload.executive.position);
  const actualExecPos = normalize(record.speakerPosition);
  if (actualExecPos !== expectedExecPos) {
    errors.push(`ตำแหน่งผู้บริหารไม่ตรงกัน (ส่ง: "${expectedExecPos}", บันทึก: "${actualExecPos}")`);
  } else {
    verifiedFields.push('ตำแหน่งผู้บริหาร');
  }

  // สายงานผู้บริหาร
  const expectedExecAffil = normalize(payload.executive.affiliation);
  const actualExecAffil = normalize(record.speakerAffiliation);
  if (actualExecAffil !== expectedExecAffil) {
    errors.push(`สายงานผู้บริหารไม่ตรงกัน (ส่ง: "${expectedExecAffil}", บันทึก: "${actualExecAffil}")`);
  } else {
    verifiedFields.push('สายงานผู้บริหาร');
  }

  // หน่วยงานผู้บริหาร
  const expectedExecDept = normalize(payload.executive.department);
  const actualExecDept = normalize(record.speakerDepartment);
  if (actualExecDept !== expectedExecDept) {
    errors.push(`หน่วยงานผู้บริหารไม่ตรงกัน (ส่ง: "${expectedExecDept}", บันทึก: "${actualExecDept}")`);
  } else {
    verifiedFields.push('หน่วยงานผู้บริหาร');
  }

  // 4. รายละเอียดประเด็นการสื่อสาร (Topics & Details)
  if (payload.topics && payload.topics.length > 0) {
    const rawTopics = record.rawTopics || [];
    if (rawTopics.length !== payload.topics.length) {
      errors.push(`จำนวนประเด็นการสื่อสารไม่ครบถ้วน (ส่ง: ${payload.topics.length}, บันทึก: ${rawTopics.length})`);
    } else {
      let topicsDetailsMatch = true;
      payload.topics.forEach((t, idx) => {
        const savedT = rawTopics[idx];
        if (!savedT) {
          topicsDetailsMatch = false;
          errors.push(`ไม่พบประเด็นการสื่อสารลำดับที่ ${idx + 1}`);
          return;
        }

        // Compare selected topics
        const expectedTopics = (t.selectedTopics || []).map(normalize).sort().join(',');
        const actualTopics = (savedT.selectedTopics || []).map(normalize).sort().join(',');
        if (expectedTopics !== actualTopics) {
          topicsDetailsMatch = false;
          errors.push(`หัวข้อประเด็นการสื่อสารลำดับที่ ${idx + 1} ไม่ตรงกัน`);
        }

        // Compare details
        if (normalize(t.details) !== normalize(savedT.details)) {
          topicsDetailsMatch = false;
          errors.push(`รายละเอียดการสื่อสารลำดับที่ ${idx + 1} ไม่ตรงกัน`);
        }
      });

      if (topicsDetailsMatch) {
        verifiedFields.push('ประเด็นและรายละเอียดการสื่อสาร');
        verifiedFields.push('ช่องทางการสื่อสารและผู้รับสาร');
      }
    }
  }

  // 5. ปัญหาและอุปสรรค & ข้อเสนอแนะ (Feedback)
  const expectedProblems = normalize(payload.feedback.problemsObstacles);
  const actualProblems = normalize(record.problems);
  if (actualProblems !== expectedProblems) {
    errors.push(`ปัญหาและอุปสรรคไม่ตรงกัน (ส่ง: "${expectedProblems}", บันทึก: "${actualProblems}")`);
  } else {
    verifiedFields.push('ปัญหาและอุปสรรคในการสื่อสาร');
  }

  const expectedSuggestions = normalize(payload.feedback.executiveSuggestions);
  const actualSuggestions = normalize(record.suggestions);
  if (actualSuggestions !== expectedSuggestions) {
    errors.push(`ข้อเสนอแนะไม่ตรงกัน (ส่ง: "${expectedSuggestions}", บันทึก: "${actualSuggestions}")`);
  } else {
    verifiedFields.push('ข้อเสนอแนะของผู้บริหาร');
  }

  const isValid = errors.length === 0;

  return {
    isValid,
    errors,
    submissionId: record.submissionId,
    recordId: record.id,
    verifiedFields
  };
}

/**
 * Executes the complete SAVE -> READ-BACK -> VERIFY flow:
 * 1. SAVE: Call mwaService.submitReport(payload)
 * 2. READ-BACK: Call mwaService.getRecordBySubmissionId(submissionId) / getRecordById(recordId)
 * 3. VERIFY: Compare all submitted fields with read-back record
 * 4. RETURN result (SUCCESS or FAILED)
 */
export async function executeSaveAndVerify(
  payload: SavePayload,
  simulations?: {
    simulateReadBackNotFound?: boolean;
    simulateDataMismatch?: boolean;
  }
): Promise<SaveAndVerifyResult> {
  console.log('[MWA SAVE+VERIFY] Starting Save Flow for Submission ID:', payload.submissionId);

  // 1. SAVE STEP
  const saveResponse = await mwaService.submitReport(payload);

  if (!saveResponse || saveResponse.success !== true || typeof saveResponse.recordId !== 'number') {
    const errorMsg = saveResponse?.message || 'ระบบไม่สามารถบันทึกข้อมูลเข้าสู่ฐานข้อมูลได้';
    console.error('[MWA SAVE FAILED]', errorMsg);
    return {
      success: false,
      status: 'FAILED',
      message: errorMsg,
      errors: [errorMsg]
    };
  }

  const savedRecordId = saveResponse.recordId;
  const savedSubmissionId = saveResponse.submissionId || payload.submissionId;
  console.log(`[MWA SAVE STEP COMPLETE] Saved Record ID: ${savedRecordId}, Submission ID: ${savedSubmissionId}`);

  // 2. READ-BACK STEP
  console.log('[MWA READ-BACK STEP] Querying record by Submission ID / Record ID...');

  let readBackRecord: ReportRecord | null = null;

  if (simulations?.simulateReadBackNotFound) {
    console.warn('[SIMULATION TEST] Simulating Read-Back Record NOT FOUND');
    readBackRecord = null;
  } else {
    // Read-back by submission ID first, then fallback to recordId
    readBackRecord = await mwaService.getRecordBySubmissionId(savedSubmissionId);
    if (!readBackRecord) {
      readBackRecord = await mwaService.getRecordById(savedRecordId);
    }
  }

  if (simulations?.simulateDataMismatch && readBackRecord) {
    console.warn('[SIMULATION TEST] Simulating Data Mismatch');
    readBackRecord = {
      ...readBackRecord,
      recorderName: 'ชื่อไม่ตรงกันจากการทดสอบจำลอง',
      recorder: 'ชื่อไม่ตรงกันจากการทดสอบจำลอง'
    };
  }

  // 3. VERIFY STEP
  console.log('[MWA VERIFY STEP] Comparing submitted payload against read-back database record...');
  const verification = verifySavedRecord(payload, readBackRecord);

  if (!verification.isValid) {
    console.error('[MWA VERIFICATION FAILED] Details of mismatch:', verification.errors);
    return {
      success: false,
      status: 'FAILED',
      recordId: savedRecordId,
      submissionId: savedSubmissionId,
      message: 'ระบบยังไม่สามารถยืนยันการบันทึกข้อมูลได้ กรุณาลองใหม่อีกครั้ง',
      errors: verification.errors,
      record: readBackRecord || undefined
    };
  }

  console.log('[MWA VERIFICATION SUCCESS] Verified all fields:', verification.verifiedFields);

  return {
    success: true,
    status: 'SUCCESS',
    recordId: savedRecordId,
    submissionId: savedSubmissionId,
    message: 'บันทึกข้อมูลสำเร็จและตรวจสอบข้อมูลเรียบร้อยแล้ว',
    record: readBackRecord!
  };
}
