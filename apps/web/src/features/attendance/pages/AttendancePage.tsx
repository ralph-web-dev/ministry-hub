import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { IconCalendarCheck } from '@tabler/icons-react';
import { TakeAttendanceTab } from '../components/TakeAttendanceTab';
import { AttendanceHistoryTab } from '../components/AttendanceHistoryTab';
import { MemberHistoryTab } from '../components/MemberHistoryTab';
import { AttendanceReportsTab } from '../components/AttendanceReportsTab';
import { ToggleGroup } from '@/components/ui';
import './AttendancePage.scss';

export type AttendanceSubTab = 'take' | 'history' | 'member' | 'reports';

export function AttendancePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab') as AttendanceSubTab) || 'take';

  const [activeTab, setActiveTab] = useState<AttendanceSubTab>(initialTab);
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');

  const handleTabChange = (tab: AttendanceSubTab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const handleViewMemberHistory = (memberId: string) => {
    setSelectedMemberId(memberId);
    handleTabChange('member');
  };

  const handleSelectSessionToEdit = () => {
    handleTabChange('take');
  };

  return (
    <div className="attendance-page">
      {/* ================= HEADER CONTROL BAR ================= */}
      <div className="attendance-header">
        <div className="header-left-group">
          <div className="page-title-wrap">
            <IconCalendarCheck size={24} stroke={1.8} className="title-icon" />
            <h1 className="page-title">Attendance Management</h1>
          </div>

          {/* Sub-Tabs ToggleGroup */}
          <div className="attendance-tab-toggle-wrapper">
            <ToggleGroup
              value={activeTab}
              onChange={(v) => handleTabChange(v as AttendanceSubTab)}
              options={[
                { value: 'take', label: 'Take Attendance' },
                { value: 'history', label: 'Attendance History' },
                { value: 'member', label: 'Member History' },
                { value: 'reports', label: 'Reports & Export' },
              ]}
            />
          </div>
        </div>
      </div>

      {/* ================= ACTIVE TAB CONTENT ================= */}
      <div className="attendance-content-wrapper">
        {activeTab === 'take' && (
          <TakeAttendanceTab onViewMemberHistory={handleViewMemberHistory} />
        )}

        {activeTab === 'history' && (
          <AttendanceHistoryTab
            onSelectSessionToEdit={handleSelectSessionToEdit}
            onViewMemberHistory={handleViewMemberHistory}
          />
        )}

        {activeTab === 'member' && (
          <MemberHistoryTab initialMemberId={selectedMemberId} />
        )}

        {activeTab === 'reports' && <AttendanceReportsTab />}
      </div>
    </div>
  );
}
