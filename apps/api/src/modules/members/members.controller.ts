import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { MembersService } from './members.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { MembershipStatus, BaptismStatus } from '@ministryhub/database';

@Controller('members')
@UseGuards(JwtAuthGuard)
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  @Get()
  findAll(
    @Request() req,
    @Query('search') search?: string,
    @Query('status') status?: MembershipStatus,
    @Query('baptismStatus') baptismStatus?: BaptismStatus,
  ) {
    return this.membersService.findAll(req.user.churchId, {
      search,
      status,
      baptismStatus,
    });
  }

  @Get(':id')
  findOne(@Request() req, @Param('id') id: string) {
    return this.membersService.findOne(req.user.churchId, id);
  }

  @Post()
  create(@Request() req, @Body() createMemberDto: any) {
    return this.membersService.create(req.user.churchId, createMemberDto);
  }

  @Patch(':id')
  update(
    @Request() req,
    @Param('id') id: string,
    @Body() updateMemberDto: any,
  ) {
    return this.membersService.update(req.user.churchId, id, updateMemberDto);
  }

  @Patch(':id/archive')
  archive(@Request() req, @Param('id') id: string) {
    return this.membersService.archive(req.user.churchId, id);
  }
}
