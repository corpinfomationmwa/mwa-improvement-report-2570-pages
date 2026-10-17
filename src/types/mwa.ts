export interface DepartmentMapping {
  [affiliation: string]: string[];
}

export interface RecorderProfile {
  id: string;
  title?: string; // คำนำหน้า เช่น นาย, นาง, นางสาว
  name: string;
  surname: string;
  position: string;
  affiliation: string;
  department: string;
  phone: string;
  email?: string;
}

export interface RecorderInfo {
  title?: string; // คำนำหน้า เช่น นาย, นาง, นางสาว
  name: string;
  surname: string;
  position: string;
  affiliation: string;
  department: string;
  phone: string;
  email: string;
}

export interface ExecutiveInfo {
  month: string;
  title?: string; // คำนำหน้า เช่น นาย, นาง, นางสาว
  name: string;
  surname: string;
  position: string;
  affiliation: string;
  department: string;
}

export interface CommunicationTopicItem {
  id: number;
  selectedTopics: string[];
  details: string;
  communicationTypes: {
    internal: boolean;
    external: boolean;
  };
  internalChannels: string[];
  otherInternalChannel?: string;
  externalChannels: string[];
  otherExternalChannel?: string;
  internalAudiences: string[];
  internalAudienceDetails: Record<string, string>;
  externalAudiences: string[];
  externalAudienceDetails: Record<string, string>;
  audiences?: string[];
  otherAudience?: string;
  additionalDetails?: string;
  evidenceFiles: {
    name: string;
    size: string;
    url?: string;
    dataUrl?: string; // Temporary original file bytes for upload to Google Drive
    driveFileId?: string;
    driveUrl?: string;
    previewUrl?: string;
    mimeType?: string;
  }[];
}

export interface FeedbackInfo {
  problemsObstacles: string;
  executiveSuggestions: string;
}

export interface ReportRecord {
  id: number;
  month: string;
  speaker: string; // ผู้ถ่ายทอดสาร
  speakerPosition?: string;
  speakerAffiliation?: string;
  speakerDepartment?: string;
  topics: string; // ประเด็นการสื่อสาร
  channel: string; // ช่องทาง
  audience: string; // ผู้รับสาร
  evidence: string; // หลักฐาน
  recorder: string; // ผู้บันทึก
  recordDate: string; // วันที่บันทึก
  details?: string;
  problems?: string;
  suggestions?: string;
  phone?: string;
  email?: string;
  evidenceFiles?: {
    name: string;
    size?: string;
    url?: string;
    fileUrl?: string;
    dataUrl?: string;
    previewUrl?: string;
    base64?: string;
    mimeType?: string;
    fileType?: string;
  }[];
  evidenceUrls?: string[];
  submissionId?: string;
  rawTopics?: CommunicationTopicItem[];
  recorderTitle?: string;
  recorderName?: string;
  recorderSurname?: string;
  recorderPosition?: string;
  recorderAffiliation?: string;
  recorderDepartment?: string;
  executiveTitle?: string;
  executiveName?: string;
  executiveSurname?: string;
  executiveMonth?: string;
  rawRecorder?: RecorderInfo;
  rawExecutive?: ExecutiveInfo;
  rawFeedback?: FeedbackInfo;
}

export interface DashboardStats {
  totalReports: number;
  completedDepartments: number;
  pendingDepartments: number;
  completionRate: string;
  affiliationStats: {
    name: string;
    submitted: number;
    total: number;
  }[];
  topicStats: {
    topic: string;
    count: number;
  }[];
  channelStats: {
    channel: string;
    count: number;
  }[];
  audienceStats: {
    audience: string;
    count: number;
  }[];
}
