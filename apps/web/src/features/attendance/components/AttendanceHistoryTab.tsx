import React, { useState, useEffect, useMemo } from 'react';
import {
  IconCalendar,
  IconSearch,
  IconPrinter,
  IconDownload,
  IconX,
  IconTrash,
  IconChevronRight,
  IconHistory,
} from '@tabler/icons-react';

import { attendanceApi } from '../api/attendance';
import {
  AttendanceSessionSummary,
  AttendanceRecordResponse,
  AttendanceTypeEnum,
} from '@ministryhub/types';
import { getMediaUrl } from '@/utils/media';
import { Avatar, Input, Select, TableSkeleton } from '@/components/ui';
import { toast } from '@/components/ui/Toast';
import { AttendancePdfModal } from './AttendancePdfModal';
import './AttendanceHistoryTab.scss';

export interface AttendanceHistoryTabProps {
  onSelectSessionToEdit?: (date: string, type: AttendanceTypeEnum) => void;
  onViewMemberHistory?: (memberId: string) => void;
}

export const AttendanceHistoryTab: React.FC<AttendanceHistoryTabProps> = ({
  onSelectSessionToEdit,
}) => {
  const [sessions, setSessions] = useState<AttendanceSessionSummary[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [attendanceType, setAttendanceType] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Selected session for drill-down modal
  const [selectedSession, setSelectedSession] = useState<AttendanceSessionSummary | null>(null);
  const [sessionDetails, setSessionDetails] = useState<AttendanceRecordResponse[]>([]);
  const [isLoadingDetails, setIsLoadingDetails] = useState<boolean>(false);
  const [modalSearch, setModalSearch] = useState<string>('');
  const [modalStatusFilter, setModalStatusFilter] = useState<string>('');
  const [isPdfModalOpen, setIsPdfModalOpen] = useState<boolean>(false);

  const fetchSessions = async () => {
    try {
      setIsLoading(true);
      const data = await attendanceApi.getSessions({
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        attendanceType: attendanceType || undefined,
      });
      setSessions(data);
    } catch (error) {
      console.error('Failed to load attendance sessions:', error);
      toast.error('Failed to load past attendance sessions');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [startDate, endDate, attendanceType]);

  const handleOpenDetails = async (session: AttendanceSessionSummary) => {
    setSelectedSession(session);
    setModalSearch('');
    setModalStatusFilter('');
    try {
      setIsLoadingDetails(true);
      const response = await attendanceApi.getRecords({
        date: session.date,
        attendanceType: session.attendanceType,
      });
      setSessionDetails(response.records);
    } catch (error) {
      console.error('Failed to fetch session detail records:', error);
      toast.error('Failed to load session attendee list');
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleDeleteSession = async (session: AttendanceSessionSummary, e: React.MouseEvent) => {
    e.stopPropagation();
    const formattedDate = new Date(session.date + 'T00:00:00Z').toLocaleDateString();
    if (
      window.confirm(
        `Are you sure you want to delete all attendance records for ${formattedDate} (${session.attendanceType})?`,
      )
    ) {
      try {
        await attendanceApi.deleteSession({
          date: session.date,
          attendanceType: session.attendanceType,
        });
        toast.success(`Deleted attendance session for ${formattedDate}`);
        if (selectedSession?.date === session.date && selectedSession?.attendanceType === session.attendanceType) {
          setSelectedSession(null);
        }
        fetchSessions();
      } catch (error) {
        console.error('Failed to delete attendance session:', error);
        toast.error('Failed to delete session');
      }
    }
  };

  const handleExportCsv = async (session: AttendanceSessionSummary) => {
    try {
      await attendanceApi.downloadCsv({
        startDate: session.date,
        endDate: session.date,
        attendanceType: session.attendanceType,
      });
      toast.success('Downloaded session attendance CSV');
    } catch (error) {
      console.error('Failed to download session CSV:', error);
      toast.error('Failed to export CSV');
    }
  };

  // Filtered session records in drilldown modal
  const filteredModalRecords = useMemo(() => {
    return sessionDetails.filter((r) => {
      const name = `${r.member?.firstName} ${r.member?.lastName}`.toLowerCase();
      const code = (r.member?.memberId || '').toLowerCase();
      const matchSearch =
        !modalSearch || name.includes(modalSearch.toLowerCase()) || code.includes(modalSearch.toLowerCase());
      const matchStatus = !modalStatusFilter || r.status === modalStatusFilter;
      return matchSearch && matchStatus;
    });
  }, [sessionDetails, modalSearch, modalStatusFilter]);

  // Filter sessions by search term
  const filteredSessions = useMemo(() => {
    if (!searchTerm) return sessions;
    const term = searchTerm.toLowerCase();
    return sessions.filter((s) => {
      const typeStr = s.attendanceType.toLowerCase().replace(/_/g, ' ');
      const dateStr = s.date.toLowerCase();
      return typeStr.includes(term) || dateStr.includes(term);
    });
  }, [sessions, searchTerm]);

  return (
    <div className="attendance-history-tab">
      {/* ================= 1. CONTROLS BAR (Matching Directory Header) ================= */}
      <div className="history-controls-bar">
        <div className="controls-left-group">
          {/* Date range filter */}
          <div className="date-range-filter-wrap">
            <span className="control-label">Date Range:</span>
            <input
              type="date"
              className="history-date-input"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              placeholder="From"
            />
            <span className="sep-to">to</span>
            <input
              type="date"
              className="history-date-input"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              placeholder="To"
            />
          </div>

          {/* Service type filter */}
          <div className="service-type-wrap">
            <Select
              value={attendanceType}
              onChange={(e) => setAttendanceType(e.target.value)}
            >
              <option value="">All Service Types</option>
              <option value="SUNDAY_WORSHIP">Sunday Worship</option>
              <option value="MIDWEEK_SERVICE">Midweek Service</option>
              <option value="YOUTH_FELLOWSHIP">Youth Fellowship</option>
              <option value="SPECIAL_EVENT">Special Event</option>
              <option value="OUTREACH">Outreach</option>
              <option value="OTHER">Other</option>
            </Select>
          </div>
        </div>

        <div className="controls-right-group">
          <div className="search-bar-wrapper">
            <Input
              startIcon={<IconSearch size={18} stroke={1.8} />}
              placeholder="Search session date or type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* ================= 2. SECONDARY SUBBAR ================= */}
      <div className="history-subbar">
        <div className="session-count-badge">
          <strong>{filteredSessions.length}</strong> recorded sessions
        </div>
      </div>

      {/* ================= 3. SESSIONS TABLE (Matching Members Directory .table-card) ================= */}
      <div className="table-card">
        {isLoading ? (
          <TableSkeleton rows={6} />
        ) : filteredSessions.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <IconHistory size={36} stroke={1.5} />
            </div>
            <h3>No past attendance sessions found</h3>
            <p>
              {startDate || endDate || attendanceType || searchTerm
                ? 'Try adjusting your filter or date range.'
                : 'Take attendance for a Sunday service to begin building your session history.'}
            </p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="members-table history-sessions-table">
              <thead>
                <tr>
                  <th style={{ width: '48px' }}>#</th>
                  <th>Service Date</th>
                  <th>Attendance Type</th>
                  <th>Attendance Rate</th>
                  <th>Status Breakdown</th>
                  <th>Recorded By</th>
                  <th style={{ width: '130px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSessions.map((session, index) => {
                  const dateFormatted = new Date(session.date + 'T00:00:00Z').toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    timeZone: 'UTC',
                  });

                  return (
                    <tr
                      key={`${session.date}-${session.attendanceType}`}
                      className="member-row"
                      onClick={() => handleOpenDetails(session)}
                    >
                      <td className="cell-index">{index + 1}</td>
                      <td>
                        <div className="session-date-cell">
                          <IconCalendar size={18} stroke={1.8} className="date-icon" />
                          <span className="session-date-text">{dateFormatted}</span>
                        </div>
                      </td>
                      <td>
                        <span className="service-type-badge">
                          {session.attendanceType.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td>
                        <div className="rate-badge-wrap">
                          <span className="rate-percentage">{session.attendancePercentage}%</span>
                          <span className="rate-ratio">
                            ({session.presentCount} / {session.totalMembers})
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className="breakdown-chips-compact">
                          <span className="chip-count chip-present">{session.presentCount} P</span>
                          <span className="chip-count chip-absent">{session.absentCount} A</span>
                          <span className="chip-count chip-excused">{session.excusedCount} E</span>
                        </div>
                      </td>
                      <td>
                        <span className="recorder-text">{session.recordedByName || 'Admin'}</span>
                      </td>
                      <td style={{ textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                        <div className="table-actions-group">
                          <button
                            type="button"
                            className="btn-table-action"
                            onClick={() => handleExportCsv(session)}
                            title="Export CSV"
                          >
                            <IconDownload size={15} stroke={2} />
                          </button>
                          <button
                            type="button"
                            className="btn-table-action danger"
                            onClick={(e) => handleDeleteSession(session, e)}
                            title="Delete Session"
                          >
                            <IconTrash size={15} stroke={2} />
                          </button>
                          <button
                            type="button"
                            className="btn-table-action"
                            onClick={() => handleOpenDetails(session)}
                            title="View Details"
                          >
                            <IconChevronRight size={16} stroke={2} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ================= 4. REDESIGNED SESSION DRILL-DOWN MODAL ================= */}
      {selectedSession && (
        <div className="mh-modal-overlay" onClick={() => setSelectedSession(null)}>
          <div className="mh-modal-container session-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="mh-modal-header">
              <div className="header-info-wrap">
                <div className="modal-badge-row">
                  <span className="session-type-pill">
                    {selectedSession.attendanceType.replace(/_/g, ' ')}
                  </span>
                  <span className="session-date-pill">
                    <IconCalendar size={13} stroke={2} />
                    {selectedSession.date}
                  </span>
                </div>
                <h3 className="mh-modal-title">
                  {new Date(selectedSession.date + 'T00:00:00Z').toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                    timeZone: 'UTC',
                  })}
                </h3>
              </div>
              <button
                type="button"
                className="btn-close-modal"
                onClick={() => setSelectedSession(null)}
                title="Close"
              >
                <IconX size={20} stroke={2} />
              </button>
            </div>

            <div className="mh-modal-body">
              {/* Compact Summary Strip */}
              <div className="modal-summary-strip">
                <div className="modal-stat-item">
                  <span className="stat-label">Total Roster</span>
                  <span className="stat-value">{selectedSession.totalMembers}</span>
                </div>
                <div className="modal-stat-divider" />
                <div className="modal-stat-item stat-present">
                  <span className="stat-label">Present</span>
                  <span className="stat-value">{selectedSession.presentCount}</span>
                </div>
                <div className="modal-stat-divider" />
                <div className="modal-stat-item stat-absent">
                  <span className="stat-label">Absent</span>
                  <span className="stat-value">{selectedSession.absentCount}</span>
                </div>
                <div className="modal-stat-divider" />
                <div className="modal-stat-item stat-excused">
                  <span className="stat-label">Excused</span>
                  <span className="stat-value">{selectedSession.excusedCount}</span>
                </div>
                <div className="modal-stat-divider" />
                <div className="modal-stat-item stat-rate">
                  <span className="stat-label">Attendance Rate</span>
                  <span className="stat-value">{selectedSession.attendancePercentage}%</span>
                </div>
              </div>

              {/* Modal filter bar */}
              <div className="modal-filter-bar">
                <div className="search-box">
                  <Input
                    startIcon={<IconSearch size={16} stroke={1.8} />}
                    placeholder="Search attendee in session..."
                    value={modalSearch}
                    onChange={(e) => setModalSearch(e.target.value)}
                  />
                </div>
                <div className="status-select-wrap">
                  <Select
                    value={modalStatusFilter}
                    onChange={(e) => setModalStatusFilter(e.target.value)}
                  >
                    <option value="">All Statuses</option>
                    <option value="PRESENT">Present</option>
                    <option value="ABSENT">Absent</option>
                    <option value="EXCUSED">Excused</option>
                  </Select>
                </div>
                <div className="modal-actions-right">
                  <button
                    type="button"
                    className="btn-control-secondary"
                    onClick={() => handleExportCsv(selectedSession)}
                  >
                    <IconDownload size={15} stroke={2} />
                    <span>CSV</span>
                  </button>
                  <button
                    type="button"
                    className="btn-control-secondary"
                    onClick={() => setIsPdfModalOpen(true)}
                  >
                    <IconPrinter size={15} stroke={2} />
                    <span>Print / PDF</span>
                  </button>
                  {onSelectSessionToEdit && (
                    <button
                      type="button"
                      className="btn-primary-action"
                      onClick={() => {
                        onSelectSessionToEdit(selectedSession.date, selectedSession.attendanceType);
                        setSelectedSession(null);
                      }}
                    >
                      Edit Session
                    </button>
                  )}
                </div>
              </div>

              {/* Modal Attendees Table */}
              <div className="modal-table-wrap">
                {isLoadingDetails ? (
                  <TableSkeleton rows={5} />
                ) : filteredModalRecords.length === 0 ? (
                  <div className="modal-empty-state">No matching attendees found.</div>
                ) : (
                  <table className="members-table modal-attendees-table">
                    <thead>
                      <tr>
                        <th style={{ width: '40px' }}>#</th>
                        <th>Member</th>
                        <th style={{ width: '130px' }}>Member ID</th>
                        <th style={{ width: '120px' }}>Status</th>
                        <th>Notes / Reason</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredModalRecords.map((rec, idx) => (
                        <tr key={rec.id} className="member-row">
                          <td className="cell-index">{idx + 1}</td>
                          <td>
                            <div className="basic-info-cell">
                              <Avatar
                                src={
                                  rec.member?.profilePictureUrl
                                    ? getMediaUrl(rec.member.profilePictureUrl)
                                    : undefined
                                }
                                alt={rec.member?.firstName || 'M'}
                                fallback={`${rec.member?.firstName?.[0] || ''}${rec.member?.lastName?.[0] || ''}`}
                                size="md"
                              />
                              <div className="name-email-wrap">
                                <span className="member-full-name">
                                  {rec.member?.firstName} {rec.member?.lastName}
                                </span>
                                <span className="member-email">
                                  {rec.member?.phoneNumber || rec.member?.email || '—'}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className="member-code-badge">{rec.member?.memberId || '—'}</span>
                          </td>
                          <td>
                            <span className={`status-pill status-${rec.status.toLowerCase()}`}>
                              {rec.status}
                            </span>
                          </td>
                          <td className="cell-notes">{rec.notes || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PDF Export Modal */}
      {isPdfModalOpen && selectedSession && (
        <AttendancePdfModal
          isOpen={isPdfModalOpen}
          onClose={() => setIsPdfModalOpen(false)}
          title={`Attendance Report · ${new Date(selectedSession.date + 'T00:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })}`}
          subtitle={`${selectedSession.attendanceType.replace(/_/g, ' ')} — MinistryHub`}
          dateRangeText={selectedSession.date}
          attendanceType={selectedSession.attendanceType}
          records={filteredModalRecords}
        />
      )}
    </div>
  );
};
