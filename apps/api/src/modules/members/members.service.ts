import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma, MembershipStatus, BaptismStatus } from '@ministryhub/database';
import * as crypto from 'crypto';

@Injectable()
export class MembersService {
  constructor(private prisma: PrismaService) {}

  async findAll(
    churchId: string,
    query?: { search?: string; status?: MembershipStatus; baptismStatus?: BaptismStatus }
  ) {
    const where: Prisma.MemberWhereInput = {
      churchId,
      ...(query?.status && { membershipStatus: query.status }),
      ...(query?.baptismStatus && { baptismStatus: query.baptismStatus }),
      ...(query?.search && {
        OR: [
          { firstName: { contains: query.search, mode: 'insensitive' } },
          { lastName: { contains: query.search, mode: 'insensitive' } },
          { memberId: { contains: query.search, mode: 'insensitive' } },
        ],
      }),
    };

    return this.prisma.member.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(churchId: string, id: string) {
    const member = await this.prisma.member.findFirst({
      where: { id, churchId },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    return member;
  }

  async create(churchId: string, data: any) {
    // Generate a secure short ID e.g., M-XXXXX
    const shortId = crypto.randomBytes(3).toString('hex').toUpperCase();
    const memberId = `MEM-${shortId}`;

    return this.prisma.member.create({
      data: {
        ...data,
        churchId,
        memberId,
      },
    });
  }

  async update(churchId: string, id: string, data: any) {
    await this.findOne(churchId, id); // Ensure exists

    return this.prisma.member.update({
      where: { id },
      data,
    });
  }

  async archive(churchId: string, id: string) {
    await this.findOne(churchId, id);

    return this.prisma.member.update({
      where: { id },
      data: { membershipStatus: MembershipStatus.ARCHIVED },
    });
  }
}
