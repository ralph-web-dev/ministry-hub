import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  Response,
  UsePipes,
  BadRequestException,
} from '@nestjs/common';
import { Response as ExpressResponse } from 'express';
import { AttendanceService } from './attendance.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AttendanceType } from '@ministryhub/database';
import {
  bulkAttendanceSchema,
  recordAttendanceSchema,
  BulkAttendanceInput,
  RecordAttendanceInput,
  AttendanceFilterInput,
} from '@ministryhub/validation';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';

@Controller('attendance')
@UseGuards(JwtAuthGuard)
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Get('roster')
  async getRoster(
    @Request() req,
    @Query('date') date: string,
    @Query('attendanceType') attendanceType?: AttendanceType,
    @Query('eventId') eventId?: string,
  ) {
    if (!date) {
      throw new BadRequestException('Query parameter "date" is required (YYYY-MM-DD)');
    }
    return this.attendanceService.getRosterForSession(
      req.user.churchId,
      date,
      attendanceType || AttendanceType.SUNDAY_WORSHIP,
      eventId,
    );
  }

  @Post('bulk')
  @UsePipes(new ZodValidationPipe(bulkAttendanceSchema))
  async bulkSave(
    @Request() req,
    @Body() body: BulkAttendanceInput,
  ) {
    return this.attendanceService.bulkSaveAttendance(
      req.user.churchId,
      req.user.id,
      body,
    );
  }

  @Post('record')
  @UsePipes(new ZodValidationPipe(recordAttendanceSchema))
  async recordSingle(
    @Request() req,
    @Body() body: RecordAttendanceInput,
  ) {
    return this.attendanceService.recordAttendance(
      req.user.churchId,
      req.user.id,
      body,
    );
  }

  @Get('sessions')
  async getSessions(
    @Request() req,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('attendanceType') attendanceType?: string,
    @Query('eventId') eventId?: string,
  ) {
    return this.attendanceService.getSessions(req.user.churchId, {
      startDate,
      endDate,
      attendanceType,
      eventId,
    });
  }

  @Get('records')
  async getRecords(
    @Request() req,
    @Query('date') date?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('attendanceType') attendanceType?: any,
    @Query('status') status?: any,
    @Query('memberId') memberId?: string,
    @Query('search') search?: string,
    @Query('eventId') eventId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const filter: AttendanceFilterInput = {
      date,
      startDate,
      endDate,
      attendanceType,
      status,
      memberId,
      search,
      eventId,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 50,
    };

    return this.attendanceService.getDetailedRecords(req.user.churchId, filter);
  }

  @Get('member/:memberId')
  async getMemberHistory(
    @Request() req,
    @Param('memberId') memberId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.attendanceService.getMemberAttendanceHistory(
      req.user.churchId,
      memberId,
      { startDate, endDate },
    );
  }

  @Get('export/csv')
  async exportCsv(
    @Request() req,
    @Response() res: ExpressResponse,
    @Query('date') date?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('attendanceType') attendanceType?: any,
    @Query('status') status?: any,
    @Query('memberId') memberId?: string,
    @Query('search') search?: string,
    @Query('eventId') eventId?: string,
  ) {
    const filter: AttendanceFilterInput = {
      date,
      startDate,
      endDate,
      attendanceType,
      status,
      memberId,
      search,
      eventId,
    };

    const csvData = await this.attendanceService.exportCsv(
      req.user.churchId,
      req.user.id,
      filter,
    );

    const timestamp = new Date().toISOString().split('T')[0];
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="attendance-report-${timestamp}.csv"`,
    );
    return res.send(csvData);
  }

  @Delete('session')
  async deleteSession(
    @Request() req,
    @Query('date') date: string,
    @Query('attendanceType') attendanceType?: AttendanceType,
    @Query('eventId') eventId?: string,
  ) {
    if (!date) {
      throw new BadRequestException('Query parameter "date" is required (YYYY-MM-DD)');
    }
    return this.attendanceService.deleteSession(
      req.user.churchId,
      req.user.id,
      date,
      attendanceType || AttendanceType.SUNDAY_WORSHIP,
      eventId,
    );
  }
}
