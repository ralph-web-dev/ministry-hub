import React, { useState, useEffect, useMemo } from 'react';
import {
  IconSearch,
  IconCheck,
  IconX,
  IconClock,
  IconDeviceFloppy,
  IconChevronLeft,
  IconChevronRight,
  IconHistory,
  IconRotate,
  IconChecklist,
  IconAlertCircle,
} from '@tabler/icons-react';
import { attendanceApi, SessionRosterResponse } from '../api/attendance';
import { AttendanceRosterItem, AttendanceStatusType, AttendanceTypeEnum } from '@ministryhub/types';
import { getMediaUrl } from '@/utils/media';
import { Avatar, Input, Select, TableSkeleton, Pagination } from '@/components/ui';
import { toast } from '@/components/ui/Toast';
import './TakeAttendanceTab.scss';

// Calculate the most recent Sunday date in YYYY-MM-DD
function getLatestSundayString(): string {
  const d = new Date();
  const day = d.getDay(); // 0 is Sunday
  const diff = day === 0 ? 0 : day;
  d.setDate(d.getDate() - diff);
  return d.toISOString().split('T')[0];
}

function adjustSundayDate(currentDateStr: string, weeks: number): string {
  const d = new Date(currentDateStr + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + weeks * 7);
  return d.toISOString().split('T')[0];
}

export interface TakeAttendanceTabProps {
  onViewMemberHistory?: (memberId: string) => void;
}

export const TakeAttendanceTab: React.FC<TakeAttendanceTabProps> = ({
  onViewMemberHistory,
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(getLatestSundayString());
  const [attendanceType, setAttendanceType] = useState<AttendanceTypeEnum>('SUNDAY_WORSHIP');
  const [sessionData, setSessionData] = useState<SessionRosterResponse | null>(null);
  const [attendances, setAttendances] = useState<Record<string, { status: AttendanceStatusType | null; notes: string }>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [isDirty, setIsDirty] = useState<boolean>(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Fetch session roster
  const fetchSessionRoster = async () => {
    try {
      setIsLoading(true);
      const data = await attendanceApi.getRoster({
        date: selectedDate,
        attendanceType,
      });
      setSessionData(data);

      const initialMap: Record<string, { status: AttendanceStatusType | null; notes: string }> = {};
      data.roster.forEach((item: AttendanceRosterItem) => {
        // If the session is already recorded in the database, use item.status.
        // If it is an unrecorded session (e.g. next Sunday or new date), keep status as null (unmarked).
        initialMap[item.memberId] = {
          status: item.status || null,
          notes: item.notes || '',
        };
      });

      setAttendances(initialMap);
      setIsDirty(false);
    } catch (error) {
      console.error('Failed to load session roster:', error);
      toast.error('Failed to load attendance roster');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSessionRoster();
  }, [selectedDate, attendanceType]);

  // Reset pagination on filter or date change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedDate, attendanceType, searchTerm, statusFilter]);

  const handleStatusChange = (memberId: string, status: AttendanceStatusType) => {
    setAttendances((prev) => ({
      ...prev,
      [memberId]: {
        ...prev[memberId],
        status,
      },
    }));
    setIsDirty(true);
  };

  const handleNotesChange = (memberId: string, notes: string) => {
    setAttendances((prev) => ({
      ...prev,
      [memberId]: {
        ...prev[memberId],
        notes,
      },
    }));
    setIsDirty(true);
  };

  const handleMarkAll = (status: AttendanceStatusType) => {
    setAttendances((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((id) => {
        next[id] = { ...next[id], status };
      });
      return next;
    });
    setIsDirty(true);
    toast.success(`Marked all members as ${status.toLowerCase()}`);
  };

  const handleClearAll = () => {
    setAttendances((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((id) => {
        next[id] = { ...next[id], status: null };
      });
      return next;
    });
    setIsDirty(true);
    toast.info('Cleared all attendance marks for this session');
  };

  const handleSaveAttendance = async () => {
    if (!sessionData) return;

    try {
      setIsSaving(true);
      // For any member still unmarked, default to ABSENT when saving the session
      const records = Object.entries(attendances).map(([memberId, val]) => ({
        memberId,
        status: val.status || ('ABSENT' as AttendanceStatusType),
        notes: val.notes || undefined,
      }));

      const result = await attendanceApi.saveBulkAttendance({
        attendanceDate: selectedDate,
        attendanceType,
        records,
      });

      toast.success(
        `Attendance saved successfully! (${result.presentCount} present, ${result.absentCount} absent, ${result.excusedCount} excused)`,
      );
      setIsDirty(false);
      fetchSessionRoster();
    } catch (error) {
      console.error('Failed to save attendance:', error);
      toast.error('Failed to save attendance records');
    } finally {
      setIsSaving(false);
    }
  };

  // Filter roster by search & status
  const filteredRoster = useMemo(() => {
    if (!sessionData?.roster) return [];
    return sessionData.roster.filter((item: AttendanceRosterItem) => {
      const fullName = `${item.firstName} ${item.lastName}`.toLowerCase();
      const code = (item.memberCode || '').toLowerCase();
      const searchMatch =
        !searchTerm ||
        fullName.includes(searchTerm.toLowerCase()) ||
        code.includes(searchTerm.toLowerCase());

      if (!searchMatch) return false;

      const currentStatus = attendances[item.memberId]?.status;
      if (statusFilter === 'ALL') return true;
      if (statusFilter === 'UNMARKED') return currentStatus === null;
      return currentStatus === statusFilter;
    });
  }, [sessionData, searchTerm, statusFilter, attendances]);

  // Paginate filtered roster
  const paginatedRoster = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredRoster.slice(startIndex, startIndex + pageSize);
  }, [filteredRoster, currentPage, pageSize]);

  // Realtime calculated statistics
  const stats = useMemo(() => {
    const total = Object.keys(attendances).length;
    let present = 0;
    let absent = 0;
    let excused = 0;
    let unmarked = 0;

    Object.values(attendances).forEach((val) => {
      if (val.status === 'PRESENT') present++;
      else if (val.status === 'ABSENT') absent++;
      else if (val.status === 'EXCUSED') excused++;
      else unmarked++;
    });

    const isRecorded = sessionData?.session.isRecorded ?? false;
    const hasAnyMarks = present > 0 || absent > 0 || excused > 0;
    const rate = total > 0 && (isRecorded || hasAnyMarks) ? Math.round((present / total) * 100) : 0;

    return { total, present, absent, excused, unmarked, rate, isRecorded, hasAnyMarks };
  }, [attendances, sessionData]);

  return (
    <div className="take-attendance-tab">
      {/* ================= 1. PRIMARY CONTROLS BAR (Matching Directory Header) ================= */}
      <div className="attendance-controls-bar">
        <div className="controls-left-group">
          {/* Sunday / Date Selector with Quick Navigation */}
          <div className="date-picker-group">
            <button
              type="button"
              className="btn-control-secondary icon-btn-prev"
              onClick={() => setSelectedDate((d) => adjustSundayDate(d, -1))}
              title="Previous Sunday"
            >
              <IconChevronLeft size={16} stroke={2} />
              <span>Prev Sunday</span>
            </button>

            <div className="date-input-wrap">
              <input
                type="date"
                className="date-picker-input"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>

            <button
              type="button"
              className="btn-control-secondary icon-btn-next"
              onClick={() => setSelectedDate((d) => adjustSundayDate(d, 1))}
              title="Next Sunday"
            >
              <span>Next Sunday</span>
              <IconChevronRight size={16} stroke={2} />
            </button>

            <button
              type="button"
              className="btn-control-secondary"
              onClick={() => setSelectedDate(getLatestSundayString())}
              title="Latest Sunday"
            >
              <span>Latest</span>
            </button>
          </div>

          {/* Service Type Selector */}
          <div className="service-type-wrap">
            <Select
              value={attendanceType}
              onChange={(e) => setAttendanceType(e.target.value as AttendanceTypeEnum)}
            >
              <option value="SUNDAY_WORSHIP">Sunday Worship</option>
              <option value="MIDWEEK_SERVICE">Midweek Service</option>
              <option value="YOUTH_FELLOWSHIP">Youth Fellowship</option>
              <option value="SPECIAL_EVENT">Special Event</option>
              <option value="OUTREACH">Outreach</option>
              <option value="OTHER">Other Service</option>
            </Select>
          </div>
        </div>

        {/* Right Actions */}
        <div className="controls-right-group">
          <div className="search-bar-wrapper">
            <Input
              startIcon={<IconSearch size={18} stroke={1.8} />}
              placeholder="Search member in roster..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <button
            type="button"
            className="btn-primary-action btn-save-attendance"
            onClick={handleSaveAttendance}
            disabled={isSaving || isLoading}
          >
            <IconDeviceFloppy size={18} stroke={2.2} />
            <span>{isSaving ? 'Saving...' : isDirty ? 'Save Attendance *' : 'Save Attendance'}</span>
          </button>
        </div>
      </div>

      {/* ================= 2. COMPACT SUMMARY STRIP ================= */}
      <div className="attendance-summary-strip">
        <div className="summary-stat-item">
          <span className="stat-label">Active Roster</span>
          <span className="stat-value">{stats.total}</span>
        </div>
        <div className="summary-stat-divider" />
        <div className="summary-stat-item stat-present">
          <span className="stat-label">Present</span>
          <span className="stat-value">{stats.present}</span>
        </div>
        <div className="summary-stat-divider" />
        <div className="summary-stat-item stat-absent">
          <span className="stat-label">Absent</span>
          <span className="stat-value">{stats.absent}</span>
        </div>
        <div className="summary-stat-divider" />
        <div className="summary-stat-item stat-excused">
          <span className="stat-label">Excused</span>
          <span className="stat-value">{stats.excused}</span>
        </div>
        <div className="summary-stat-divider" />
        <div className="summary-stat-item stat-rate">
          <span className="stat-label">Attendance Rate</span>
          <span className="stat-value">
            {stats.isRecorded || stats.hasAnyMarks ? `${stats.rate}%` : '—'}
          </span>
        </div>

        {stats.isRecorded ? (
          <div className="session-recorded-tag">
            <IconCheck size={14} stroke={2.5} />
            <span>Saved for this date</span>
          </div>
        ) : (
          <div className="session-not-recorded-tag">
            <IconAlertCircle size={14} stroke={2} />
            <span>Not Yet Recorded</span>
          </div>
        )}
      </div>

      {/* ================= 3. SECONDARY ACTION / FILTER SUBBAR ================= */}
      <div className="attendance-subbar">
        <div className="subbar-left">
          <div className="quick-actions-group">
            <button
              type="button"
              className="btn-control-secondary"
              onClick={() => handleMarkAll('PRESENT')}
            >
              <IconCheck size={15} stroke={2.5} className="text-success" />
              <span>Mark All Present</span>
            </button>
            <button
              type="button"
              className="btn-control-secondary"
              onClick={() => handleMarkAll('ABSENT')}
            >
              <IconX size={15} stroke={2.5} className="text-danger" />
              <span>Mark All Absent</span>
            </button>
            <button
              type="button"
              className="btn-control-secondary"
              onClick={handleClearAll}
              title="Clear all marked statuses"
            >
              <IconRotate size={15} stroke={2} />
              <span>Clear</span>
            </button>
          </div>
        </div>

        <div className="subbar-right">
          <div className="filter-chips">
            <button
              type="button"
              className={`chip ${statusFilter === 'ALL' ? 'active' : ''}`}
              onClick={() => setStatusFilter('ALL')}
            >
              All ({stats.total})
            </button>
            <button
              type="button"
              className={`chip ${statusFilter === 'PRESENT' ? 'active' : ''}`}
              onClick={() => setStatusFilter('PRESENT')}
            >
              Present ({stats.present})
            </button>
            <button
              type="button"
              className={`chip ${statusFilter === 'ABSENT' ? 'active' : ''}`}
              onClick={() => setStatusFilter('ABSENT')}
            >
              Absent ({stats.absent})
            </button>
            <button
              type="button"
              className={`chip ${statusFilter === 'EXCUSED' ? 'active' : ''}`}
              onClick={() => setStatusFilter('EXCUSED')}
            >
              Excused ({stats.excused})
            </button>
            {!stats.isRecorded && stats.unmarked > 0 && (
              <button
                type="button"
                className={`chip ${statusFilter === 'UNMARKED' ? 'active' : ''}`}
                onClick={() => setStatusFilter('UNMARKED')}
              >
                Unmarked ({stats.unmarked})
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ================= 4. ATTENDANCE TABLE (Matching Members Directory .table-card) ================= */}
      <div className="table-card">
        {isLoading ? (
          <TableSkeleton rows={8} />
        ) : filteredRoster.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <IconChecklist size={36} stroke={1.5} />
            </div>
            <h3>No members found in roster</h3>
            <p>
              {searchTerm || statusFilter !== 'ALL'
                ? 'Try adjusting your search query or status filter.'
                : 'No active members are currently found in Members Management.'}
            </p>
          </div>
        ) : (
          <>
            <div className="table-responsive">
              <table className="members-table attendance-roster-table">
                <thead>
                  <tr>
                    <th style={{ width: '48px' }}>#</th>
                    <th>Member</th>
                    <th style={{ width: '140px' }}>Member ID</th>
                    <th style={{ width: '270px' }}>Status</th>
                    <th>Remarks / Notes</th>
                    <th style={{ width: '80px', textAlign: 'right' }}>History</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedRoster.map((item: AttendanceRosterItem, index: number) => {
                    const memberId = item.memberId;
                    const current = attendances[memberId] || {
                      status: null,
                      notes: '',
                    };
                    const fullName = `${item.firstName} ${item.lastName}`;
                    const globalIndex = (currentPage - 1) * pageSize + index + 1;

                    return (
                      <tr key={memberId} className="member-row">
                        <td className="cell-index">{globalIndex}</td>
                        <td>
                          <div className="basic-info-cell">
                            <Avatar
                              src={
                                item.profilePictureUrl
                                  ? getMediaUrl(item.profilePictureUrl)
                                  : undefined
                              }
                              alt={item.firstName}
                              fallback={`${item.firstName[0]}${item.lastName[0]}`}
                              size="md"
                            />
                            <div className="name-email-wrap">
                              <span className="member-full-name">{fullName}</span>
                              <span className="member-email">
                                {item.phoneNumber || item.email || 'No contact'}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="member-code-badge">
                            {item.memberCode || '—'}
                          </span>
                        </td>
                        <td>
                          <div className="attendance-segmented-toggle">
                            <button
                              type="button"
                              className={`toggle-option option-present ${current.status === 'PRESENT' ? 'active' : ''}`}
                              onClick={() => handleStatusChange(memberId, 'PRESENT')}
                            >
                              <IconCheck size={14} stroke={2.5} />
                              <span>Present</span>
                            </button>
                            <button
                              type="button"
                              className={`toggle-option option-absent ${current.status === 'ABSENT' ? 'active' : ''}`}
                              onClick={() => handleStatusChange(memberId, 'ABSENT')}
                            >
                              <IconX size={14} stroke={2.5} />
                              <span>Absent</span>
                            </button>
                            <button
                              type="button"
                              className={`toggle-option option-excused ${current.status === 'EXCUSED' ? 'active' : ''}`}
                              onClick={() => handleStatusChange(memberId, 'EXCUSED')}
                            >
                              <IconClock size={14} stroke={2.5} />
                              <span>Excused</span>
                            </button>
                          </div>
                        </td>
                        <td>
                          <input
                            type="text"
                            className="table-inline-note-input"
                            placeholder="Add note or excuse reason..."
                            value={current.notes}
                            onChange={(e) => handleNotesChange(memberId, e.target.value)}
                          />
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div className="table-actions-group">
                            <button
                              type="button"
                              className="btn-table-action"
                              onClick={() => onViewMemberHistory?.(memberId)}
                              title="View member attendance timeline"
                            >
                              <IconHistory size={16} stroke={1.8} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Table Pagination Footer */}
            <div className="attendance-pagination-container">
              <Pagination
                currentPage={currentPage}
                totalItems={filteredRoster.length}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                onPageSizeChange={setPageSize}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};
