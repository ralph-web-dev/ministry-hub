import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface CreateAuditLogParams {
  churchId?: string | null;
  organizationId?: string | null;
  userId?: string | null;
  action: string;
  module: string;
  recordId?: string | null;
  details?: Record<string, any> | null;
}

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(params: CreateAuditLogParams): Promise<any> {
    try {
      return await this.prisma.auditLog.create({
        data: {
          churchId: params.churchId || undefined,
          organizationId: params.organizationId || undefined,
          userId: params.userId || undefined,
          action: params.action,
          module: params.module,
          recordId: params.recordId || undefined,
          details: params.details ? (params.details as any) : undefined,
        },
      });
    } catch (error) {
      // Non-blocking error logging for audit trails
      console.error('[AuditService] Failed to record audit log:', error);
      return null;
    }
  }
}
