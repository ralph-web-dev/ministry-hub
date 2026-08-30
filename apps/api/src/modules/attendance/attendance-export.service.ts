import { Injectable } from '@nestjs/common';

export interface ExportAttendanceRecord {
  id: string;
  attendanceDate: Date | string;
  attendanceType: string;
  status: string;
  notes: string | null;
  createdAt: Date | string;
  member: {
    memberId: string;
    firstName: string;
    lastName: string;
    email: string | null;
    phoneNumber: string | null;
  };
  recordedBy?: {
    firstName: string;
    lastName: string;
    email: string;
  } | null;
}

@Injectable()
export class AttendanceExportService {
  /**
   * Generates an RFC-4180 compliant CSV string for attendance records.
   */
  generateCsv(records: ExportAttendanceRecord[]): string {
    const headers = [
      'Member Name',
      'Member ID',
      'Phone Number',
      'Email',
      'Attendance Date',
      'Attendance Type',
      'Status',
      'Notes / Remarks',
      'Recorded By',
      'Timestamp',
    ];

    const escapeCsv = (value: any): string => {
      if (value === null || value === undefined) return '""';
      const str = String(value);
      if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return `"${str}"`;
    };

    const rows = records.map((record) => {
      const memberName = `${record.member?.firstName || ''} ${record.member?.lastName || ''}`.trim();
      const memberId = record.member?.memberId || '';
      const phone = record.member?.phoneNumber || '';
      const email = record.member?.email || '';

      const dateStr = record.attendanceDate instanceof Date
        ? record.attendanceDate.toISOString().split('T')[0]
        : String(record.attendanceDate).split('T')[0];

      const typeFormatted = record.attendanceType.replace(/_/g, ' ');
      const status = record.status;
      const notes = record.notes || '';
      const recordedBy = record.recordedBy
        ? `${record.recordedBy.firstName} ${record.recordedBy.lastName}`.trim()
        : 'System';

      const createdAtStr = record.createdAt instanceof Date
        ? record.createdAt.toISOString()
        : String(record.createdAt);

      return [
        escapeCsv(memberName),
        escapeCsv(memberId),
        escapeCsv(phone),
        escapeCsv(email),
        escapeCsv(dateStr),
        escapeCsv(typeFormatted),
        escapeCsv(status),
        escapeCsv(notes),
        escapeCsv(recordedBy),
        escapeCsv(createdAtStr),
      ].join(',');
    });

    return [headers.join(','), ...rows].join('\r\n');
  }
}
