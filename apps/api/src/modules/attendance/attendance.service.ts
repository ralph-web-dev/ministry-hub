import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AttendanceExportService } from './attendance-export.service';
import {
  AttendanceStatus,
  AttendanceType,
  MembershipStatus,
  Prisma,
} from '@ministryhub/database';
import {
  BulkAttendanceInput,
  RecordAttendanceInput,
  AttendanceFilterInput,
} from '@ministryhub/validation';

@Injectable()
export class AttendanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly exportService: AttendanceExportService,
  ) {}

  /**
   * Normalizes any ISO string / date input to UTC midnight (00:00:00.000Z)
   */
  private normalizeDate(dateInput: string | Date): Date {
    const raw = typeof dateInput === 'string' ? dateInput.split('T')[0] : dateInput.toISOString().split('T')[0];
    const [year, month, day] = raw.split('-').map(Number);
    if (!year || !month || !day) {
      throw new BadRequestException('Invalid date format. Expected YYYY-MM-DD');
    }
    return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
  }

  /**
   * Retrieves the active members roster for a given attendance session,
   * merged with any already recorded attendance statuses for that date.
   */
  async getRosterForSession(
    churchId: string,
    rawDate: string,
    attendanceType: AttendanceType = AttendanceType.SUNDAY_WORSHIP,
    eventId?: string,
  ) {
    const sessionDate = this.normalizeDate(rawDate);

    // 1. Fetch all ACTIVE members for this church (Single Source of Truth)
    const activeMembers = await this.prisma.member.findMany({
      where: {
        churchId,
        membershipStatus: MembershipStatus.ACTIVE,
      },
      orderBy: [
        { lastName: 'asc' },
        { firstName: 'asc' },
      ],
      select: {
        id: true,
        memberId: true,
        firstName: true,
        lastName: true,
        profilePictureUrl: true,
        phoneNumber: true,
        email: true,
        membershipStatus: true,
      },
    });

    // 2. Fetch any existing attendance records for this session
    const existingRecords = await this.prisma.attendanceRecord.findMany({
      where: {
        churchId,
        attendanceDate: sessionDate,
        attendanceType,
        ...(eventId ? { eventId } : {}),
      },
      include: {
        member: {
          select: {
            id: true,
            memberId: true,
            firstName: true,
            lastName: true,
            profilePictureUrl: true,
            phoneNumber: true,
            email: true,
            membershipStatus: true,
          },
        },
      },
    });

    const recordMap = new Map<string, (typeof existingRecords)[0]>();
    existingRecords.forEach((rec) => {
      recordMap.set(rec.memberId, rec);
    });

    // 3. Build roster: Active members + any historical attendee in this session
    const rosterMemberIds = new Set<string>();
    const roster: Array<{
      memberId: string;
      memberCode: string;
      firstName: string;
      lastName: string;
      profilePictureUrl: string | null;
      phoneNumber: string | null;
      email: string | null;
      membershipStatus: string;
      recordId?: string;
      status?: AttendanceStatus;
      notes?: string | null;
      recordedAt?: string;
    }> = [];

    // Add active members
    for (const member of activeMembers) {
      rosterMemberIds.add(member.id);
      const existing = recordMap.get(member.id);

      roster.push({
        memberId: member.id,
        memberCode: member.memberId,
        firstName: member.firstName,
        lastName: member.lastName,
        profilePictureUrl: member.profilePictureUrl,
        phoneNumber: member.phoneNumber,
        email: member.email,
        membershipStatus: member.membershipStatus,
        recordId: existing?.id,
        status: existing?.status,
        notes: existing?.notes,
        recordedAt: existing?.updatedAt ? existing.updatedAt.toISOString() : undefined,
      });
    }

    // Preserve any existing record for members whose status later changed
    for (const rec of existingRecords) {
      if (!rosterMemberIds.has(rec.memberId) && rec.member) {
        rosterMemberIds.add(rec.memberId);
        roster.push({
          memberId: rec.member.id,
          memberCode: rec.member.memberId,
          firstName: rec.member.firstName,
          lastName: rec.member.lastName,
          profilePictureUrl: rec.member.profilePictureUrl,
          phoneNumber: rec.member.phoneNumber,
          email: rec.member.email,
          membershipStatus: rec.member.membershipStatus,
          recordId: rec.id,
          status: rec.status,
          notes: rec.notes,
          recordedAt: rec.updatedAt.toISOString(),
        });
      }
    }

    // Compute session summary
    const recordedRecords = Array.from(recordMap.values());
    const presentCount = recordedRecords.filter((r) => r.status === AttendanceStatus.PRESENT).length;
    const absentCount = recordedRecords.filter((r) => r.status === AttendanceStatus.ABSENT).length;
    const excusedCount = recordedRecords.filter((r) => r.status === AttendanceStatus.EXCUSED).length;
    const totalRecorded = recordedRecords.length;
    const attendancePercentage = totalRecorded > 0 ? Math.round((presentCount / totalRecorded) * 100) : 0;

    return {
      session: {
        date: sessionDate.toISOString().split('T')[0],
        attendanceType,
        eventId: eventId || null,
        totalActiveMembers: activeMembers.length,
        totalRoster: roster.length,
        totalRecorded,
        presentCount,
        absentCount,
        excusedCount,
        attendancePercentage,
        isRecorded: totalRecorded > 0,
      },
      roster,
    };
  }

  /**
   * Bulk save or update attendance for an entire session in an atomic transaction.
   */
  async bulkSaveAttendance(
    churchId: string,
    userId: string,
    input: BulkAttendanceInput,
  ) {
    const sessionDate = this.normalizeDate(input.attendanceDate);
    const attendanceType = (input.attendanceType as AttendanceType) || AttendanceType.SUNDAY_WORSHIP;

    if (!input.records || input.records.length === 0) {
      throw new BadRequestException('At least one attendance record is required.');
    }

    const memberIds = input.records.map((r) => r.memberId);

    // Verify all member IDs belong to this church
    const validMembers = await this.prisma.member.findMany({
      where: {
        id: { in: memberIds },
        churchId,
      },
      select: { id: true },
    });

    const validIdSet = new Set(validMembers.map((m) => m.id));
    const invalidIds = memberIds.filter((id) => !validIdSet.has(id));

    if (invalidIds.length > 0) {
      throw new BadRequestException(`Invalid member IDs for this church: ${invalidIds.slice(0, 3).join(', ')}`);
    }

    // Execute atomic batch upsert
    const operations = input.records.map((rec) => {
      const status = rec.status as AttendanceStatus;
      return this.prisma.attendanceRecord.upsert({
        where: {
          churchId_memberId_attendanceDate_attendanceType: {
            churchId,
            memberId: rec.memberId,
            attendanceDate: sessionDate,
            attendanceType,
          },
        },
        create: {
          churchId,
          memberId: rec.memberId,
          attendanceDate: sessionDate,
          attendanceType,
          status,
          eventId: input.eventId || null,
          notes: rec.notes || null,
          recordedById: userId,
        },
        update: {
          status,
          eventId: input.eventId || null,
          notes: rec.notes || null,
          recordedById: userId,
        },
      });
    });

    const savedRecords = await this.prisma.$transaction(operations);

    // Audit log
    await this.auditService.log({
      churchId,
      userId,
      action: 'BULK_ATTENDANCE_SAVED',
      module: 'ATTENDANCE',
      recordId: `${sessionDate.toISOString().split('T')[0]}_${attendanceType}`,
      details: {
        date: sessionDate.toISOString().split('T')[0],
        attendanceType,
        eventId: input.eventId,
        recordsCount: savedRecords.length,
        presentCount: savedRecords.filter((r) => r.status === AttendanceStatus.PRESENT).length,
        absentCount: savedRecords.filter((r) => r.status === AttendanceStatus.ABSENT).length,
        excusedCount: savedRecords.filter((r) => r.status === AttendanceStatus.EXCUSED).length,
      },
    });

    const presentCount = savedRecords.filter((r) => r.status === AttendanceStatus.PRESENT).length;
    const absentCount = savedRecords.filter((r) => r.status === AttendanceStatus.ABSENT).length;
    const excusedCount = savedRecords.filter((r) => r.status === AttendanceStatus.EXCUSED).length;

    return {
      message: 'Attendance saved successfully',
      date: sessionDate.toISOString().split('T')[0],
      attendanceType,
      totalSaved: savedRecords.length,
      presentCount,
      absentCount,
      excusedCount,
      attendancePercentage: Math.round((presentCount / savedRecords.length) * 100),
    };
  }

  /**
   * Create or update a single member attendance record.
   */
  async recordAttendance(
    churchId: string,
    userId: string,
    input: RecordAttendanceInput,
  ) {
    const sessionDate = this.normalizeDate(input.attendanceDate);
    const attendanceType = (input.attendanceType as AttendanceType) || AttendanceType.SUNDAY_WORSHIP;
    const status = (input.status as AttendanceStatus) || AttendanceStatus.PRESENT;

    // Verify member belongs to church
    const member = await this.prisma.member.findFirst({
      where: { id: input.memberId, churchId },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    const record = await this.prisma.attendanceRecord.upsert({
      where: {
        churchId_memberId_attendanceDate_attendanceType: {
          churchId,
          memberId: input.memberId,
          attendanceDate: sessionDate,
          attendanceType,
        },
      },
      create: {
        churchId,
        memberId: input.memberId,
        attendanceDate: sessionDate,
        attendanceType,
        status,
        eventId: input.eventId || null,
        notes: input.notes || null,
        recordedById: userId,
      },
      update: {
        status,
        eventId: input.eventId || null,
        notes: input.notes || null,
        recordedById: userId,
      },
      include: {
        member: true,
        recordedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    await this.auditService.log({
      churchId,
      userId,
      action: 'ATTENDANCE_RECORDED',
      module: 'ATTENDANCE',
      recordId: record.id,
      details: {
        memberId: member.id,
        memberName: `${member.firstName} ${member.lastName}`,
        date: sessionDate.toISOString().split('T')[0],
        status,
      },
    });

    return record;
  }

  /**
   * Retrieves summary list of all attendance sessions.
   */
  async getSessions(
    churchId: string,
    query?: { startDate?: string; endDate?: string; attendanceType?: string; eventId?: string },
  ) {
    const where: Prisma.AttendanceRecordWhereInput = {
      churchId,
      ...(query?.attendanceType && { attendanceType: query.attendanceType as AttendanceType }),
      ...(query?.eventId && { eventId: query.eventId }),
      ...(query?.startDate && query?.endDate && {
        attendanceDate: {
          gte: this.normalizeDate(query.startDate),
          lte: this.normalizeDate(query.endDate),
        },
      }),
      ...(query?.startDate && !query?.endDate && {
        attendanceDate: { gte: this.normalizeDate(query.startDate) },
      }),
      ...(!query?.startDate && query?.endDate && {
        attendanceDate: { lte: this.normalizeDate(query.endDate) },
      }),
    };

    const records = await this.prisma.attendanceRecord.findMany({
      where,
      orderBy: { attendanceDate: 'desc' },
      include: {
        recordedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Group records by unique session key: YYYY-MM-DD|attendanceType|eventId
    const sessionMap = new Map<
      string,
      {
        date: string;
        attendanceType: AttendanceType;
        eventId: string | null;
        totalMembers: number;
        presentCount: number;
        absentCount: number;
        excusedCount: number;
        recordedByName: string | null;
        lastUpdated: string;
      }
    >();

    for (const rec of records) {
      const dateStr = rec.attendanceDate.toISOString().split('T')[0];
      const key = `${dateStr}|${rec.attendanceType}|${rec.eventId || 'none'}`;

      if (!sessionMap.has(key)) {
        const recordedByName = rec.recordedBy
          ? `${rec.recordedBy.firstName} ${rec.recordedBy.lastName}`.trim()
          : null;

        sessionMap.set(key, {
          date: dateStr,
          attendanceType: rec.attendanceType,
          eventId: rec.eventId,
          totalMembers: 0,
          presentCount: 0,
          absentCount: 0,
          excusedCount: 0,
          recordedByName,
          lastUpdated: rec.updatedAt.toISOString(),
        });
      }

      const item = sessionMap.get(key)!;
      item.totalMembers += 1;
      if (rec.status === AttendanceStatus.PRESENT) item.presentCount += 1;
      else if (rec.status === AttendanceStatus.ABSENT) item.absentCount += 1;
      else if (rec.status === AttendanceStatus.EXCUSED) item.excusedCount += 1;

      if (new Date(rec.updatedAt) > new Date(item.lastUpdated)) {
        item.lastUpdated = rec.updatedAt.toISOString();
      }
    }

    const sessions = Array.from(sessionMap.values()).map((s) => ({
      ...s,
      attendancePercentage: s.totalMembers > 0 ? Math.round((s.presentCount / s.totalMembers) * 100) : 0,
    }));

    return sessions;
  }

  /**
   * Retrieves individual member attendance history and aggregated statistics.
   */
  async getMemberAttendanceHistory(
    churchId: string,
    memberId: string,
    query?: { startDate?: string; endDate?: string },
  ) {
    const member = await this.prisma.member.findFirst({
      where: { id: memberId, churchId },
      select: {
        id: true,
        memberId: true,
        firstName: true,
        lastName: true,
        profilePictureUrl: true,
        email: true,
        phoneNumber: true,
        membershipStatus: true,
      },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    const where: Prisma.AttendanceRecordWhereInput = {
      churchId,
      memberId,
      ...(query?.startDate && query?.endDate && {
        attendanceDate: {
          gte: this.normalizeDate(query.startDate),
          lte: this.normalizeDate(query.endDate),
        },
      }),
      ...(query?.startDate && !query?.endDate && {
        attendanceDate: { gte: this.normalizeDate(query.startDate) },
      }),
      ...(!query?.startDate && query?.endDate && {
        attendanceDate: { lte: this.normalizeDate(query.endDate) },
      }),
    };

    const history = await this.prisma.attendanceRecord.findMany({
      where,
      orderBy: { attendanceDate: 'desc' },
      include: {
        recordedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    const totalSessions = history.length;
    const presentCount = history.filter((r) => r.status === AttendanceStatus.PRESENT).length;
    const absentCount = history.filter((r) => r.status === AttendanceStatus.ABSENT).length;
    const excusedCount = history.filter((r) => r.status === AttendanceStatus.EXCUSED).length;
    const attendancePercentage = totalSessions > 0 ? Math.round((presentCount / totalSessions) * 100) : 0;

    return {
      member,
      stats: {
        totalSessions,
        presentCount,
        absentCount,
        excusedCount,
        attendancePercentage,
      },
      history: history.map((rec) => ({
        id: rec.id,
        churchId: rec.churchId,
        memberId: rec.memberId,
        attendanceDate: rec.attendanceDate.toISOString().split('T')[0],
        attendanceType: rec.attendanceType,
        status: rec.status,
        eventId: rec.eventId,
        notes: rec.notes,
        recordedById: rec.recordedById,
        recordedBy: rec.recordedBy,
        createdAt: rec.createdAt.toISOString(),
        updatedAt: rec.updatedAt.toISOString(),
      })),
    };
  }

  /**
   * Retrieves detailed attendance records with flexible filtering and search.
   */
  async getDetailedRecords(churchId: string, filter: AttendanceFilterInput) {
    const where: Prisma.AttendanceRecordWhereInput = {
      churchId,
      ...(filter.status && { status: filter.status as AttendanceStatus }),
      ...(filter.attendanceType && { attendanceType: filter.attendanceType as AttendanceType }),
      ...(filter.memberId && { memberId: filter.memberId }),
      ...(filter.eventId && { eventId: filter.eventId }),
      ...(filter.date && { attendanceDate: this.normalizeDate(filter.date) }),
      ...(filter.startDate && filter.endDate && {
        attendanceDate: {
          gte: this.normalizeDate(filter.startDate),
          lte: this.normalizeDate(filter.endDate),
        },
      }),
      ...(filter.startDate && !filter.endDate && {
        attendanceDate: { gte: this.normalizeDate(filter.startDate) },
      }),
      ...(!filter.startDate && filter.endDate && {
        attendanceDate: { lte: this.normalizeDate(filter.endDate) },
      }),
      ...(filter.search && {
        member: {
          OR: [
            { firstName: { contains: filter.search, mode: 'insensitive' } },
            { lastName: { contains: filter.search, mode: 'insensitive' } },
            { memberId: { contains: filter.search, mode: 'insensitive' } },
          ],
        },
      }),
    };

    const take = filter.limit || 50;
    const skip = filter.page ? (filter.page - 1) * take : 0;

    const [total, records] = await Promise.all([
      this.prisma.attendanceRecord.count({ where }),
      this.prisma.attendanceRecord.findMany({
        where,
        take,
        skip,
        orderBy: [
          { attendanceDate: 'desc' },
          { member: { lastName: 'asc' } },
        ],
        include: {
          member: {
            select: {
              id: true,
              memberId: true,
              firstName: true,
              lastName: true,
              profilePictureUrl: true,
              email: true,
              phoneNumber: true,
              membershipStatus: true,
            },
          },
          recordedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      }),
    ]);

    return {
      total,
      page: filter.page || 1,
      limit: take,
      records: records.map((rec) => ({
        id: rec.id,
        churchId: rec.churchId,
        memberId: rec.memberId,
        attendanceDate: rec.attendanceDate.toISOString().split('T')[0],
        attendanceType: rec.attendanceType,
        status: rec.status,
        eventId: rec.eventId,
        notes: rec.notes,
        recordedById: rec.recordedById,
        recordedBy: rec.recordedBy,
        member: rec.member,
        createdAt: rec.createdAt.toISOString(),
        updatedAt: rec.updatedAt.toISOString(),
      })),
    };
  }

  /**
   * Generates a CSV stream for filtered attendance records.
   */
  async exportCsv(churchId: string, userId: string, filter: AttendanceFilterInput) {
    const where: Prisma.AttendanceRecordWhereInput = {
      churchId,
      ...(filter.status && { status: filter.status as AttendanceStatus }),
      ...(filter.attendanceType && { attendanceType: filter.attendanceType as AttendanceType }),
      ...(filter.memberId && { memberId: filter.memberId }),
      ...(filter.eventId && { eventId: filter.eventId }),
      ...(filter.date && { attendanceDate: this.normalizeDate(filter.date) }),
      ...(filter.startDate && filter.endDate && {
        attendanceDate: {
          gte: this.normalizeDate(filter.startDate),
          lte: this.normalizeDate(filter.endDate),
        },
      }),
      ...(filter.startDate && !filter.endDate && {
        attendanceDate: { gte: this.normalizeDate(filter.startDate) },
      }),
      ...(!filter.startDate && filter.endDate && {
        attendanceDate: { lte: this.normalizeDate(filter.endDate) },
      }),
      ...(filter.search && {
        member: {
          OR: [
            { firstName: { contains: filter.search, mode: 'insensitive' } },
            { lastName: { contains: filter.search, mode: 'insensitive' } },
            { memberId: { contains: filter.search, mode: 'insensitive' } },
          ],
        },
      }),
    };

    const records = await this.prisma.attendanceRecord.findMany({
      where,
      orderBy: [
        { attendanceDate: 'desc' },
        { member: { lastName: 'asc' } },
      ],
      include: {
        member: {
          select: {
            memberId: true,
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true,
          },
        },
        recordedBy: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    const csvContent = this.exportService.generateCsv(records);

    await this.auditService.log({
      churchId,
      userId,
      action: 'ATTENDANCE_EXPORTED_CSV',
      module: 'ATTENDANCE',
      details: {
        filters: filter,
        recordsExported: records.length,
      },
    });

    return csvContent;
  }

  /**
   * Delete all records for a given session.
   */
  async deleteSession(
    churchId: string,
    userId: string,
    rawDate: string,
    attendanceType: AttendanceType = AttendanceType.SUNDAY_WORSHIP,
    eventId?: string,
  ) {
    const sessionDate = this.normalizeDate(rawDate);

    const deleteResult = await this.prisma.attendanceRecord.deleteMany({
      where: {
        churchId,
        attendanceDate: sessionDate,
        attendanceType,
        ...(eventId ? { eventId } : {}),
      },
    });

    await this.auditService.log({
      churchId,
      userId,
      action: 'ATTENDANCE_SESSION_DELETED',
      module: 'ATTENDANCE',
      recordId: `${sessionDate.toISOString().split('T')[0]}_${attendanceType}`,
      details: {
        date: sessionDate.toISOString().split('T')[0],
        attendanceType,
        recordsDeleted: deleteResult.count,
      },
    });

    return {
      message: 'Session attendance deleted successfully',
      count: deleteResult.count,
    };
  }
}
