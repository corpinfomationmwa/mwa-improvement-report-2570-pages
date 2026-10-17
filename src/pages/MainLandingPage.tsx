import React, { useState, useEffect, useRef } from 'react';
import { Header } from '../components/Header';
import { TabNavigation, TabType } from '../components/TabNavigation';
import { StepIndicator } from '../components/StepIndicator';
import { FormStep1Recorder } from '../components/FormStep1Recorder';
import { FormStep2Executive } from '../components/FormStep2Executive';
import { FormStep3Topics } from '../components/FormStep3Topics';
import { FormStep4Feedback } from '../components/FormStep4Feedback';
import { DataTabContent } from '../components/DataTabContent';
import { DashboardTabContent } from '../components/DashboardTabContent';
import {
  RecorderInfo,
  ExecutiveInfo,
  CommunicationTopicItem,
  FeedbackInfo,
  RecorderProfile,
  ReportRecord
} from '../types/mwa';
import { mwaService } from '../services/mwaService';
import { PrintDocument } from '../components/PrintDocument';
import { PdfPreviewModal } from '../components/PdfPreviewModal';
import { recordToPrintPayload, generatePdfFromVerifiedRecord, PrintPayload } from '../utils/mwaPrintConverter';
import { verifySavedRecord, SavePayload } from '../utils/saveVerification';
import { buildConfirmationEmailContent, sendConfirmationEmail } from '../services/emailService';
import { generateLandscapePdfBlob } from '../utils/pdfGeneratorLandscape';
import { clearCurrentPdf, getCurrentPdfDocument } from '../services/currentPdfStore';
import { CheckCircle2, FileText, AlertCircle, AlertTriangle, History, RotateCcw, Mail, Send } from 'lucide-react';

export type SaveOperationState =
  | 'IDLE'
  | 'VALIDATING'
  | 'SAVING'
  | 'VERIFYING'
  | 'GENERATING_PDF'
  | 'SENDING_EMAIL'
  | 'EMAIL_FAILED'
  | 'SUCCESS'
  | 'ERROR';
import {
  saveFormDraft,
  getFormDraft,
  clearFormDraft,
  isDraftNonEmpty,
  generateSubmissionId,
  FormDraftData
} from '../utils/draftStorage';

export const createDefaultTopicItem = (id: number = 1): CommunicationTopicItem => ({
  id,
  selectedTopics: [],
  details: '',
  communicationTypes: {
    internal: false,
    external: false
  },
  internalChannels: [],
  externalChannels: [],
  internalAudiences: [],
  internalAudienceDetails: {},
  externalAudiences: [],
  externalAudienceDetails: {},
  evidenceFiles: [],
  additionalDetails: ''
});

export const MainLandingPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('form');
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveOperationState, setSaveOperationState] = useState<SaveOperationState>('IDLE');
  const [savedRecordInfo, setSavedRecordInfo] = useState<{ recordId?: number; submissionId?: string } | null>(null);
  const [verifiedRecord, setVerifiedRecord] = useState<ReportRecord | null>(null);
  const [cachedPdfAttachment, setCachedPdfAttachment] = useState<any>(null);
  const [emailErrorMessage, setEmailErrorMessage] = useState<string>('');
  const [sentEmailInfo, setSentEmailInfo] = useState<{
    recipientEmail: string;
    recordId: number;
    submissionId: string;
    executiveName?: string;
    communicationMonth?: string;
    recorderName?: string;
    attachmentName?: string;
    messageId?: string;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Validation Modal State (tracks the first failing topic 1-30 and specific message/field)
  const [validationModalData, setValidationModalData] = useState<{
    isOpen: boolean;
    topicNumber: number;
    message: string;
    fieldId?: string;
  } | null>(null);
  const [highlightedTopicNumber, setHighlightedTopicNumber] = useState<number | null>(null);
  const [highlightedFieldId, setHighlightedFieldId] = useState<string | null>(null);

  // Persistent submissionId (idempotency key) for current draft/session
  const [currentSubmissionId, setCurrentSubmissionId] = useState<string>(() => generateSubmissionId());

  // Auto-save draft status
  const [draftStatus, setDraftStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [lastSavedTime, setLastSavedTime] = useState<string>('');

  // Draft Recovery Modal State
  const [showRecoveryModal, setShowRecoveryModal] = useState<boolean>(false);
  const [pendingDraft, setPendingDraft] = useState<FormDraftData | null>(null);
  const [showResetConfirmModal, setShowResetConfirmModal] = useState<boolean>(false);

  const isInitialMount = useRef(true);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isSavingInProgressRef = useRef<boolean>(false);

  // Dedicated Print Data (holds either current Form State or selected record from Data Tab)
  const [printTargetData, setPrintTargetData] = useState<PrintPayload | null>(null);

  // PDF Preview Modal State
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState<boolean>(false);
  const [activePreviewData, setActivePreviewData] = useState<PrintPayload | null>(null);

  // Track if user has manually changed executive affiliation or department
  const [isExecutiveAffiliationTouched, setIsExecutiveAffiliationTouched] = useState<boolean>(false);
  const [isExecutiveDepartmentTouched, setIsExecutiveDepartmentTouched] = useState<boolean>(false);

  // Shared Form State
  const [recorderData, setRecorderData] = useState<RecorderInfo>({
    title: 'นาย',
    name: '',
    surname: '',
    position: '',
    affiliation: '',
    department: '',
    phone: '',
    email: ''
  });

  const [executiveData, setExecutiveData] = useState<ExecutiveInfo>({
    month: '',
    title: 'นาย',
    name: '',
    surname: '',
    position: '',
    affiliation: '',
    department: ''
  });

  const [topics, setTopics] = useState<CommunicationTopicItem[]>([createDefaultTopicItem(1)]);

  const [feedbackData, setFeedbackData] = useState<FeedbackInfo>({
    problemsObstacles: '',
    executiveSuggestions: ''
  });

  // Invalidate verified record state if user modifies form after successful verification
  const invalidateVerifiedState = () => {
    if (verifiedRecord !== null) {
      console.log('[MWA INVALIDATION] Form modified. Invalidating verified record state.');
      setVerifiedRecord(null);
      setCachedPdfAttachment(null);
      clearCurrentPdf();
    }
    if (saveOperationState === 'SUCCESS') {
      setSaveOperationState('IDLE');
    }
  };

  // Handlers for Recorder form
  const handleRecorderChange = (field: keyof RecorderInfo, value: string) => {
    invalidateVerifiedState();
    setRecorderData((prev) => {
      const updated = { ...prev, [field]: value };
      if (field === 'affiliation' && value !== prev.affiliation) {
        updated.department = '';
      }
      // If user hasn't manually customized executive affiliation, sync default from recorder
      if (field === 'affiliation' && !isExecutiveAffiliationTouched) {
        setExecutiveData((execPrev) => ({
          ...execPrev,
          affiliation: value,
          department: ''
        }));
      } else if (field === 'department' && !isExecutiveDepartmentTouched) {
        setExecutiveData((execPrev) => ({
          ...execPrev,
          department: value
        }));
      }
      return updated;
    });
  };

  // Handler for Profile Selection (Autofill from mock profile)
  const handleProfileSelect = (profile: RecorderProfile) => {
    invalidateVerifiedState();
    setRecorderData({
      title: profile.title || 'นาย',
      name: profile.name,
      surname: profile.surname,
      position: profile.position,
      affiliation: profile.affiliation,
      department: profile.department,
      phone: profile.phone,
      email: profile.email || `${profile.name.toLowerCase()}@mwa.co.th`
    });

    // If executive affiliation hasn't been manually changed, sync defaults from the selected profile
    if (!isExecutiveAffiliationTouched) {
      setExecutiveData((execPrev) => ({
        ...execPrev,
        affiliation: profile.affiliation,
        department: !isExecutiveDepartmentTouched ? profile.department : execPrev.department
      }));
    }
  };

  // Handlers for Executive form
  const handleExecutiveChange = (field: keyof ExecutiveInfo, value: string) => {
    invalidateVerifiedState();
    if (field === 'affiliation') {
      setIsExecutiveAffiliationTouched(true);
      setIsExecutiveDepartmentTouched(true);
    } else if (field === 'department') {
      setIsExecutiveDepartmentTouched(true);
    }
    setExecutiveData((prev) => {
      const updated = { ...prev, [field]: value };
      if (field === 'affiliation' && value !== prev.affiliation) {
        updated.department = '';
      }
      return updated;
    });
  };

  // Handlers for Topics form
  const handleAddTopic = () => {
    invalidateVerifiedState();
    if (topics.length >= 30) return;
    const newId = topics.length > 0 ? Math.max(...topics.map((t) => t.id)) + 1 : 1;
    setTopics((prev) => [...prev, createDefaultTopicItem(newId)]);
  };

  const handleRemoveTopic = (id: number) => {
    invalidateVerifiedState();
    if (topics.length <= 1) return;
    setTopics((prev) => prev.filter((t) => t.id !== id));
  };

  const handleUpdateTopic = (id: number, updated: Partial<CommunicationTopicItem>) => {
    invalidateVerifiedState();
    setTopics((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updated } : t))
    );
  };

  // Handlers for Feedback form
  const handleFeedbackChange = (field: keyof FeedbackInfo, value: string) => {
    invalidateVerifiedState();
    setFeedbackData((prev) => ({ ...prev, [field]: value }));
  };

  // Auto-check for existing unsubmitted draft on mount
  useEffect(() => {
    const existingDraft = getFormDraft();
    if (existingDraft && isDraftNonEmpty(existingDraft)) {
      setPendingDraft(existingDraft);
      setShowRecoveryModal(true);
    }
  }, []);

  // Debounced auto-save effect whenever form data or currentStep changes
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (isSubmitting) return;

    setDraftStatus('saving');

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = setTimeout(() => {
      const draftData: FormDraftData = {
        submissionId: currentSubmissionId,
        recorder: recorderData,
        executive: executiveData,
        topics: topics,
        feedback: feedbackData,
        currentStep: currentStep,
        lastSavedAt: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
      };
      saveFormDraft(draftData);
      setDraftStatus('saved');
      setLastSavedTime(draftData.lastSavedAt);
    }, 600);

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [recorderData, executiveData, topics, feedbackData, currentStep, currentSubmissionId, isSubmitting]);

  // Restore draft handler
  const handleRestoreDraft = () => {
    if (pendingDraft) {
      if (pendingDraft.submissionId) setCurrentSubmissionId(pendingDraft.submissionId);
      if (pendingDraft.recorder) setRecorderData(pendingDraft.recorder);
      if (pendingDraft.executive) setExecutiveData(pendingDraft.executive);
      if (pendingDraft.topics && pendingDraft.topics.length > 0) {
        setTopics(pendingDraft.topics);
      } else {
        setTopics([createDefaultTopicItem(1)]);
      }
      if (pendingDraft.feedback) setFeedbackData(pendingDraft.feedback);
      if (pendingDraft.currentStep) setCurrentStep(pendingDraft.currentStep);
      setDraftStatus('saved');
      setLastSavedTime(pendingDraft.lastSavedAt || new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }));
    }
    setShowRecoveryModal(false);
  };

  // Confirm start fresh handler
  const handleConfirmStartNew = () => {
    clearFormDraft();
    clearCurrentPdf();
    setCachedPdfAttachment(null);
    setCurrentSubmissionId(generateSubmissionId());
    setCurrentStep(1);
    setRecorderData({
      title: 'นาย',
      name: '',
      surname: '',
      position: '',
      affiliation: '',
      department: '',
      phone: '',
      email: ''
    });
    setExecutiveData({
      month: '',
      title: 'นาย',
      name: '',
      surname: '',
      position: '',
      affiliation: '',
      department: ''
    });
    setTopics([createDefaultTopicItem(1)]);
    setFeedbackData({
      problemsObstacles: '',
      executiveSuggestions: ''
    });
    setDraftStatus('saved');
    setLastSavedTime('');
    setShowResetConfirmModal(false);
    setShowRecoveryModal(false);
  };

  // Validation function to ensure all communication topics are complete according to rules
  // Checks each topic 1 → 30 in sequence, stops and alerts on the FIRST failing topic & field
  const validateTopics = (): boolean => {
    if (!topics || topics.length === 0) {
      setValidationModalData({
        isOpen: true,
        topicNumber: 1,
        message: 'กรุณาเลือกประเด็นการสื่อสารอย่างน้อย 1 ประเด็น',
        fieldId: 'topic-field-selectedTopics-1'
      });
      return false;
    }

    for (let idx = 0; idx < topics.length; idx++) {
      const item = topics[idx];
      const topicNum = idx + 1;

      // 1. เลือกประเด็นการสื่อสาร (เลือกได้หลายประเด็น) *
      if (!item.selectedTopics || item.selectedTopics.length === 0) {
        setValidationModalData({
          isOpen: true,
          topicNumber: topicNum,
          message: 'กรุณาเลือกประเด็นการสื่อสารอย่างน้อย 1 ประเด็น',
          fieldId: `topic-field-selectedTopics-${topicNum}`
        });
        return false;
      }

      // 2. รายละเอียดที่ทำการสื่อสาร *
      if (!item.details || item.details.trim().length === 0) {
        setValidationModalData({
          isOpen: true,
          topicNumber: topicNum,
          message: 'กรุณากรอกรายละเอียดที่ทำการสื่อสาร',
          fieldId: `topic-field-details-${topicNum}`
        });
        return false;
      }

      // 3. เลือกประเภทการสื่อสาร (เลือกได้ทั้งสองตัวเลือก) *
      const hasInternal = !!item.communicationTypes?.internal;
      const hasExternal = !!item.communicationTypes?.external;
      if (!hasInternal && !hasExternal) {
        setValidationModalData({
          isOpen: true,
          topicNumber: topicNum,
          message: 'กรุณาเลือกประเภทการสื่อสารอย่างน้อย 1 ประเภท',
          fieldId: `topic-field-types-${topicNum}`
        });
        return false;
      }

      // 4. เมื่อเลือก "การสื่อสารภายใน"
      if (hasInternal) {
        // 4.1 ช่องทางการสื่อสารภายใน
        if (!item.internalChannels || item.internalChannels.length === 0) {
          setValidationModalData({
            isOpen: true,
            topicNumber: topicNum,
            message: 'กรุณาเลือกช่องทางการสื่อสารภายในอย่างน้อย 1 ช่องทาง',
            fieldId: `topic-field-internalChannels-${topicNum}`
          });
          return false;
        }

        // 4.2 กลุ่มผู้รับสารภายใน
        if (!item.internalAudiences || item.internalAudiences.length === 0) {
          setValidationModalData({
            isOpen: true,
            topicNumber: topicNum,
            message: 'กรุณาเลือกกลุ่มผู้รับสารภายในอย่างน้อย 1 กลุ่ม',
            fieldId: `topic-field-internalAudiences-${topicNum}`
          });
          return false;
        }
      }

      // 5. เมื่อเลือก "การสื่อสารภายนอก"
      if (hasExternal) {
        // 5.1 ช่องทางการสื่อสารภายนอก
        if (!item.externalChannels || item.externalChannels.length === 0) {
          setValidationModalData({
            isOpen: true,
            topicNumber: topicNum,
            message: 'กรุณาเลือกช่องทางการสื่อสารภายนอกอย่างน้อย 1 ช่องทาง',
            fieldId: `topic-field-externalChannels-${topicNum}`
          });
          return false;
        }

        // 5.2 กลุ่มผู้รับสารภายนอก
        if (!item.externalAudiences || item.externalAudiences.length === 0) {
          setValidationModalData({
            isOpen: true,
            topicNumber: topicNum,
            message: 'กรุณาเลือกกลุ่มผู้รับสารภายนอกอย่างน้อย 1 กลุ่ม',
            fieldId: `topic-field-externalAudiences-${topicNum}`
          });
          return false;
        }
      }
    }

    return true;
  };

  const handleDismissValidationModal = () => {
    const topicNum = validationModalData?.topicNumber || 1;
    const targetFieldId = validationModalData?.fieldId;
    setValidationModalData(null);
    setCurrentStep(3);
    setHighlightedTopicNumber(topicNum);
    setHighlightedFieldId(targetFieldId || null);

    // Scroll to the specific invalid field or problematic topic card
    setTimeout(() => {
      const fieldEl = targetFieldId ? document.getElementById(targetFieldId) : null;
      if (fieldEl) {
        fieldEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // If it's an input or textarea, focus it
        if (fieldEl instanceof HTMLInputElement || fieldEl instanceof HTMLTextAreaElement) {
          fieldEl.focus();
        } else {
          const innerInput = fieldEl.querySelector('input, textarea') as HTMLElement | null;
          if (innerInput) innerInput.focus();
        }
      } else {
        const cardEl = document.getElementById(`topic-card-${topicNum}`);
        if (cardEl) {
          cardEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }, 100);

    // Clear highlight after 4 seconds
    setTimeout(() => {
      setHighlightedTopicNumber(null);
      setHighlightedFieldId(null);
    }, 4000);
  };

  const getSubmitButtonText = () => {
    switch (saveOperationState) {
      case 'VALIDATING':
        return 'กำลังตรวจสอบความถูกต้อง...';
      case 'SAVING':
        return 'กำลังบันทึกข้อมูล...';
      case 'VERIFYING':
        return 'กำลังตรวจสอบข้อมูล...';
      case 'GENERATING_PDF':
        return 'กำลังสร้างเอกสาร PDF...';
      case 'SENDING_EMAIL':
        return 'กำลังส่ง Email ยืนยัน...';
      default:
        return 'บันทึกข้อมูล';
    }
  };

  // Submission handler with Save + Read-Back + Strict Verification + PDF + Email Confirmation
  const handleFormSubmit = async (simulationOpts?: {
    simulateReadBackNotFound?: boolean;
    simulateDataMismatch?: boolean;
    simulatePdfFailure?: boolean;
    simulateEmailFailure?: boolean;
  }) => {
    // Synchronous guard against double-clicks
    if (
      isSavingInProgressRef.current ||
      isSubmitting ||
      saveOperationState === 'SAVING' ||
      saveOperationState === 'VERIFYING' ||
      saveOperationState === 'GENERATING_PDF' ||
      saveOperationState === 'SENDING_EMAIL' ||
      saveOperationState === 'VALIDATING'
    ) {
      console.warn('[MWA SUBMIT GUARD] Submission already in progress. Ignoring duplicate click.');
      return;
    }

    // 1. VALIDATING
    setSaveOperationState('VALIDATING');
    if (!validateTopics()) {
      setSaveOperationState('IDLE');
      return;
    }

    isSavingInProgressRef.current = true;
    setIsSubmitting(true);
    // Guarantee fresh recipient state for current submission
    setSentEmailInfo(null);
    setEmailErrorMessage('');

    // STEP 1: Immediately save current form state to Draft in Browser (Fail-Safe)
    const currentDraft: FormDraftData = {
      submissionId: currentSubmissionId,
      recorder: recorderData,
      executive: executiveData,
      topics: topics,
      feedback: feedbackData,
      currentStep: 4,
      lastSavedAt: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
    };
    saveFormDraft(currentDraft);
    setDraftStatus('saved');
    setLastSavedTime(currentDraft.lastSavedAt);

    // STEP 2: Transition to SAVING state
    setSaveOperationState('SAVING');

    const payload: SavePayload = {
      submissionId: currentSubmissionId,
      recorder: recorderData,
      executive: executiveData,
      topics: topics,
      feedback: feedbackData
    };

    try {
      console.log('[MWA STEP 1: SAVE] Saving to storage with Submission ID:', currentSubmissionId);

      // STEP 3: Real async request to database
      const saveResponse = await mwaService.submitReport(payload);

      // STEP 4: Validate Backend Response & Record ID
      if (!saveResponse || saveResponse.success !== true || typeof saveResponse.recordId !== 'number') {
        throw new Error(saveResponse?.message || 'ระบบไม่สามารถบันทึกข้อมูลเข้าสู่ฐานข้อมูลได้ กรุณาลองใหม่อีกครั้ง');
      }

      const savedRecordId = saveResponse.recordId;
      const savedSubmissionId = saveResponse.submissionId || currentSubmissionId;
      console.log(`[MWA STEP 1: SAVE SUCCESS] Record ID=${savedRecordId}, Submission ID=${savedSubmissionId}`);

      // STEP 5: Transition to VERIFYING state (READ-BACK)
      setSaveOperationState('VERIFYING');

      // Brief delay for smooth UI feedback and realistic async roundtrip
      await new Promise((resolve) => setTimeout(resolve, 350));

      console.log(`[MWA STEP 2: READ-BACK] Querying record by Submission ID (${savedSubmissionId}) / Record ID (${savedRecordId})...`);

      let readBackRecord: ReportRecord | null = null;
      if (simulationOpts?.simulateReadBackNotFound) {
        console.warn('[TEST SIMULATION] Simulating Read-back not found');
        readBackRecord = null;
      } else {
        readBackRecord = await mwaService.getRecordBySubmissionId(savedSubmissionId);
        if (!readBackRecord) {
          readBackRecord = await mwaService.getRecordById(savedRecordId);
        }
      }

      if (simulationOpts?.simulateDataMismatch && readBackRecord) {
        console.warn('[TEST SIMULATION] Simulating Data Mismatch');
        readBackRecord = {
          ...readBackRecord,
          recorderName: 'ชื่อไม่ตรงกันจากการทดสอบจำลอง',
          recorder: 'ชื่อไม่ตรงกันจากการทดสอบจำลอง'
        };
      }

      // If READ-BACK failed to find the record
      if (!readBackRecord) {
        throw new Error('ระบบยังไม่สามารถยืนยันการบันทึกข้อมูลได้ กรุณาลองใหม่อีกครั้ง (ไม่พบข้อมูลในฐานข้อมูลจากการอ่านกลับ)');
      }

      // STEP 6: VERIFY: Compare all required fields strictly
      console.log('[MWA STEP 2: VERIFY] Comparing submitted payload against read-back record...');
      const verification = verifySavedRecord(payload, readBackRecord);

      if (!verification.isValid) {
        console.error('[MWA VERIFICATION FAILED] Details of mismatch:', verification.errors);
        throw new Error('ระบบยังไม่สามารถยืนยันการบันทึกข้อมูลได้ กรุณาลองใหม่อีกครั้ง');
      }

      console.log('[MWA STEP 2: VERIFY SUCCESS] All critical fields confirmed in database:', verification.verifiedFields);

      // Save verifiedRecord as the official Source of Truth for PDF and Email
      setVerifiedRecord(readBackRecord);
      setSavedRecordInfo({
        recordId: savedRecordId,
        submissionId: savedSubmissionId
      });

      // Sync Web Page PDF (<PrintDocument />) payload from Verified Record
      const verifiedPrintPayload = recordToPrintPayload(readBackRecord);
      setActivePreviewData(verifiedPrintPayload);
      setPrintTargetData(verifiedPrintPayload);

      // STEP 7: GENERATE WEB PAGE PDF strictly from Verified Record (Single Source of Truth for Preview & Email)
      setSaveOperationState('GENERATING_PDF');
      console.log('[MWA STEP 3: PDF] Generating Web Page A4 Landscape PDF from Verified Record...');

      const pdfAttachment = await generateLandscapePdfBlob(readBackRecord, {
        simulatePdfFailure: simulationOpts?.simulatePdfFailure
      });

      if (
        !pdfAttachment ||
        !pdfAttachment.blob ||
        pdfAttachment.sizeBytes <= 1000 ||
        !pdfAttachment.base64 ||
        pdfAttachment.base64.length <= 1000
      ) {
        throw new Error('สร้าง PDF ไม่สำเร็จ จึงยังไม่ส่ง Email');
      }

      console.log(`[MWA STEP 3: PDF SUCCESS] Generated: ${pdfAttachment.filename} (${pdfAttachment.sizeBytes} bytes, Base64 length: ${pdfAttachment.base64.length})`);
      setCachedPdfAttachment(pdfAttachment);

      // STEP 8: SEND CONFIRMATION EMAIL with PDF Attachment
      setSaveOperationState('SENDING_EMAIL');
      console.log('[MWA STEP 4: EMAIL] Preparing and sending Confirmation Email to recorder...');

      // 1. Resolve 4 Core Fields strictly from readBackRecord (Single Source of Truth)
      const rawExec = readBackRecord.rawExecutive;
      const executiveName = (
        rawExec
          ? `${rawExec.title || ''}${rawExec.name || ''} ${rawExec.surname || ''}`
          : (readBackRecord.executiveName
              ? `${readBackRecord.executiveTitle || ''}${readBackRecord.executiveName} ${readBackRecord.executiveSurname || ''}`
              : readBackRecord.speaker || '')
      ).trim() || 'ผู้บริหาร';

      const communicationMonth = (
        rawExec?.month ||
        readBackRecord.executiveMonth ||
        readBackRecord.month ||
        ''
      ).replace(/^ประจำเดือน\s*/, '').trim();

      const rawRec = readBackRecord.rawRecorder;
      const recorderName = (
        rawRec
          ? `${rawRec.title || ''}${rawRec.name || ''} ${rawRec.surname || ''}`
          : (readBackRecord.recorderName
              ? `${readBackRecord.recorderTitle || ''}${readBackRecord.recorderName} ${readBackRecord.recorderSurname || ''}`
              : readBackRecord.recorder || '')
      ).trim() || 'ผู้จัดทำเอกสาร';

      const recorderEmail = (
        rawRec?.email ||
        readBackRecord.email ||
        ''
      ).trim();

      // Log [EMAIL DATA VERIFIED] exactly as required
      console.log('[EMAIL DATA VERIFIED]');
      console.log('Record ID:\n' + savedRecordId);
      console.log('Submission ID:\n' + savedSubmissionId);
      console.log('Executive:\n' + executiveName);
      console.log('Communication Month:\n' + communicationMonth);
      console.log('Recorder:\n' + recorderName);
      console.log('Recorder Email:\n' + recorderEmail);

      // Pre-flight check: Stop if any required field is missing
      if (!savedRecordId || !savedSubmissionId || !executiveName || !communicationMonth || !recorderName || !recorderEmail || !recorderEmail.includes('@')) {
        const missingFields = [
          !savedRecordId && 'Record ID',
          !savedSubmissionId && 'Submission ID',
          !executiveName && 'ผู้บริหาร',
          !communicationMonth && 'เดือนที่สื่อสาร',
          !recorderName && 'ผู้บันทึก',
          (!recorderEmail || !recorderEmail.includes('@')) && 'อีเมลผู้บันทึก'
        ].filter(Boolean).join(', ');
        throw new Error(`ข้อมูลใน Verified Record ไม่ครบถ้วนสำหรับสร้าง Email (ขาด: ${missingFields})`);
      }

      // Explicit recipient from verified record
      const recipient = recorderEmail;

      console.log('[EMAIL REQUEST]', {
        recordId: savedRecordId,
        submissionId: savedSubmissionId,
        recipient,
        executiveName,
        communicationMonth,
        recorderName,
        recorderEmail
      });

      const emailPayload = buildConfirmationEmailContent(
        readBackRecord,
        {
          filename: pdfAttachment.filename,
          blob: pdfAttachment.blob,
          base64: pdfAttachment.base64,
          mimeType: 'application/pdf',
          sizeBytes: pdfAttachment.sizeBytes
        },
        recipient
      );

      console.log('========================================');
      console.log('[MWA STEP 4: EMAIL DISPATCH START]');
      console.log('- Record ID:', savedRecordId);
      console.log('- Submission ID:', savedSubmissionId);
      console.log('- Email ผู้รับ:', emailPayload.recipientEmail);
      console.log('========================================');

      if (simulationOpts?.simulateEmailFailure) {
        throw new Error('ระบบไม่สามารถส่ง Email ยืนยันไปยังผู้รับได้ กรุณาลองใหม่อีกครั้ง (จำลองการส่งล้มเหลว)');
      }

      const emailSendResult = await sendConfirmationEmail(emailPayload);

      console.log('========================================');
      console.log('[MWA STEP 4: EMAIL DISPATCH RESULT]');
      console.log('- Record ID:', savedRecordId);
      console.log('- Submission ID:', savedSubmissionId);
      console.log('- Email ผู้รับ:', emailPayload.recipientEmail);
      console.log('- Status:', emailSendResult.status);
      console.log('- Success:', emailSendResult.success);
      console.log('- API Response / Error:', emailSendResult.error || '(None)');
      console.log('========================================');

      // CRITICAL SUCCESS RULE: check real response from Email Provider
      const isEmailDelivered =
        emailSendResult.success === true &&
        (emailSendResult.status === 'EMAIL_SENT' || emailSendResult.status === 'EMAIL_SUCCESS' || (emailSendResult as any).emailSent === true);

      if (isEmailDelivered) {
        console.log('[MWA STEP 4: EMAIL SUCCESS] Confirmation email dispatched successfully:', emailSendResult);
        clearFormDraft();
        setEmailErrorMessage('');

        setSentEmailInfo({
          recipientEmail: emailPayload.recipientEmail,
          recordId: savedRecordId,
          submissionId: savedSubmissionId,
          executiveName,
          communicationMonth,
          recorderName,
          attachmentName: emailPayload.pdfAttachment.filename,
          messageId: emailSendResult.messageId
        });

        setSaveOperationState('SUCCESS');
      } else {
        // Save + Verify SUCCEEDED, but Email FAILED / Not configured yet!
        // DO NOT show Save Error! Keep record intact and allow email retry!
        console.warn('[MWA STEP 4: EMAIL STATUS]', emailSendResult.error || emailSendResult.status);
        setEmailErrorMessage(emailSendResult.error || 'ผู้ให้บริการอีเมลส่งรายงานไม่สำเร็จ');
        setSentEmailInfo({
          recipientEmail: emailPayload.recipientEmail,
          recordId: savedRecordId,
          submissionId: savedSubmissionId,
          executiveName,
          communicationMonth,
          recorderName,
          attachmentName: emailPayload.pdfAttachment.filename,
          messageId: ''
        });
        setSaveOperationState('EMAIL_FAILED');
      }
    } catch (error: any) {
      console.warn('[MWA PIPELINE NOTICE]', error?.message || error);
      // Failure flow:
      // DO NOT clear form! Form state is 100% kept intact!
      // DO NOT clear draft! Draft in localStorage is 100% kept intact!
      // DO NOT change page! Keep user on Step 4!
      // Maintain currentSubmissionId for safe retry without duplicates!
      setErrorMessage(
        error?.message || 'ระบบไม่สามารถดำเนินกระบวนการส่งรายงานได้ กรุณาลองใหม่อีกครั้ง'
      );
      setSaveOperationState('ERROR');
    } finally {
      isSavingInProgressRef.current = false;
      setIsSubmitting(false);
    }
  };

  // Handler for Retrying Email Delivery ONLY (No re-save, no duplicate records!)
  const handleRetryEmail = async () => {
    if (!verifiedRecord || !cachedPdfAttachment || !savedRecordInfo) {
      console.warn('[MWA RETRY EMAIL] Missing verified record or PDF attachment');
      return;
    }

    const cleanRetryBase64 = (cachedPdfAttachment.base64 || '').replace(/^data:application\/pdf;base64,/, '').trim();
    if (!cleanRetryBase64 || cleanRetryBase64.length <= 1000) {
      setEmailErrorMessage('สร้าง PDF ไม่สำเร็จ จึงยังไม่ส่ง Email');
      setSaveOperationState('EMAIL_FAILED');
      return;
    }

    try {
      setIsSubmitting(true);
      setSaveOperationState('SENDING_EMAIL');
      setEmailErrorMessage('');

      console.log('[MWA RETRY EMAIL] Retrying email dispatch with existing verified record:', {
        recordId: savedRecordInfo.recordId,
        submissionId: savedRecordInfo.submissionId
      });

      // 1. Resolve 4 Core Fields strictly from verifiedRecord (Single Source of Truth)
      const rawExec = verifiedRecord.rawExecutive;
      const executiveName = (
        rawExec
          ? `${rawExec.title || ''}${rawExec.name || ''} ${rawExec.surname || ''}`
          : (verifiedRecord.executiveName
              ? `${verifiedRecord.executiveTitle || ''}${verifiedRecord.executiveName} ${verifiedRecord.executiveSurname || ''}`
              : verifiedRecord.speaker || '')
      ).trim() || 'ผู้บริหาร';

      const communicationMonth = (
        rawExec?.month ||
        verifiedRecord.executiveMonth ||
        verifiedRecord.month ||
        ''
      ).replace(/^ประจำเดือน\s*/, '').trim();

      const rawRec = verifiedRecord.rawRecorder;
      const recorderName = (
        rawRec
          ? `${rawRec.title || ''}${rawRec.name || ''} ${rawRec.surname || ''}`
          : (verifiedRecord.recorderName
              ? `${verifiedRecord.recorderTitle || ''}${verifiedRecord.recorderName} ${verifiedRecord.recorderSurname || ''}`
              : verifiedRecord.recorder || '')
      ).trim() || 'ผู้จัดทำเอกสาร';

      const recorderEmail = (
        rawRec?.email ||
        verifiedRecord.email ||
        ''
      ).trim();

      // Log [EMAIL DATA VERIFIED] exactly as required
      console.log('[EMAIL DATA VERIFIED]');
      console.log('Record ID:\n' + savedRecordInfo.recordId);
      console.log('Submission ID:\n' + savedRecordInfo.submissionId);
      console.log('Executive:\n' + executiveName);
      console.log('Communication Month:\n' + communicationMonth);
      console.log('Recorder:\n' + recorderName);
      console.log('Recorder Email:\n' + recorderEmail);

      const recipient = recorderEmail;

      console.log('[EMAIL REQUEST]', {
        recordId: savedRecordInfo.recordId,
        submissionId: savedRecordInfo.submissionId,
        recipient,
        executiveName,
        communicationMonth,
        recorderName,
        recorderEmail
      });

      const emailPayload = buildConfirmationEmailContent(
        verifiedRecord,
        {
          filename: cachedPdfAttachment.filename,
          blob: cachedPdfAttachment.blob,
          base64: cachedPdfAttachment.base64,
          mimeType: 'application/pdf',
          sizeBytes: cachedPdfAttachment.sizeBytes
        },
        recipient
      );

      console.log('========================================');
      console.log('[MWA RETRY EMAIL START]');
      console.log('- Record ID:', savedRecordInfo.recordId);
      console.log('- Submission ID:', savedRecordInfo.submissionId);
      console.log('- Email ผู้รับ:', emailPayload.recipientEmail);
      console.log('========================================');

      const emailSendResult = await sendConfirmationEmail(emailPayload);

      console.log('========================================');
      console.log('[MWA RETRY EMAIL RESULT]');
      console.log('- Record ID:', savedRecordInfo.recordId);
      console.log('- Submission ID:', savedRecordInfo.submissionId);
      console.log('- Email ผู้รับ:', emailPayload.recipientEmail);
      console.log('- Status:', emailSendResult.status);
      console.log('- Success:', emailSendResult.success);
      console.log('- API Response / Error:', emailSendResult.error || '(None)');
      console.log('========================================');

      const isEmailDelivered =
        emailSendResult.success === true &&
        (emailSendResult.status === 'EMAIL_SENT' || emailSendResult.status === 'EMAIL_SUCCESS' || (emailSendResult as any).emailSent === true);

      if (isEmailDelivered) {
        console.log('[MWA RETRY EMAIL SUCCESS]', emailSendResult);
        clearFormDraft();
        setEmailErrorMessage('');
        setSentEmailInfo({
          recipientEmail: emailPayload.recipientEmail,
          recordId: savedRecordInfo.recordId!,
          submissionId: savedRecordInfo.submissionId!,
          executiveName,
          communicationMonth,
          recorderName,
          attachmentName: emailPayload.pdfAttachment.filename,
          messageId: emailSendResult.messageId
        });
        setSaveOperationState('SUCCESS');
      } else {
        console.warn('[MWA RETRY EMAIL STATUS]', emailSendResult.error || emailSendResult.status);
        setEmailErrorMessage(emailSendResult.error || 'ผู้ให้บริการอีเมลส่งรายงานไม่สำเร็จ');
        setSentEmailInfo({
          recipientEmail: emailPayload.recipientEmail,
          recordId: savedRecordInfo.recordId!,
          submissionId: savedRecordInfo.submissionId!,
          executiveName,
          communicationMonth,
          recorderName,
          attachmentName: emailPayload.pdfAttachment.filename,
          messageId: ''
        });
        setSaveOperationState('EMAIL_FAILED');
      }
    } catch (err: any) {
      console.warn('[MWA RETRY EMAIL NOTICE]', err?.message || err);
      setEmailErrorMessage(err?.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อเพื่อส่งอีเมล');
      setSaveOperationState('EMAIL_FAILED');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler for dismiss on Success Modal
  const handleSuccessDismiss = () => {
    setSaveOperationState('IDLE');
    setSavedRecordInfo(null);
    setVerifiedRecord(null);
    setCachedPdfAttachment(null);
    clearCurrentPdf();
    setEmailErrorMessage('');
    setSentEmailInfo(null);
    // Generate fresh submissionId for new form
    setCurrentSubmissionId(generateSubmissionId());
    // Reset form into post-save clean state ready for next entry
    setCurrentStep(1);
    setRecorderData({
      title: 'นาย',
      name: '',
      surname: '',
      position: '',
      affiliation: '',
      department: '',
      phone: '',
      email: ''
    });
    setFeedbackData({
      problemsObstacles: '',
      executiveSuggestions: ''
    });
    setTopics([createDefaultTopicItem(1)]);
    setDraftStatus('saved');
    setLastSavedTime('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handler to open the exact same Web Page PDF from Verified Record as Source of Truth
  const handleGenerateVerifiedPdf = async () => {
    // 1. Verify guard: If verifyStatus !== SUCCESS/EMAIL_FAILED or verifiedRecord is null, forbid generation!
    const result = generatePdfFromVerifiedRecord(verifiedRecord, saveOperationState);
    if (!result.success || !result.payload) {
      console.warn('[PDF GENERATION BLOCKED] Attempted to generate PDF before verify success.');
      setErrorMessage(result.error || 'ยังไม่สามารถสร้างเอกสารได้ เนื่องจากยังตรวจสอบข้อมูลไม่สำเร็จ');
      setSaveOperationState('ERROR');
      return;
    }

    // 2. Reuse the exact Web Page PDF already generated for Email, or generate it once if missing
    console.log('[PDF PREVIEW] Opening Web Page PDF from Verified Record:', {
      recordId: result.payload.recordId,
      submissionId: result.payload.submissionId,
      sourceOfTruth: result.payload.sourceOfTruth
    });

    const activePdf = getCurrentPdfDocument();
    if (
      verifiedRecord &&
      (!cachedPdfAttachment ||
        !cachedPdfAttachment.blob ||
        (activePdf && activePdf.recordId !== verifiedRecord.id))
    ) {
      try {
        const attachment = await generateLandscapePdfBlob(verifiedRecord);
        setCachedPdfAttachment(attachment);
      } catch (err) {
        console.error('[PDF GENERATION ERROR]', err);
      }
    }

    setActivePreviewData(result.payload);
    setPrintTargetData(result.payload);
    setIsPreviewModalOpen(true);
  };

  // Preview handler for current Form (strictly gated behind verifiedRecord)
  const handleOpenFormPreview = () => {
    handleGenerateVerifiedPdf();
  };

  // Preview handler for selected record from Data Tab
  const handleOpenRecordPreview = async (record: ReportRecord) => {
    const payload = recordToPrintPayload(record);
    try {
      const attachment = await generateLandscapePdfBlob(record);
      setCachedPdfAttachment(attachment);
    } catch (err) {
      console.error('[PDF GENERATION ERROR]', err);
    }
    setActivePreviewData(payload);
    setPrintTargetData(payload);
    setIsPreviewModalOpen(true);
  };

  // Print execution handler
  const handleExecutePrint = () => {
    if (activePreviewData) {
      setPrintTargetData(activePreviewData);
    }
  };

  return (
    <>
      <div id="mwa-app-root" className="min-h-screen py-4 px-2 sm:py-6 sm:px-4 mwa-screen-ui">
        <div className="mwa-container">
        {/* Master Header */}
        <Header />

        {/* Tab Navigation */}
        <TabNavigation activeTab={activeTab} onTabChange={(tab) => { if (!isSubmitting) setActiveTab(tab); }} />

        {/* Tab 1 Content: แบบฟอร์มบันทึกข้อมูล */}
        {activeTab === 'form' && (
          <div className="p-4 sm:p-8">
            {/* Auto-save & Fail-Safe Protection Status Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3 px-1">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100/90 text-slate-700 border border-slate-200">
                {draftStatus === 'saving' ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse"></span>
                    <span className="text-[11px] font-medium text-sky-800">กำลังบันทึกแบบร่างอัตโนมัติ...</span>
                  </>
                ) : draftStatus === 'saved' && lastSavedTime ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span className="text-[11px] font-medium text-emerald-800">
                      บันทึกแบบร่างอัตโนมัติแล้ว ({lastSavedTime} น.)
                    </span>
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    <span className="text-[11px] font-medium text-amber-800">รอการบันทึกเข้าสู่ระบบ</span>
                  </>
                )}
              </div>
              <div className="text-[11px] text-slate-400 hidden sm:flex items-center gap-1">
                <span>ระบบสำรองข้อมูลอัตโนมัติ (Fail-safe Draft Protection)</span>
              </div>
            </div>

            {/* Step Navigation Progress */}
            <StepIndicator
              currentStep={currentStep}
              onStepClick={(step) => {
                if (isSubmitting) return;
                if (step > 3 && !validateTopics()) return;
                setCurrentStep(step);
                window.scrollTo({ top: 120, behavior: 'smooth' });
              }}
            />

            {/* Step 1: ข้อมูลผู้บันทึก */}
            {currentStep === 1 && (
              <FormStep1Recorder
                data={recorderData}
                onChange={handleRecorderChange}
                onProfileSelect={handleProfileSelect}
                onNext={() => {
                  setCurrentStep(2);
                  window.scrollTo({ top: 120, behavior: 'smooth' });
                }}
              />
            )}

            {/* Step 2: ข้อมูลผู้บริหาร */}
            {currentStep === 2 && (
              <FormStep2Executive
                data={executiveData}
                isDefaultFromRecorder={!isExecutiveAffiliationTouched}
                onChange={handleExecutiveChange}
                onPrev={() => {
                  setCurrentStep(1);
                  window.scrollTo({ top: 120, behavior: 'smooth' });
                }}
                onNext={() => {
                  setCurrentStep(3);
                  window.scrollTo({ top: 120, behavior: 'smooth' });
                }}
              />
            )}

            {/* Step 3: รายละเอียดการสื่อสาร */}
            {currentStep === 3 && (
              <FormStep3Topics
                topics={topics}
                onAddTopic={handleAddTopic}
                onRemoveTopic={handleRemoveTopic}
                onUpdateTopic={handleUpdateTopic}
                highlightedTopicIndex={highlightedTopicNumber}
                highlightedFieldId={highlightedFieldId}
                onPrev={() => {
                  setCurrentStep(2);
                  window.scrollTo({ top: 120, behavior: 'smooth' });
                }}
                onNext={() => {
                  if (!validateTopics()) return;
                  setCurrentStep(4);
                  window.scrollTo({ top: 120, behavior: 'smooth' });
                }}
              />
            )}

            {/* Step 4: ปัญหาและข้อเสนอแนะ */}
            {currentStep === 4 && (
              <FormStep4Feedback
                data={feedbackData}
                onChange={handleFeedbackChange}
                onPrev={() => {
                  setCurrentStep(3);
                  window.scrollTo({ top: 120, behavior: 'smooth' });
                }}
                onSubmit={() => handleFormSubmit()}
                isSubmitting={saveOperationState === 'SAVING' || saveOperationState === 'VERIFYING' || isSubmitting}
                submitButtonText={getSubmitButtonText()}
              />
            )}
          </div>
        )}

        {/* Tab 2 Content: ข้อมูลการสื่อสาร */}
        {activeTab === 'data' && (
          <div className="p-4 sm:p-8">
            <DataTabContent onPrintRecord={handleOpenRecordPreview} />
          </div>
        )}

        {/* Tab 3 Content: Dashboard */}
        {activeTab === 'dashboard' && (
          <div className="p-4 sm:p-8">
            <DashboardTabContent />
          </div>
        )}
      </div>

      {/* 1. Loading Modal (Modal Loading อยู่กึ่งกลางหน้าจอ, 4-Step Checklist: SAVE -> VERIFY -> PDF -> EMAIL) */}
      {(saveOperationState === 'SAVING' ||
        saveOperationState === 'VERIFYING' ||
        saveOperationState === 'GENERATING_PDF' ||
        saveOperationState === 'SENDING_EMAIL') && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 text-center space-y-4 animate-in zoom-in-95 duration-150">
            {/* Professional Government Loading Spinner */}
            <div className="w-16 h-16 rounded-full bg-sky-50 text-[#005691] flex items-center justify-center mx-auto">
              <div className="w-9 h-9 border-3 border-sky-200 border-t-[#005691] rounded-full animate-spin"></div>
            </div>
            <div className="space-y-1.5">
              <h3 className="text-xl font-bold text-slate-800">
                {saveOperationState === 'SAVING' && 'กำลังบันทึกข้อมูล...'}
                {saveOperationState === 'VERIFYING' && 'กำลังตรวจสอบข้อมูล...'}
                {saveOperationState === 'GENERATING_PDF' && 'กำลังสร้างเอกสาร PDF...'}
                {saveOperationState === 'SENDING_EMAIL' && 'กำลังส่ง Email ยืนยัน...'}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                กรุณารอสักครู่ ระบบกำลังประมวลผลตามขั้นตอนอย่างปลอดภัย...
              </p>
            </div>

            {/* 4-Step Progress Checklist */}
            <div className="space-y-2 text-left bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs">
              {/* Step 1: Save */}
              <div className="flex items-center gap-2">
                {saveOperationState === 'SAVING' ? (
                  <div className="w-3.5 h-3.5 border-2 border-[#005691] border-t-transparent rounded-full animate-spin shrink-0" />
                ) : (
                  <span className="text-emerald-600 font-bold text-sm">✓</span>
                )}
                <span className={saveOperationState === 'SAVING' ? 'font-semibold text-slate-800' : 'text-slate-600'}>
                  {saveOperationState === 'SAVING' ? 'กำลังบันทึกข้อมูล...' : 'บันทึกข้อมูลสำเร็จ'}
                </span>
              </div>

              {/* Step 2: Verify */}
              <div className="flex items-center gap-2">
                {saveOperationState === 'SAVING' ? (
                  <span className="text-slate-300 font-bold text-sm">○</span>
                ) : saveOperationState === 'VERIFYING' ? (
                  <div className="w-3.5 h-3.5 border-2 border-[#005691] border-t-transparent rounded-full animate-spin shrink-0" />
                ) : (
                  <span className="text-emerald-600 font-bold text-sm">✓</span>
                )}
                <span className={saveOperationState === 'VERIFYING' ? 'font-semibold text-slate-800' : 'text-slate-600'}>
                  {saveOperationState === 'VERIFYING' ? 'กำลังตรวจสอบข้อมูล...' : 'ตรวจสอบข้อมูลสำเร็จ'}
                </span>
              </div>

              {/* Step 3: PDF */}
              <div className="flex items-center gap-2">
                {['SAVING', 'VERIFYING'].includes(saveOperationState) ? (
                  <span className="text-slate-300 font-bold text-sm">○</span>
                ) : saveOperationState === 'GENERATING_PDF' ? (
                  <div className="w-3.5 h-3.5 border-2 border-[#005691] border-t-transparent rounded-full animate-spin shrink-0" />
                ) : (
                  <span className="text-emerald-600 font-bold text-sm">✓</span>
                )}
                <span className={saveOperationState === 'GENERATING_PDF' ? 'font-semibold text-slate-800' : 'text-slate-600'}>
                  {saveOperationState === 'GENERATING_PDF' ? 'กำลังสร้างเอกสาร PDF จาก Verified Record...' : 'สร้าง PDF สำเร็จ'}
                </span>
              </div>

              {/* Step 4: Email */}
              <div className="flex items-center gap-2">
                {['SAVING', 'VERIFYING', 'GENERATING_PDF'].includes(saveOperationState) ? (
                  <span className="text-slate-300 font-bold text-sm">○</span>
                ) : saveOperationState === 'SENDING_EMAIL' ? (
                  <div className="w-3.5 h-3.5 border-2 border-[#005691] border-t-transparent rounded-full animate-spin shrink-0" />
                ) : (
                  <span className="text-emerald-600 font-bold text-sm">✓</span>
                )}
                <span className={saveOperationState === 'SENDING_EMAIL' ? 'font-semibold text-slate-800' : 'text-slate-600'}>
                  {saveOperationState === 'SENDING_EMAIL' ? 'กำลังส่ง Email พร้อมแนบ PDF...' : 'ส่ง Email สำเร็จ'}
                </span>
              </div>
            </div>

            {/* Visual progress bar */}
            <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
              <div
                className={`bg-[#005691] h-full ${
                  saveOperationState === 'SAVING'
                    ? 'w-1/4'
                    : saveOperationState === 'VERIFYING'
                    ? 'w-2/4'
                    : saveOperationState === 'GENERATING_PDF'
                    ? 'w-3/4'
                    : 'w-11/12'
                } rounded-full transition-all duration-300 animate-pulse`}
              ></div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Success Modal Alert (แสดงเมื่อ EMAIL ส่งสำเร็จจริงจาก Provider เท่านั้น) */}
      {saveOperationState === 'SUCCESS' && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 text-center space-y-4 animate-in zoom-in-95 duration-150">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div className="space-y-1.5">
              <div className="inline-block px-2.5 py-0.5 bg-emerald-50 text-emerald-700 text-xs font-bold rounded border border-emerald-300 font-mono tracking-wide">
                EMAIL_SUCCESS
              </div>
              <h3 className="text-xl font-bold text-slate-800">
                ส่ง Email สำเร็จ
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                บันทึก ตรวจสอบ และจัดส่งรายงานทางอีเมลเรียบร้อยแล้ว
              </p>
            </div>

            {/* Display Record ID, Submission ID, Executive, Month, Recorder & Recipient Email */}
            {savedRecordInfo && (
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-left space-y-2">
                {savedRecordInfo.recordId && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-medium">Record ID:</span>
                    <span className="font-mono font-bold text-[#005691]">#{savedRecordInfo.recordId}</span>
                  </div>
                )}
                {savedRecordInfo.submissionId && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-medium">Submission ID:</span>
                    <span className="font-mono font-semibold text-slate-700 text-[11px] truncate max-w-[170px]" title={savedRecordInfo.submissionId}>
                      {savedRecordInfo.submissionId}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">ผู้บริหาร:</span>
                  <span className="font-semibold text-slate-800 text-[11px] truncate max-w-[170px]" title={sentEmailInfo?.executiveName || verifiedRecord?.speaker}>
                    {sentEmailInfo?.executiveName || verifiedRecord?.speaker || '-'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">เดือนที่สื่อสาร:</span>
                  <span className="font-semibold text-slate-800 text-[11px] truncate max-w-[170px]" title={sentEmailInfo?.communicationMonth || verifiedRecord?.month}>
                    {sentEmailInfo?.communicationMonth || verifiedRecord?.month || '-'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">ผู้บันทึก:</span>
                  <span className="font-semibold text-slate-800 text-[11px] truncate max-w-[170px]" title={sentEmailInfo?.recorderName || verifiedRecord?.recorder}>
                    {sentEmailInfo?.recorderName || verifiedRecord?.recorder || '-'}
                  </span>
                </div>
                {sentEmailInfo?.recipientEmail && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-medium">Email ผู้รับ:</span>
                    <span className="font-semibold text-slate-700 text-[11px] truncate max-w-[170px]" title={sentEmailInfo.recipientEmail}>
                      {sentEmailInfo.recipientEmail}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">ไฟล์แนบ PDF:</span>
                  <span className="font-mono text-slate-700 text-[11px] truncate max-w-[170px]" title={sentEmailInfo?.attachmentName || cachedPdfAttachment?.filename || (savedRecordInfo ? `MWA_Communication_Report_${savedRecordInfo.recordId}_${savedRecordInfo.submissionId}.pdf` : '')}>
                    📎 {sentEmailInfo?.attachmentName || cachedPdfAttachment?.filename || (savedRecordInfo ? `MWA_Communication_Report_${savedRecordInfo.recordId}_${savedRecordInfo.submissionId}.pdf` : '-')}
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-200">
                  <div className="text-[11px] font-semibold text-slate-700 mb-1.5">สถานะการประมวลผล:</div>
                  <div className="grid grid-cols-2 gap-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50/80 p-2 rounded border border-emerald-200">
                    <div className="flex items-center gap-1"><span>✓</span><span>บันทึกสำเร็จ</span></div>
                    <div className="flex items-center gap-1"><span>✓</span><span>ตรวจสอบข้อมูลสำเร็จ</span></div>
                    <div className="flex items-center gap-1"><span>✓</span><span>สร้าง PDF สำเร็จ</span></div>
                    <div className="flex items-center gap-1"><span>✓</span><span>ส่ง Email สำเร็จ</span></div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-2 pt-1">
              <button
                type="button"
                className="mwa-btn bg-[#005691] hover:bg-[#004070] text-white w-full justify-center py-2.5 font-medium cursor-pointer shadow-xs flex items-center gap-1.5"
                onClick={handleGenerateVerifiedPdf}
              >
                <FileText className="w-4 h-4" />
                <span>ดูเอกสาร PDF</span>
              </button>
              <button
                type="button"
                className="mwa-btn bg-slate-100 hover:bg-slate-200 text-slate-700 w-full justify-center py-2 text-xs font-medium cursor-pointer"
                onClick={handleSuccessDismiss}
              >
                เริ่มกรอกรายการใหม่
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2.5. Email Failed Modal Alert (แสดงเมื่อ SAVE + VERIFY ผ่านแล้ว แต่ส่ง EMAIL ไม่สำเร็จ) */}
      {saveOperationState === 'EMAIL_FAILED' && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 text-center space-y-4 animate-in zoom-in-95 duration-150">
            <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
              <Mail className="w-9 h-9" />
            </div>
            <div className="space-y-1.5">
              <div className="inline-block px-2.5 py-0.5 bg-rose-50 text-rose-700 text-xs font-bold rounded border border-rose-300 font-mono tracking-wide">
                EMAIL_FAILED
              </div>
              <h3 className="text-xl font-bold text-slate-800">
                {emailErrorMessage && (emailErrorMessage.includes('ยังไม่ได้เชื่อมต่อ') || emailErrorMessage.includes('GOOGLE_APPS_SCRIPT_URL'))
                  ? 'ยังไม่ได้เชื่อมต่อระบบส่ง Email'
                  : 'บันทึกและตรวจสอบข้อมูลสำเร็จ แต่ยังไม่สามารถส่งอีเมลได้'}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {emailErrorMessage && (emailErrorMessage.includes('ยังไม่ได้เชื่อมต่อ') || emailErrorMessage.includes('GOOGLE_APPS_SCRIPT_URL'))
                  ? 'Frontend พร้อมเชื่อม Google Apps Script แล้ว แต่ยังต้องนำ Web App URL มาใส่ใน GOOGLE_APPS_SCRIPT_URL'
                  : 'ระบบได้บันทึกข้อมูลและตรวจสอบความถูกต้องเรียบร้อยแล้ว แต่เกิดข้อผิดพลาดในการนำส่งอีเมลไปยังผู้รับ'}
              </p>
            </div>

            {/* Display Record ID, Submission ID, Executive, Month, Recorder & Recipient Email with FAILED status */}
            {savedRecordInfo && (
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-left space-y-1.5">
                {savedRecordInfo.recordId && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-medium">Record ID:</span>
                    <span className="font-mono font-bold text-[#005691]">#{savedRecordInfo.recordId}</span>
                  </div>
                )}
                {savedRecordInfo.submissionId && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-medium">Submission ID:</span>
                    <span className="font-mono font-semibold text-slate-700 text-[11px] truncate max-w-[210px]" title={savedRecordInfo.submissionId}>
                      {savedRecordInfo.submissionId}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">ผู้บริหาร:</span>
                  <span className="font-semibold text-slate-800 text-[11px] truncate max-w-[210px]" title={sentEmailInfo?.executiveName || verifiedRecord?.speaker}>
                    {sentEmailInfo?.executiveName || verifiedRecord?.speaker || '-'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">เดือนที่สื่อสาร:</span>
                  <span className="font-semibold text-slate-800 text-[11px] truncate max-w-[210px]" title={sentEmailInfo?.communicationMonth || verifiedRecord?.month}>
                    {sentEmailInfo?.communicationMonth || verifiedRecord?.month || '-'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">ผู้บันทึก:</span>
                  <span className="font-semibold text-slate-800 text-[11px] truncate max-w-[210px]" title={sentEmailInfo?.recorderName || verifiedRecord?.recorder}>
                    {sentEmailInfo?.recorderName || verifiedRecord?.recorder || '-'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Email ผู้รับ:</span>
                  <span className="font-semibold text-slate-700 text-[11px] truncate max-w-[210px]" title={sentEmailInfo?.recipientEmail || verifiedRecord?.email || recorderData.email}>
                    {sentEmailInfo?.recipientEmail || verifiedRecord?.email || recorderData.email}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">ไฟล์แนบ PDF:</span>
                  <span className="font-mono text-slate-700 text-[11px] truncate max-w-[210px]" title={sentEmailInfo?.attachmentName || cachedPdfAttachment?.filename || (savedRecordInfo ? `MWA_Communication_Report_${savedRecordInfo.recordId}_${savedRecordInfo.submissionId}.pdf` : '')}>
                    📎 {sentEmailInfo?.attachmentName || cachedPdfAttachment?.filename || (savedRecordInfo ? `MWA_Communication_Report_${savedRecordInfo.recordId}_${savedRecordInfo.submissionId}.pdf` : '-')}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-slate-200">
                  <span className="text-slate-500 font-medium">สถานะ Email:</span>
                  <span className="font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">FAILED</span>
                </div>
                {emailErrorMessage && (
                  <div className="mt-2 p-2 bg-rose-50/80 border border-rose-200 rounded text-[11px] text-rose-700 leading-snug break-words">
                    <span className="font-semibold">ข้อผิดพลาด:</span> {emailErrorMessage}
                  </div>
                )}
              </div>
            )}

            <div className="p-2.5 bg-emerald-50 text-emerald-800 rounded-lg text-xs font-medium border border-emerald-200 flex items-center justify-center gap-1.5">
              <span>🔒 ข้อมูลถูกบันทึกแล้ว ไม่ต้องบันทึกซ้ำ กดลองส่งอีเมลอีกครั้งได้ทันที</span>
            </div>

            <div className="flex flex-col gap-2 pt-1">
              <button
                type="button"
                className="mwa-btn bg-[#005691] hover:bg-[#004070] text-white w-full justify-center py-2.5 font-medium cursor-pointer shadow-xs flex items-center gap-1.5"
                onClick={handleRetryEmail}
                disabled={isSubmitting}
              >
                <RotateCcw className="w-4 h-4" />
                <span>ลองส่ง Email อีกครั้ง</span>
              </button>
              <button
                type="button"
                className="mwa-btn bg-slate-100 hover:bg-slate-200 text-slate-700 w-full justify-center py-2 text-xs font-medium cursor-pointer flex items-center gap-1.5"
                onClick={handleGenerateVerifiedPdf}
              >
                <FileText className="w-4 h-4" />
                <span>ดูเอกสาร PDF</span>
              </button>
              <button
                type="button"
                className="mwa-btn text-slate-500 hover:text-slate-700 text-xs py-1.5 cursor-pointer"
                onClick={() => setSaveOperationState('IDLE')}
              >
                ปิดหน้าต่างนี้
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Error Modal Alert (แสดงเมื่อ READ-BACK ล้มเหลว หรือ VERIFY ไม่ผ่าน) */}
      {saveOperationState === 'ERROR' && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 text-center space-y-4 animate-in zoom-in-95 duration-150">
            <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
              <AlertCircle className="w-10 h-10" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-xl font-bold text-slate-800">
                ระบบยังไม่สามารถยืนยันการบันทึกข้อมูลได้
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {errorMessage || 'ระบบยังไม่สามารถยืนยันการบันทึกข้อมูลได้ กรุณาลองใหม่อีกครั้ง'}
              </p>
            </div>
            <div className="p-2.5 bg-emerald-50 text-emerald-800 rounded-lg text-xs font-medium border border-emerald-200 flex items-center justify-center gap-1.5">
              <span>🔒 ข้อมูลที่กรอกไว้จะไม่หาย (คงรหัสเดิม ป้องกันการบันทึกซ้ำ)</span>
            </div>
            <div className="flex flex-col gap-2 pt-1">
              <button
                type="button"
                className="mwa-btn bg-[#005691] hover:bg-[#004070] text-white w-full justify-center py-2.5 font-medium cursor-pointer shadow-xs"
                onClick={() => {
                  setSaveOperationState('IDLE');
                  handleFormSubmit();
                }}
              >
                ลองบันทึกอีกครั้ง
              </button>
              <button
                type="button"
                className="mwa-btn bg-slate-100 hover:bg-slate-200 text-slate-700 w-full justify-center py-2 text-xs font-medium cursor-pointer"
                onClick={() => setSaveOperationState('IDLE')}
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Draft Recovery Modal (กู้คืน Draft เมื่อเปิดหน้าใหม่) */}
      {showRecoveryModal && pendingDraft && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="w-14 h-14 rounded-full bg-sky-100 text-[#005691] flex items-center justify-center mx-auto">
              <History className="w-8 h-8" />
            </div>
            <div className="text-center space-y-1.5">
              <h3 className="text-lg font-bold text-slate-800">พบข้อมูลที่บันทึกไว้ชั่วคราว</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                ระบบพบข้อมูลที่คุณกรอกไว้ก่อนหน้านี้ แต่ยังไม่ได้บันทึกเข้าสู่ฐานข้อมูล
              </p>
              <p className="text-xs font-semibold text-[#005691]">
                ต้องการเรียกคืนข้อมูลนี้หรือไม่?
              </p>
            </div>

            {/* Draft Summary Snippet */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1 text-slate-700">
              <div className="flex justify-between">
                <span className="text-slate-500">ขั้นตอนค้างไว้:</span>
                <span className="font-semibold text-slate-800">ขั้นตอนที่ {pendingDraft.currentStep || 1}</span>
              </div>
              {pendingDraft.executive?.month && (
                <div className="flex justify-between">
                  <span className="text-slate-500">ประจำเดือน:</span>
                  <span className="font-semibold text-slate-800">{pendingDraft.executive.month}</span>
                </div>
              )}
              {pendingDraft.lastSavedAt && (
                <div className="flex justify-between">
                  <span className="text-slate-500">บันทึกล่าสุดเมื่อ:</span>
                  <span className="font-semibold text-emerald-700">{pendingDraft.lastSavedAt} น.</span>
                </div>
              )}
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                className="mwa-btn bg-[#005691] hover:bg-[#004070] text-white flex-1 justify-center py-2.5 font-medium cursor-pointer"
                onClick={handleRestoreDraft}
              >
                เรียกคืนข้อมูล
              </button>
              <button
                type="button"
                className="mwa-btn bg-slate-100 hover:bg-slate-200 text-slate-700 flex-1 justify-center py-2.5 font-medium cursor-pointer"
                onClick={() => setShowResetConfirmModal(true)}
              >
                เริ่มกรอกใหม่
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Confirm Start New Modal */}
      {showResetConfirmModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 text-center space-y-4 animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-800">ยืนยันการเริ่มกรอกใหม่</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                คุณแน่ใจหรือไม่ว่าต้องการเริ่มกรอกใหม่? ข้อมูลแบบร่างเดิมที่บันทึกไว้ชั่วคราวจะถูกล้างและไม่สามารถกู้คืนได้
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                className="mwa-btn bg-rose-600 hover:bg-rose-700 text-white flex-1 justify-center py-2 text-xs font-medium cursor-pointer"
                onClick={handleConfirmStartNew}
              >
                ยืนยันล้างแบบร่าง
              </button>
              <button
                type="button"
                className="mwa-btn bg-slate-100 hover:bg-slate-200 text-slate-700 flex-1 justify-center py-2 text-xs font-medium cursor-pointer"
                onClick={() => setShowResetConfirmModal(false)}
              >
                ยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PDF Preview Modal (A4 Landscape White Paper Sheet Preview) */}
      {activePreviewData && (
        <PdfPreviewModal
          isOpen={isPreviewModalOpen}
          onClose={() => setIsPreviewModalOpen(false)}
          recorder={activePreviewData.recorder}
          executive={activePreviewData.executive}
          topics={activePreviewData.topics}
          feedback={activePreviewData.feedback}
          onPrint={handleExecutePrint}
          recordId={activePreviewData.recordId}
          submissionId={activePreviewData.submissionId}
          pdfBlob={cachedPdfAttachment?.blob}
          pdfFilename={cachedPdfAttachment?.filename}
        />
      )}

      {/* 6. Validation Warning Modal (แจ้งเตือนเมื่อยังไม่ได้เลือกประเด็นการสื่อสาร) */}
      {validationModalData?.isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 text-center space-y-4 animate-in zoom-in-95 duration-150 border border-slate-100">
            {/* Warning icon */}
            <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-9 h-9 text-amber-600" />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-bold text-slate-800">
                กรุณากรอกข้อมูลให้ครบถ้วน
              </h3>
            </div>

            {/* Error Message Box */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3.5 text-center">
              <p className="text-sm font-bold text-slate-900 mb-1">
                ประเด็นที่ {validationModalData.topicNumber}
              </p>
              <p className="text-xs text-slate-700 leading-relaxed">
                {validationModalData.message}
              </p>
            </div>

            {/* Confirm button */}
            <button
              type="button"
              className="mwa-btn bg-[#005691] hover:bg-[#004070] text-white w-full justify-center py-2.5 font-medium cursor-pointer shadow-xs transition-all"
              onClick={handleDismissValidationModal}
            >
              ตกลง
            </button>
          </div>
        </div>
      )}
    </div>

    {/* Dedicated Native Browser Print Document (Rendered for Chrome Native Print Preview) */}
    <PrintDocument
      recorder={printTargetData?.recorder || recorderData}
      executive={printTargetData?.executive || executiveData}
      topics={printTargetData?.topics || topics}
      feedback={printTargetData?.feedback || feedbackData}
      isInteractivePreview={false}
      recordId={printTargetData?.recordId}
      submissionId={printTargetData?.submissionId}
    />
  </>
  );
};
