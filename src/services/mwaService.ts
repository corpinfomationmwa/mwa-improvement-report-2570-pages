import { ReportRecord, DashboardStats } from '../types/mwa';
import { departmentData, mwaMonths } from '../mock/departmentData';
import { affiliationsConfig } from '../config/optionsData';

// Cloudflare Pages frontend calls the existing backend through this configurable base URL.
// Set VITE_API_BASE_URL in Cloudflare Pages to the existing backend origin (no trailing slash).
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
function apiUrl(path: string): string {
  return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}


export interface IMWAService {
  getMonths(): Promise<string[]>;
  getAffiliations(): Promise<string[]>;
  getDepartmentsByAffiliation(affiliation: string): Promise<string[]>;
  getCommunicationData(filters?: {
    month?: string;
    affiliation?: string;
    department?: string;
    searchText?: string;
  }): Promise<ReportRecord[]>;
  getDashboardStatusRecords(): Promise<ReportRecord[]>;
  getDashboardStats(months?: string[] | string, affiliation?: string): Promise<DashboardStats>;
  getRecordById(recordId: number): Promise<ReportRecord | null>;
  getRecordBySubmissionId(submissionId: string): Promise<ReportRecord | null>;
  submitReport(formData: any): Promise<{ success: boolean; message: string; recordId?: number; submissionId?: string }>;
}

class MWAServiceImpl implements IMWAService {
  /**
   * Fetch report records from the live Supabase-backed API.
   *
   * IMPORTANT:
   * - Communication Data page uses this method.
   * - Dashboard uses this method.
   * - There is intentionally NO fallback to mockReportRecords.
   *   Supabase is the source of truth for report data.
   */
  private async fetchLiveReports(filters?: {
    month?: string;
    affiliation?: string;
    department?: string;
    searchText?: string;
  }): Promise<ReportRecord[]> {
    try {
      const params = new URLSearchParams();

      if (filters?.month && filters.month.trim() !== '') {
        params.set('month', filters.month.trim());
      }

      if (filters?.affiliation && filters.affiliation.trim() !== '') {
        params.set('affiliation', filters.affiliation.trim());
      }

      if (filters?.department && filters.department.trim() !== '') {
        params.set('department', filters.department.trim());
      }

      if (filters?.searchText && filters.searchText.trim() !== '') {
        params.set('searchText', filters.searchText.trim());
      }

      const queryString = params.toString();
      const url = queryString
        ? apiUrl(`/api/reports?${queryString}`)
        : apiUrl('/api/reports');

      const res = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json'
        },
        cache: 'no-store'
      });

      if (!res.ok) {
        console.error(
          `[fetchLiveReports] API request failed: HTTP ${res.status} ${res.statusText}`
        );
        return [];
      }

      const json = await res.json().catch(() => null);

      if (
        !json ||
        json.success !== true ||
        !Array.isArray(json.data)
      ) {
        console.error(
          '[fetchLiveReports] Invalid API response:',
          json
        );
        return [];
      }

      return json.data as ReportRecord[];
    } catch (err) {
      console.error('[fetchLiveReports] Fetch error:', err);
      return [];
    }
  }

  async getRecordById(recordId: number): Promise<ReportRecord | null> {
    if (typeof recordId !== 'number' || isNaN(recordId)) return null;

    try {
      const res = await fetch(apiUrl(`/api/reports/${encodeURIComponent(recordId)}`), {
        method: 'GET',
        headers: {
          Accept: 'application/json'
        },
        cache: 'no-store'
      });

      if (res.status === 404) {
        return null;
      }

      if (!res.ok) {
        console.warn(
          `[getRecordById] Non-OK status ${res.status} for recordId: ${recordId}`
        );
        return null;
      }

      const json = await res.json().catch(() => null);

      if (json && json.success && json.data) {
        return json.data as ReportRecord;
      }

      return null;
    } catch (err) {
      console.error('[getRecordById] Fetch error:', err);
      return null;
    }
  }

  async getRecordBySubmissionId(submissionId: string): Promise<ReportRecord | null> {
    if (!submissionId) return null;

    try {
      const res = await fetch(
        apiUrl(`/api/reports/by-submission/${encodeURIComponent(submissionId)}`),
        {
          method: 'GET',
          headers: {
            Accept: 'application/json'
          },
          cache: 'no-store'
        }
      );

      if (res.status === 404) {
        return null;
      }

      if (!res.ok) {
        console.warn(
          `[getRecordBySubmissionId] Non-OK status ${res.status} for submissionId: ${submissionId}`
        );
        return null;
      }

      const json = await res.json().catch(() => null);

      if (json && json.success && json.data) {
        return json.data as ReportRecord;
      }

      return null;
    } catch (err) {
      console.error('[getRecordBySubmissionId] Fetch error:', err);
      return null;
    }
  }

  async getMonths(): Promise<string[]> {
    return [...mwaMonths];
  }

  async getAffiliations(): Promise<string[]> {
    return [...affiliationsConfig];
  }

  async getDepartmentsByAffiliation(affiliation: string): Promise<string[]> {
    return departmentData[affiliation] || [];
  }

  async getDashboardStatusRecords(): Promise<ReportRecord[]> {
    // Strict fetch for status indicators: never convert an API failure into an
    // empty list, because that would incorrectly mark every department pending.
    const res = await fetch(apiUrl('/api/reports'), {
      method: 'GET',
      headers: { Accept: 'application/json' },
      cache: 'no-store'
    });
    if (!res.ok) {
      throw new Error(`Dashboard status request failed: HTTP ${res.status}`);
    }
    const json = await res.json().catch(() => null);
    if (!json || json.success !== true || !Array.isArray(json.data)) {
      throw new Error('Dashboard status API returned an invalid response');
    }
    return json.data as ReportRecord[];
  }

  async getCommunicationData(filters?: {
    month?: string;
    affiliation?: string;
    department?: string;
    searchText?: string;
  }): Promise<ReportRecord[]> {
    /**
     * LIVE DATA:
     * All report rows now come from Supabase through GET /api/reports.
     * Server-side filtering is already handled by server.ts.
     */
    return this.fetchLiveReports(filters);
  }

  async getDashboardStats(
    months?: string[] | string,
    affiliation?: string
  ): Promise<DashboardStats> {
    const allAffiliations = [...affiliationsConfig];
    let selectedMonthsList: string[] = [];

    if (Array.isArray(months)) {
      // Preserve the year in fiscal-year labels, e.g. 'ตุลาคม 2569'.
      selectedMonthsList = months
        .map(m => m.trim().replace(/\s+/g, ' '))
        .filter(Boolean);
    } else if (
      months &&
      typeof months === 'string' &&
      months.trim() !== ''
    ) {
      selectedMonthsList = [months.trim().replace(/\s+/g, ' ')];
    }

    /**
     * Fetch LIVE records from Supabase.
     *
     * We only send affiliation to the API here because the Dashboard
     * supports selecting multiple months. Month filtering is therefore
     * kept client-side after receiving the live records.
     */
    const liveRecords = await this.getCommunicationData({
      affiliation: affiliation?.trim() || ''
    });

    // 1. Filter live records based on selected months and affiliation
    const filteredRecords = liveRecords.filter((rec) => {
      const recordMonth = (rec.month || '').trim().replace(/\s+/g, ' ').toLocaleLowerCase();

      const matchesMonth =
        selectedMonthsList.length === 0 ||
        selectedMonthsList.some((selectedMonth) => {
          const normalizedSelectedMonth = selectedMonth.trim().replace(/\s+/g, ' ').toLocaleLowerCase();
          const hasYear = /(?:^|\s)\d{4}(?:$|\s)/.test(normalizedSelectedMonth);

          // Full fiscal-year labels must match exactly, so October 2569
          // cannot accidentally include October 2570. Keep month-only
          // matching for any older caller that still passes just a month name.
          if (hasYear) return recordMonth === normalizedSelectedMonth;
          return recordMonth.split(' ')[0] === normalizedSelectedMonth;
        });

      const matchesAffiliation =
        !affiliation ||
        affiliation.trim() === '' ||
        affiliation === 'ทุกสายงาน' ||
        rec.speakerAffiliation === affiliation;

      return matchesMonth && matchesAffiliation;
    });

    const targetAffiliations =
      affiliation &&
      affiliation.trim() !== '' &&
      affiliation !== 'ทุกสายงาน'
        ? allAffiliations.filter(
            a => a === affiliation.trim()
          )
        : allAffiliations;

    // 2. Compute affiliation breakdown
    const affiliationStats = targetAffiliations.map((affName) => {
      const count = filteredRecords.filter(
        r => r.speakerAffiliation === affName
      ).length;

      const depts = departmentData[affName] || [];

      const totalExpected = Math.max(
        count,
        Math.min(depts.length, 3)
      );

      return {
        name: affName,
        submitted: count,
        total: totalExpected
      };
    });

    // 3. Compute summary card counts
    const totalReports = filteredRecords.length;

    const completedDepartments =
      affiliationStats.filter(
        a => a.submitted > 0
      ).length;

    const pendingDepartments =
      targetAffiliations.length -
      completedDepartments;

    const totalPossibleSlots =
      affiliationStats.reduce(
        (acc, curr) => acc + curr.total,
        0
      );

    const completionRatePct =
      totalPossibleSlots > 0
        ? (
            (totalReports / totalPossibleSlots) *
            100
          ).toFixed(1)
        : totalReports > 0
          ? '100.0'
          : '0.0';

    // 4. Topic frequency stats
    const topicMap: Record<string, number> = {};

    filteredRecords.forEach((rec) => {
      if (rec.topics) {
        rec.topics.split(/,\s*/).forEach((t) => {
          const cleanTopic = t.trim();

          if (cleanTopic) {
            topicMap[cleanTopic] =
              (topicMap[cleanTopic] || 0) + 1;
          }
        });
      }
    });

    const topicStats = Object.entries(topicMap)
      .map(([topic, count]) => ({
        topic,
        count
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    if (
      topicStats.length === 0 &&
      totalReports === 0
    ) {
      topicStats.push({
        topic: '- ไม่มีข้อมูลประเด็นในช่วงเวลานี้ -',
        count: 0
      });
    }

    // 5. Channel frequency stats
    const channelMap: Record<string, number> = {};

    filteredRecords.forEach((rec) => {
      if (rec.channel) {
        rec.channel.split(/,\s*/).forEach((c) => {
          const clean = c.trim();

          if (clean) {
            channelMap[clean] =
              (channelMap[clean] || 0) + 1;
          }
        });
      }
    });

    const channelStats = Object.entries(channelMap)
      .map(([channel, count]) => ({
        channel,
        count
      }))
      .sort((a, b) => b.count - a.count);

    // 6. Audience frequency stats
    const audienceMap: Record<string, number> = {};

    filteredRecords.forEach((rec) => {
      if (rec.audience) {
        rec.audience.split(/,\s*/).forEach((a) => {
          const clean = a.trim();

          if (clean) {
            audienceMap[clean] =
              (audienceMap[clean] || 0) + 1;
          }
        });
      }
    });

    const audienceStats = Object.entries(audienceMap)
      .map(([audience, count]) => ({
        audience,
        count
      }))
      .sort((a, b) => b.count - a.count);

    return {
      totalReports,
      completedDepartments,
      pendingDepartments,
      completionRate: `${completionRatePct}%`,
      affiliationStats,
      topicStats,
      channelStats,
      audienceStats
    };
  }

  async submitReport(
    formData: any
  ): Promise<{
    success: boolean;
    message: string;
    recordId?: number;
    submissionId?: string;
  }> {
    try {
      // Upload evidence one file at a time before submitting report metadata.
      // This keeps Base64 file contents out of the large /api/reports JSON request.
      const compactFormData = JSON.parse(JSON.stringify(formData));
      const topics = Array.isArray(compactFormData.topics) ? compactFormData.topics : [];
      let uploadIndex = 0;
      for (let topicIndex = 0; topicIndex < topics.length; topicIndex++) {
        const topic = topics[topicIndex];
        const files = Array.isArray(topic.evidenceFiles) ? topic.evidenceFiles : [];
        for (let fileIndex = 0; fileIndex < files.length; fileIndex++) {
          const file = files[fileIndex];
          const currentUrl = String(file.url || '');
          const dataUrl = String(file.dataUrl || (currentUrl.startsWith('data:') ? currentUrl : '') || '');
          const existingDriveId = file.driveFileId || file.drive_file_id;
          const existingDriveUrl = file.driveUrl || file.fileUrl || (currentUrl.startsWith('http') ? currentUrl : '');
          if (dataUrl.startsWith('data:') && !(existingDriveId && existingDriveUrl)) {
            uploadIndex++;
            const uploadRes = await fetch(apiUrl('/api/evidence/upload'), {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
              body: JSON.stringify({
                submissionId: compactFormData.submissionId,
                topicId: `${topic.id ?? topicIndex + 1}_${fileIndex + 1}`,
                fileName: file.name || `evidence_${fileIndex + 1}`,
                mimeType: file.mimeType || file.type || 'application/octet-stream',
                fileDataUrl: dataUrl
              })
            });
            const uploadData = await uploadRes.json().catch(() => null);
            if (!uploadRes.ok || !uploadData || uploadData.success !== true || !uploadData.fileId || !uploadData.fileUrl) {
              return { success: false, message: (uploadData && uploadData.message) || `อัปโหลดไฟล์แนบลำดับที่ ${uploadIndex} ไม่สำเร็จ (HTTP ${uploadRes.status}) ข้อมูลรายงานยังไม่ถูกส่งเพื่อบันทึก` };
            }
            file.driveFileId = uploadData.fileId;
            file.driveUrl = uploadData.fileUrl;
            file.fileUrl = uploadData.fileUrl;
            file.url = uploadData.fileUrl;
          } else if (existingDriveId && existingDriveUrl) {
            file.driveFileId = existingDriveId;
            file.driveUrl = existingDriveUrl;
            file.fileUrl = existingDriveUrl;
            file.url = existingDriveUrl;
          }
          delete file.dataUrl;
          if (file.driveUrl) file.url = file.driveUrl;
        }
      }
      const res = await fetch(apiUrl('/api/reports'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(compactFormData)
      });

      const data = await res.json().catch(() => null);

      if (
        !res.ok ||
        !data ||
        data.success !== true
      ) {
        const errorMsg =
          data?.message ||
          `เกิดข้อผิดพลาดในการบันทึกข้อมูล (HTTP ${res.status})`;

        return {
          success: false,
          message: errorMsg
        };
      }

      return {
        success: true,
        message:
          data.message ||
          'บันทึกข้อมูลเรียบร้อยแล้ว',
        recordId:
          typeof data.recordId === 'number'
            ? data.recordId
            : Number(data.recordId),
        submissionId:
          data.submissionId ||
          formData.submissionId
      };
    } catch (err: any) {
      console.error(
        'Network or server error during submitReport:',
        err
      );

      return {
        success: false,
        message:
          err?.message ||
          'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์เพื่อบันทึกข้อมูลได้ กรุณาลองใหม่อีกครั้ง'
      };
    }
  }
}

export const mwaService: IMWAService = new MWAServiceImpl();
