/**
 * MWA Improvement Report Service Interface
 * 
 * Phase 1: Local mock implementation.
 * Prepared for future integration with backend API, Google Sheets & Google Drive.
 */
import { ReportItem, DashboardSummary, UserProfile } from '../types/report';
import { mockDashboardSummary, mockReports, mockCurrentUser } from '../mock/reports';

export interface IReportService {
  getDashboardSummary(): Promise<DashboardSummary>;
  getRecentReports(): Promise<ReportItem[]>;
  getAllReports(): Promise<ReportItem[]>;
  getMyReports(reporterName?: string): Promise<ReportItem[]>;
  getReportById(id: string): Promise<ReportItem | undefined>;
  getCurrentUser(): UserProfile;
}

class MockReportService implements IReportService {
  async getDashboardSummary(): Promise<DashboardSummary> {
    return { ...mockDashboardSummary };
  }

  async getRecentReports(): Promise<ReportItem[]> {
    return [...mockReports];
  }

  async getAllReports(): Promise<ReportItem[]> {
    return [...mockReports];
  }

  async getMyReports(reporterName = mockCurrentUser.name): Promise<ReportItem[]> {
    return mockReports.filter(r => r.reporter === reporterName);
  }

  async getReportById(id: string): Promise<ReportItem | undefined> {
    return mockReports.find(r => r.id === id);
  }

  getCurrentUser(): UserProfile {
    return { ...mockCurrentUser };
  }
}

export const reportService = new MockReportService();
