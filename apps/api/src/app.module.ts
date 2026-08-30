import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { MembersModule } from './modules/members/members.module';
import { UploadModule } from './modules/upload/upload.module';
import { AttendanceModule } from './modules/attendance/attendance.module';
import { AuditModule } from './modules/audit/audit.module';

@Module({
  imports: [
    PrismaModule,
    AuditModule,
    AuthModule,
    MembersModule,
    AttendanceModule,
    UploadModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}

