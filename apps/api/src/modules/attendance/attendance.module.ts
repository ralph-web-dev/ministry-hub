import { Module } from '@nestjs/common';
import { AttendanceController } from './attendance.controller';
import { AttendanceService } from './attendance.service';
import { AttendanceExportService } from './attendance-export.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [AttendanceController],
  providers: [AttendanceService, AttendanceExportService],
  exports: [AttendanceService, AttendanceExportService],
})
export class AttendanceModule {}
