export type AttendanceStatusType = 'PRESENT' | 'ABSENT' | 'EXCUSED';

export type AttendanceTypeEnum =
  | 'SUNDAY_WORSHIP'
  | 'MIDWEEK_SERVICE'
  | 'SPECIAL_EVENT'
  | 'YOUTH_FELLOWSHIP'
  | 'OUTREACH'
  | 'OTHER';

export interface AttendanceRecordResponse {
  id: string;
  churchId: string;
  memberId: string;
  attendanceDate: string;
  attendanceType: AttendanceTypeEnum;
  status: AttendanceStatusType;
  eventId: string | null;
  notes: string | null;
  recordedById: string | null;
  createdAt: string;
  updatedAt: string;
  member?: {
    id: string;
    memberId: string;
    firstName: string;
    lastName: string;
    profilePictureUrl: string | null;
    email: string | null;
    phoneNumber: string | null;
    membershipStatus: string;
  };
  recordedBy?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
}

export interface AttendanceRosterItem {
  memberId: string;
  memberCode: string;
  firstName: string;
  lastName: string;
  profilePictureUrl: string | null;
  phoneNumber: string | null;
  email: string | null;
  membershipStatus: string;
  // Current session attendance record if exists
  recordId?: string;
  status?: AttendanceStatusType;
  notes?: string | null;
  recordedAt?: string;
}

export interface AttendanceSessionSummary {
  date: string;
  attendanceType: AttendanceTypeEnum;
  eventId: string | null;
  totalMembers: number;
  presentCount: number;
  absentCount: number;
  excusedCount: number;
  attendancePercentage: number;
  recordedById?: string | null;
  recordedByName?: string | null;
  lastUpdated: string;
}

export interface MemberAttendanceSummary {
  member: {
    id: string;
    memberId: string;
    firstName: string;
    lastName: string;
    profilePictureUrl: string | null;
    email: string | null;
    phoneNumber: string | null;
    membershipStatus: string;
  };
  stats: {
    totalSessions: number;
    presentCount: number;
    absentCount: number;
    excusedCount: number;
    attendancePercentage: number;
  };
  history: AttendanceRecordResponse[];
}

export interface AttendanceFilterParams {
  date?: string;
  startDate?: string;
  endDate?: string;
  attendanceType?: AttendanceTypeEnum | string;
  status?: AttendanceStatusType | string;
  memberId?: string;
  search?: string;
  eventId?: string;
  page?: number;
  limit?: number;
}
