import React, { useState, useEffect, useMemo } from 'react';
import {
  IconSearch,
  IconFileSpreadsheet,
  IconFileText,
  IconCalendar,
} from '@tabler/icons-react';
import { attendanceApi } from '../api/attendance';
import { AttendanceRecordResponse } from '@ministryhub/types';
import { getMediaUrl } from '@/utils/media';
import { Avatar, Input, Select, Pagination, TableSkeleton } from '@/components/ui';
import { toast } from '@/components/ui/Toast';
import { AttendancePdfModal } from './AttendancePdfModal';
import './AttendanceReportsTab.scss';

export const AttendanceReportsTab: React.FC = () => {
  const [records, setRecords] = useState<AttendanceRecordResponse[]>([]);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isExportingCsv, setIsExportingCsv] = useState<boolean>(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState<boolean>(false);

  // Filters
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [attendanceType, setAttendanceType] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  const fetchRecords = async () => {
    try {
      setIsLoading(true);
      const data = await attendanceApi.getRecords({
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        attendanceType: attendanceType || undefined,
        status: status || undefined,
        search: searchTerm || undefined,
        page: currentPage,
        limit: pageSize,
      });

      setRecords(data.records);
      setTotalRecords(data.total);
    } catch (error) {
      console.error('Failed to fetch attendance reports:', error);
      toast.error('Failed to load attendance report records');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchRecords();
    }, 200);
    return () => clearTimeout(timer);
  }, [startDate, endDate, attendanceType, status, searchTerm, currentPage, pageSize]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [startDate, endDate, attendanceType, status, searchTerm]);

  // Handle direct CSV download with active filters
  const handleExportCsv = async () => {
    try {
      setIsExportingCsv(true);
      await attendanceApi.downloadCsv({
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        attendanceType: attendanceType || undefined,
        status: status || undefined,
        search: searchTerm || undefined,
      });
      toast.success('CSV export generated and downloaded');
    } catch (error) {
      console.error('Failed to export CSV:', error);
      toast.error('Failed to export attendance CSV');
    } finally {
      setIsExportingCsv(false);
    }
  };

  const dateRangeDescription = useMemo(() => {
    if (startDate && endDate) {
      return `${startDate} to ${endDate}`;
    }
    if (startDate) {
      return `From ${startDate}`;
    }
    if (endDate) {
      return `Up to ${endDate}`;
    }
    return 'All Time History';
  }, [startDate, endDate]);

  return (
    <div className="attendance-reports-tab">
      {/* ================= 1. FILTER CONTROLS DRAWER ================= */}
      <div className="reports-control-card">
        <div className="filters-grid">
          {/* Date Range */}
          <div className="filter-field date-range-field">
            <label className="field-label">Date Range</label>
            <div className="date-inputs-flex">
              <input
                type="date"
                className="report-date-input"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                placeholder="Start"
              />
              <span className="sep-to">to</span>
              <input
                type="date"
                className="report-date-input"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                placeholder="End"
              />
            </div>
          </div>

          {/* Service Type */}
          <div className="filter-field">
            <label className="field-label">Service Type</label>
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

          {/* Status */}
          <div className="filter-field">
            <label className="field-label">Attendance Status</label>
            <Select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="PRESENT">Present Only</option>
              <option value="ABSENT">Absent Only</option>
              <option value="EXCUSED">Excused Only</option>
            </Select>
          </div>

          {/* Search */}
          <div className="filter-field search-field">
            <label className="field-label">Search Member</label>
            <Input
              startIcon={<IconSearch size={16} stroke={1.8} />}
              placeholder="Search by name or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Action Buttons Row */}
        <div className="reports-actions-row">
          <div className="results-count-text">
            Found <strong>{totalRecords}</strong> attendance records
          </div>

          <div className="export-buttons-group">
            <button
              type="button"
              className="btn-control-secondary"
              onClick={handleExportCsv}
              disabled={isExportingCsv || totalRecords === 0}
            >
              <IconFileSpreadsheet size={16} stroke={2} />
              <span>{isExportingCsv ? 'Exporting...' : 'Export to CSV'}</span>
            </button>

            <button
              type="button"
              className="btn-primary-action"
              onClick={() => setIsPdfModalOpen(true)}
              disabled={totalRecords === 0}
            >
              <IconFileText size={16} stroke={2} />
              <span>Generate PDF Report</span>
            </button>
          </div>
        </div>
      </div>

      {/* ================= 2. REPORTS TABLE (Matching Members Directory .table-card) ================= */}
      <div className="table-card">
        {isLoading ? (
          <TableSkeleton rows={8} />
        ) : records.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <IconFileText size={36} stroke={1.5} />
            </div>
            <h3>No attendance records found</h3>
            <p>Try adjusting your search criteria, dates, or status filter.</p>
          </div>
        ) : (
          <>
            <div className="table-responsive">
              <table className="members-table reports-table">
                <thead>
                  <tr>
                    <th style={{ width: '48px' }}>#</th>
                    <th>Member Details</th>
                    <th style={{ width: '130px' }}>Member ID</th>
                    <th>Attendance Date</th>
                    <th>Service Type</th>
                    <th>Status</th>
                    <th>Remarks / Notes</th>
                    <th>Recorded By</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((record, index) => {
                    const member = record.member;
                    const memberName = member
                      ? `${member.firstName} ${member.lastName}`
                      : 'Unknown Member';
                    const memberCode = member?.memberId || '—';
                    const dateFormatted = new Date(
                      record.attendanceDate + 'T00:00:00Z',
                    ).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      timeZone: 'UTC',
                    });

                    return (
                      <tr key={record.id} className="member-row">
                        <td className="cell-index">
                          {(currentPage - 1) * pageSize + index + 1}
                        </td>
                        <td>
                          <div className="basic-info-cell">
                            <Avatar
                              src={
                                member?.profilePictureUrl
                                  ? getMediaUrl(member.profilePictureUrl)
                                  : undefined
                              }
                              alt={member?.firstName || 'M'}
                              fallback={`${member?.firstName?.[0] || ''}${member?.lastName?.[0] || ''}`}
                              size="md"
                            />
                            <div className="name-email-wrap">
                              <span className="member-full-name">{memberName}</span>
                              <span className="member-email">
                                {member?.phoneNumber || member?.email || '—'}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="member-code-badge">{memberCode}</span>
                        </td>
                        <td>
                          <div className="date-cell-wrap">
                            <IconCalendar size={15} stroke={1.8} className="date-icon" />
                            <span>{dateFormatted}</span>
                          </div>
                        </td>
                        <td>
                          <span className="service-type-badge">
                            {record.attendanceType.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td>
                          <span className={`status-pill status-${record.status.toLowerCase()}`}>
                            {record.status}
                          </span>
                        </td>
                        <td className="cell-notes">{record.notes || '—'}</td>
                        <td>
                          <span className="recorder-text">
                            {record.recordedBy
                              ? `${record.recordedBy.firstName} ${record.recordedBy.lastName}`
                              : 'System'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="reports-pagination-container">
              <Pagination
                currentPage={currentPage}
                totalItems={totalRecords}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                onPageSizeChange={setPageSize}
              />
            </div>
          </>
        )}
      </div>

      {/* PDF Modal */}
      {isPdfModalOpen && (
        <AttendancePdfModal
          isOpen={isPdfModalOpen}
          onClose={() => setIsPdfModalOpen(false)}
          title="Attendance & Participation Report"
          subtitle={`Filtered report covering ${dateRangeDescription}`}
          dateRangeText={dateRangeDescription}
          attendanceType={attendanceType || 'All Services'}
          records={records}
        />
      )}
    </div>
  );
};
