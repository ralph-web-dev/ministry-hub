import React, { useState, useEffect } from 'react';
import {
  IconSearch,
  IconUser,
  IconCalendar,
} from '@tabler/icons-react';
import { attendanceApi } from '../api/attendance';
import { membersApi, MemberResponse } from '@/features/members/api/members';
import { MemberAttendanceSummary, AttendanceRecordResponse } from '@ministryhub/types';
import { getMediaUrl } from '@/utils/media';
import { Avatar, Input, TableSkeleton } from '@/components/ui';
import { toast } from '@/components/ui/Toast';
import './MemberHistoryTab.scss';

export interface MemberHistoryTabProps {
  initialMemberId?: string;
}

export const MemberHistoryTab: React.FC<MemberHistoryTabProps> = ({ initialMemberId }) => {
  const [members, setMembers] = useState<MemberResponse[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState<string>(initialMemberId || '');
  const [memberSummary, setMemberSummary] = useState<MemberAttendanceSummary | null>(null);
  const [memberSearchTerm, setMemberSearchTerm] = useState<string>('');
  const [isLoadingMembers, setIsLoadingMembers] = useState<boolean>(true);
  const [isLoadingSummary, setIsLoadingSummary] = useState<boolean>(false);

  // Fetch members directory list
  useEffect(() => {
    const loadMembers = async () => {
      try {
        setIsLoadingMembers(true);
        const data = await membersApi.getMembers();
        setMembers(data);

        // Auto-select first member if none selected
        if (!selectedMemberId && data.length > 0) {
          setSelectedMemberId(data[0].id);
        }
      } catch (error) {
        console.error('Failed to load members for attendance history:', error);
        toast.error('Failed to load member list');
      } finally {
        setIsLoadingMembers(false);
      }
    };
    loadMembers();
  }, []);

  // Update selected member if prop changes
  useEffect(() => {
    if (initialMemberId) {
      setSelectedMemberId(initialMemberId);
    }
  }, [initialMemberId]);

  // Fetch individual member history
  useEffect(() => {
    if (!selectedMemberId) return;

    const loadHistory = async () => {
      try {
        setIsLoadingSummary(true);
        const data = await attendanceApi.getMemberHistory(selectedMemberId);
        setMemberSummary(data);
      } catch (error) {
        console.error('Failed to load member attendance history:', error);
        toast.error('Failed to load attendance timeline for selected member');
      } finally {
        setIsLoadingSummary(false);
      }
    };
    loadHistory();
  }, [selectedMemberId]);

  // Filter member list in selector sidebar
  const filteredMemberList = members.filter((m) => {
    if (!memberSearchTerm) return true;
    const term = memberSearchTerm.toLowerCase();
    const fullName = `${m.firstName} ${m.lastName}`.toLowerCase();
    const code = (m.memberId || '').toLowerCase();
    return fullName.includes(term) || code.includes(term);
  });

  const selectedMember = members.find((m) => m.id === selectedMemberId);

  return (
    <div className="member-history-tab">
      <div className="member-history-layout">
        {/* ================= 1. MEMBER PICKER SIDEBAR ================= */}
        <div className="member-selector-sidebar">
          <div className="sidebar-search-box">
            <Input
              startIcon={<IconSearch size={16} stroke={1.8} />}
              placeholder="Search member..."
              value={memberSearchTerm}
              onChange={(e) => setMemberSearchTerm(e.target.value)}
            />
          </div>

          <div className="member-picker-list">
            {isLoadingMembers ? (
              <div className="loading-members">Loading roster...</div>
            ) : filteredMemberList.length === 0 ? (
              <div className="no-members-found">No members found</div>
            ) : (
              filteredMemberList.map((m) => {
                const isSelected = m.id === selectedMemberId;
                return (
                  <button
                    key={m.id}
                    type="button"
                    className={`member-picker-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => setSelectedMemberId(m.id)}
                  >
                    <Avatar
                      src={m.profilePictureUrl ? getMediaUrl(m.profilePictureUrl) : undefined}
                      alt={m.firstName}
                      fallback={`${m.firstName[0]}${m.lastName[0]}`}
                      size="sm"
                    />
                    <div className="picker-item-info">
                      <span className="picker-item-name">
                        {m.firstName} {m.lastName}
                      </span>
                      <span className="picker-item-id">{m.memberId || 'Active'}</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ================= 2. MEMBER TIMELINE & KPI DETAIL ================= */}
        <div className="member-history-main">
          {isLoadingSummary ? (
            <TableSkeleton rows={6} />
          ) : !memberSummary || !selectedMember ? (
            <div className="table-card">
              <div className="empty-state">
                <div className="empty-icon">
                  <IconUser size={36} stroke={1.5} />
                </div>
                <h3>Select a member to view attendance history</h3>
                <p>Pick a member from the sidebar to inspect their participation history.</p>
              </div>
            </div>
          ) : (
            <>
              {/* Member Compact Summary Card */}
              <div className="member-profile-compact-card">
                <div className="member-bio-left">
                  <Avatar
                    src={
                      selectedMember.profilePictureUrl
                        ? getMediaUrl(selectedMember.profilePictureUrl)
                        : undefined
                    }
                    alt={selectedMember.firstName}
                    fallback={`${selectedMember.firstName[0]}${selectedMember.lastName[0]}`}
                    size="lg"
                  />
                  <div className="member-text-wrap">
                    <div className="member-title-row">
                      <h3 className="member-name">
                        {selectedMember.firstName} {selectedMember.lastName}
                      </h3>
                      <span className="member-code-badge">{selectedMember.memberId || '—'}</span>
                    </div>
                    <span className="member-contact-sub">
                      {selectedMember.phoneNumber || selectedMember.email || 'No contact details recorded'}
                    </span>
                  </div>
                </div>

                {/* Compact KPI Badges */}
                <div className="member-kpi-strip">
                  <div className="kpi-mini-item">
                    <span className="kpi-label">Recorded</span>
                    <span className="kpi-val">{memberSummary.stats.totalSessions}</span>
                  </div>
                  <div className="kpi-divider" />
                  <div className="kpi-mini-item">
                    <span className="kpi-label">Present</span>
                    <span className="kpi-val text-success">{memberSummary.stats.presentCount}</span>
                  </div>
                  <div className="kpi-divider" />
                  <div className="kpi-mini-item">
                    <span className="kpi-label">Absent</span>
                    <span className="kpi-val text-danger">{memberSummary.stats.absentCount}</span>
                  </div>
                  <div className="kpi-divider" />
                  <div className="kpi-mini-item">
                    <span className="kpi-label">Excused</span>
                    <span className="kpi-val text-warning">{memberSummary.stats.excusedCount}</span>
                  </div>
                  <div className="kpi-divider" />
                  <div className="kpi-mini-item">
                    <span className="kpi-label">Attendance Rate</span>
                    <span className="kpi-val text-rate">{memberSummary.stats.attendancePercentage}%</span>
                  </div>
                </div>
              </div>

              {/* Timeline Records Table */}
              <div className="table-card">
                <div className="table-responsive">
                  <table className="members-table member-timeline-table">
                    <thead>
                      <tr>
                        <th style={{ width: '48px' }}>#</th>
                        <th>Attendance Date</th>
                        <th>Service Type</th>
                        <th>Status</th>
                        <th>Notes / Reason</th>
                        <th>Recorded By</th>
                      </tr>
                    </thead>
                    <tbody>
                      {memberSummary.history.length === 0 ? (
                        <tr>
                          <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                            No attendance records recorded for this member yet.
                          </td>
                        </tr>
                      ) : (
                        memberSummary.history.map((rec: AttendanceRecordResponse, index: number) => {
                          const dateFormatted = new Date(
                            rec.attendanceDate + 'T00:00:00Z',
                          ).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            timeZone: 'UTC',
                          });

                          return (
                            <tr key={rec.id} className="member-row">
                              <td className="cell-index">{index + 1}</td>
                              <td>
                                <div className="timeline-date-cell">
                                  <IconCalendar size={16} stroke={1.8} className="date-icon" />
                                  <span>{dateFormatted}</span>
                                </div>
                              </td>
                              <td>
                                <span className="service-type-badge">
                                  {rec.attendanceType.replace(/_/g, ' ')}
                                </span>
                              </td>
                              <td>
                                <span className={`status-pill status-${rec.status.toLowerCase()}`}>
                                  {rec.status}
                                </span>
                              </td>
                              <td className="cell-notes">{rec.notes || '—'}</td>
                              <td>
                                <span className="recorder-text">
                                  {rec.recordedBy
                                    ? `${rec.recordedBy.firstName} ${rec.recordedBy.lastName}`
                                    : 'Admin'}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
