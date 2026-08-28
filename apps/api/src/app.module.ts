import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { MembersModule } from './modules/members/members.module';
import { UploadModule } from './modules/upload/upload.module';

@Module({
  imports: [PrismaModule, AuthModule, MembersModule, UploadModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
