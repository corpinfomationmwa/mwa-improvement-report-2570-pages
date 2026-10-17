import { AppOptionsConfig } from '../types/options';
import {
  defaultAppOptionsConfig,
  affiliationsConfig,
  departmentMappingConfig,
  recorderPositionsConfig,
  executivePositionsConfig,
  executiveTitlesConfig,
  monthsConfig,
  communicationTopicsConfig,
  communicationTypesConfig,
  internalChannelsConfig,
  externalChannelsConfig,
  internalAudiencesConfig,
  externalAudiencesConfig,
  problemTypesConfig,
  suggestionTypesConfig,
  reportStatusesConfig
} from '../config/optionsData';

/**
 * Centralized Data Access Layer for MWA Form Options
 * 
 * In this Phase:
 * - Supplies configuration and mock options cleanly separated from UI.
 * 
 * In Future Phase (Google Sheets / REST API):
 * - Swap or augment with live Google Sheets / API fetch inside fetchOptions() without changing UI components.
 */
class OptionsService {
  private config: AppOptionsConfig = defaultAppOptionsConfig;

  // 1. สายงาน (Affiliations)
  public getAffiliations(): string[] {
    return this.config.affiliations;
  }

  // 2. หน่วยงาน (Departments by Affiliation)
  public getDepartments(affiliation?: string): string[] {
    if (!affiliation) return [];
    return this.config.departmentMapping[affiliation] || [];
  }

  public getAllDepartmentMapping(): Record<string, string[]> {
    return this.config.departmentMapping;
  }

  // 3. ตำแหน่ง (Positions)
  public getPositions(category?: 'recorder' | 'executive'): string[] {
    if (category === 'recorder') return this.config.recorderPositions;
    if (category === 'executive') return this.config.executivePositions;
    return Array.from(new Set([...this.config.recorderPositions, ...this.config.executivePositions]));
  }

  // 4. คำนำหน้า (Executive Titles)
  public getExecutiveTitles(): string[] {
    return this.config.executiveTitles;
  }

  // 5. เดือนที่ทำการสื่อสาร (Months)
  public getMonths(): string[] {
    return this.config.months;
  }

  // 6. ประเด็นการสื่อสาร (Communication Topics)
  public getTopics(): string[] {
    return this.config.topics;
  }

  // 7. ประเภทการสื่อสาร (Communication Types)
  public getCommunicationTypes() {
    return this.config.communicationTypes;
  }

  // 8. ช่องทางการสื่อสาร (Channels)
  public getInternalChannels(): string[] {
    return this.config.internalChannels;
  }

  public getExternalChannels(): string[] {
    return this.config.externalChannels;
  }

  // 9. กลุ่มผู้รับสาร (Audiences)
  public getInternalAudiences() {
    return this.config.internalAudiences;
  }

  public getExternalAudiences() {
    return this.config.externalAudiences;
  }

  // 10. ประเภทปัญหาและข้อเสนอแนะ (Problem & Suggestion Types)
  public getProblemTypes(): string[] {
    return this.config.problemTypes;
  }

  public getSuggestionTypes(): string[] {
    return this.config.suggestionTypes;
  }

  // 11. สถานะรายงาน (Report Statuses)
  public getReportStatuses(): string[] {
    return this.config.reportStatuses;
  }

  // Full Configuration
  public getOptionsConfig(): AppOptionsConfig {
    return this.config;
  }

  /**
   * Future Async integration hook for Google Sheets / REST API.
   * Can be invoked by App or Context to preload options from Google Sheets.
   */
  public async fetchOptionsFromBackend(): Promise<AppOptionsConfig> {
    // Ready for Google Sheets / Apps Script fetch in next phase
    return Promise.resolve(this.config);
  }
}

export const optionsService = new OptionsService();
