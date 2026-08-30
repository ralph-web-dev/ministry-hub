import { api } from '@/lib/api';
import {
  AttendanceRecordResponse,
  AttendanceRosterItem,
  AttendanceSessionSummary,
  MemberAttendanceSummary,
  AttendanceFilterParams,
  AttendanceTypeEnum,
} from '@ministryhub/types';

import { BulkAttendanceInput, RecordAttendanceInput } from '@ministryhub/validation';

export interface SessionRosterResponse {
  session: {
    date: string;
    attendanceType: AttendanceTypeEnum;
    eventId: string | null;
    totalActiveMembers: number;
    totalRoster: number;
    totalRecorded: number;
    presentCount: number;
    absentCount: number;
    excusedCount: number;
    attendancePercentage: number;
    isRecorded: boolean;
  };
  roster: AttendanceRosterItem[];
}

export interface DetailedRecordsResponse {
  total: number;
  page: number;
  limit: number;
  records: AttendanceRecordResponse[];
}

export const attendanceApi = {
  /**
   * Retrieves active member roster merged with existing records for a session
   */
  getRoster: async (params: {
    date: string;
    attendanceType?: AttendanceTypeEnum | string;
    eventId?: string;
  }): Promise<SessionRosterResponse> => {
    const response = await api.get<SessionRosterResponse>('/attendance/roster', {
      params,
    });
    return response.data;
  },

  /**
   * Bulk save or update attendance for an entire session
   */
  saveBulkAttendance: async (data: BulkAttendanceInput) => {
    const response = await api.post<{
      message: string;
      date: string;
      attendanceType: string;
      totalSaved: number;
      presentCount: number;
      absentCount: number;
      excusedCount: number;
      attendancePercentage: number;
    }>('/attendance/bulk', data);
    return response.data;
  },

  /**
   * Create or update a single member attendance record
   */
  recordSingle: async (data: RecordAttendanceInput): Promise<AttendanceRecordResponse> => {
    const response = await api.post<AttendanceRecordResponse>('/attendance/record', data);
    return response.data;
  },

  /**
   * Retrieve list of past attendance sessions summaries
   */
  getSessions: async (params?: {
    startDate?: string;
    endDate?: string;
    attendanceType?: string;
    eventId?: string;
  }): Promise<AttendanceSessionSummary[]> => {
    const response = await api.get<AttendanceSessionSummary[]>('/attendance/sessions', {
      params,
    });
    return response.data;
  },

  /**
   * Retrieve filterable detailed attendance records
   */
  getRecords: async (params?: AttendanceFilterParams): Promise<DetailedRecordsResponse> => {
    const response = await api.get<DetailedRecordsResponse>('/attendance/records', {
      params,
    });
    return response.data;
  },

  /**
   * Retrieve individual member attendance history and stats
   */
  getMemberHistory: async (
    memberId: string,
    params?: { startDate?: string; endDate?: string },
  ): Promise<MemberAttendanceSummary> => {
    const response = await api.get<MemberAttendanceSummary>(`/attendance/member/${memberId}`, {
      params,
    });
    return response.data;
  },

  /**
   * Download CSV export file
   */
  downloadCsv: async (params?: AttendanceFilterParams) => {
    const response = await api.get('/attendance/export/csv', {
      params,
      responseType: 'blob',
    });

    const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    const timestamp = new Date().toISOString().split('T')[0];
    link.href = url;
    link.setAttribute('download', `ministryhub-attendance-${timestamp}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  /**
   * Delete attendance records for a session
   */
  deleteSession: async (params: {
    date: string;
    attendanceType?: string;
    eventId?: string;
  }) => {
    const response = await api.delete('/attendance/session', {
      params,
    });
    return response.data;
  },
};
