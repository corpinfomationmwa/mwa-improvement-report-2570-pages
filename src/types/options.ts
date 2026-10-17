// Type definitions for Centralized MWA Form Options

export interface AffiliationOption {
  id: string;
  name: string;
}

export interface DepartmentOption {
  id: string;
  name: string;
  affiliationName: string;
}

export interface PositionOption {
  id: string;
  name: string;
  category: 'recorder' | 'executive' | 'all';
}

export interface TopicOption {
  id: string;
  code?: number;
  name: string;
  category?: string;
  keywords?: string[];
}

export interface CommunicationTypeOption {
  id: 'internal' | 'external';
  label: string;
  description?: string;
}

export interface ChannelOption {
  id: string;
  name: string;
  type: 'internal' | 'external';
  hasCustomInput?: boolean;
}

export interface AudienceOption {
  id: string;
  label: string;
  type: 'internal' | 'external';
  placeholder?: string;
}

export interface ProblemTypeOption {
  id: string;
  label: string;
}

export interface SuggestionTypeOption {
  id: string;
  label: string;
}

export interface ReportStatusOption {
  id: string;
  label: string;
  badgeColor?: string;
}

export interface AppOptionsConfig {
  affiliations: string[];
  departmentMapping: Record<string, string[]>;
  recorderPositions: string[];
  executivePositions: string[];
  executiveTitles: string[];
  months: string[];
  topics: string[];
  communicationTypes: { id: 'internal' | 'external'; label: string }[];
  internalChannels: string[];
  externalChannels: string[];
  internalAudiences: { id: string; label: string; placeholder: string }[];
  externalAudiences: { id: string; label: string; placeholder: string }[];
  problemTypes: string[];
  suggestionTypes: string[];
  reportStatuses: string[];
}
