import {
  RecorderInfo,
  ExecutiveInfo,
  CommunicationTopicItem,
  FeedbackInfo
} from '../types/mwa';

export interface FormDraftData {
  submissionId: string;
  recorder: RecorderInfo;
  executive: ExecutiveInfo;
  topics: CommunicationTopicItem[];
  feedback: FeedbackInfo;
  currentStep: number;
  lastSavedAt: string;
}

const DRAFT_STORAGE_KEY = 'mwa_improvement_report_draft_v1';

/**
 * Generate a unique client submissionId for idempotency / duplicate protection
 */
export function generateSubmissionId(): string {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 10);
  return `sub_${timestamp}_${randomStr}`;
}

/**
 * Check if the draft contains actual user-filled data
 */
export function isDraftNonEmpty(draft?: FormDraftData | null): boolean {
  if (!draft) return false;

  // Check recorder info
  if (
    draft.recorder?.name?.trim() ||
    draft.recorder?.surname?.trim() ||
    draft.recorder?.phone?.trim()
  ) {
    return true;
  }

  // Check executive info
  if (
    draft.executive?.name?.trim() ||
    draft.executive?.surname?.trim() ||
    Boolean(draft.executive?.month && draft.executive?.month.trim())
  ) {
    return true;
  }

  // Check topics
  if (draft.topics && draft.topics.length > 0) {
    const hasTopicData = draft.topics.some(
      (t) =>
        (t.selectedTopics && t.selectedTopics.length > 0) ||
        (t.details && t.details.trim().length > 0) ||
        (t.evidenceFiles && t.evidenceFiles.length > 0) ||
        (t.internalChannels && t.internalChannels.length > 0) ||
        (t.externalChannels && t.externalChannels.length > 0)
    );
    if (hasTopicData) return true;
  }

  // Check feedback
  if (
    draft.feedback?.problemsObstacles?.trim() ||
    draft.feedback?.executiveSuggestions?.trim()
  ) {
    return true;
  }

  return false;
}

/**
 * Safely save form draft to localStorage
 */
export function saveFormDraft(draft: FormDraftData): boolean {
  try {
    const serialized = JSON.stringify(draft);
    localStorage.setItem(DRAFT_STORAGE_KEY, serialized);
    return true;
  } catch (error) {
    console.warn('[MWA DRAFT WARNING] Failed to save draft to localStorage (quota or disabled):', error);
    // If quota exceeded due to large base64 images, try saving without large base64 strings
    try {
      const lightweightDraft: FormDraftData = {
        ...draft,
        topics: draft.topics.map((t) => ({
          ...t,
          evidenceFiles: (t.evidenceFiles || []).map((f) => ({
            name: f.name,
            size: f.size,
            mimeType: f.mimeType,
            previewUrl: undefined,
            dataUrl: undefined, // Never persist original file Base64 in the fallback draft
            url: (f.url && f.url.startsWith('data:') && f.url.length > 50000)
              ? undefined // strip huge Base64 in fallback
              : f.url
          }))
        }))
      };
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(lightweightDraft));
      return true;
    } catch (innerError) {
      console.error('[MWA DRAFT ERROR] Completely unable to save draft:', innerError);
      return false;
    }
  }
}

/**
 * Retrieve saved draft from localStorage
 */
export function getFormDraft(): FormDraftData | null {
  try {
    const item = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!item) return null;
    const parsed = JSON.parse(item) as FormDraftData;
    if (parsed && typeof parsed === 'object') {
      return parsed;
    }
    return null;
  } catch (error) {
    console.error('[MWA DRAFT ERROR] Failed to parse draft from localStorage:', error);
    return null;
  }
}

/**
 * Clear draft from localStorage after verified successful database save
 */
export function clearFormDraft(): void {
  try {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
  } catch (error) {
    console.error('[MWA DRAFT ERROR] Failed to clear draft from localStorage:', error);
  }
}

/**
 * Check if a draft exists
 */
export function hasFormDraft(): boolean {
  try {
    return Boolean(localStorage.getItem(DRAFT_STORAGE_KEY));
  } catch {
    return false;
  }
}
