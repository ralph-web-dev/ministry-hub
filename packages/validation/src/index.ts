import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().trim().min(1, 'Email address is required').email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const createMemberSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required'),
  middleName: z.string().trim().optional(),
  lastName: z.string().trim().min(1, 'Last name is required'),
  suffix: z.string().trim().optional(),
  email: z
    .string()
    .trim()
    .email('Please enter a valid email address')
    .optional()
    .or(z.literal('')),
  phoneNumber: z.string().trim().min(1, 'Contact number is required'),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  address: z.string().trim().min(1, 'Residential address is required'),
  membershipStatus: z.enum(['ACTIVE', 'INACTIVE', 'TRANSFERRED', 'ARCHIVED']).optional(),
  dateJoined: z.string().datetime().optional(),
  baptismStatus: z.enum(['BAPTIZED', 'NOT_BAPTIZED']).optional(),
  baptismDate: z.string().datetime().optional(),
  profilePictureUrl: z.string().optional(),
});

export type CreateMemberInput = z.infer<typeof createMemberSchema>;

export const updateMemberSchema = createMemberSchema.partial();
export type UpdateMemberInput = z.infer<typeof updateMemberSchema>;

export const attendanceStatusEnum = z.enum(['PRESENT', 'ABSENT', 'EXCUSED']);
export const attendanceTypeEnum = z.enum([
  'SUNDAY_WORSHIP',
  'MIDWEEK_SERVICE',
  'SPECIAL_EVENT',
  'YOUTH_FELLOWSHIP',
  'OUTREACH',
  'OTHER',
]);

export const recordAttendanceSchema = z.object({
  memberId: z.string().uuid('Invalid member ID'),
  attendanceDate: z.string().min(1, 'Attendance date is required'),
  attendanceType: attendanceTypeEnum.default('SUNDAY_WORSHIP'),
  status: attendanceStatusEnum.default('PRESENT'),
  eventId: z.string().uuid().optional().nullable(),
  notes: z.string().trim().max(500, 'Notes cannot exceed 500 characters').optional().nullable(),
});
export type RecordAttendanceInput = z.infer<typeof recordAttendanceSchema>;

export const bulkAttendanceItemSchema = z.object({
  memberId: z.string().uuid('Invalid member ID'),
  status: attendanceStatusEnum,
  notes: z.string().trim().max(500).optional().nullable(),
});
export type BulkAttendanceItemInput = z.infer<typeof bulkAttendanceItemSchema>;

export const bulkAttendanceSchema = z.object({
  attendanceDate: z.string().min(1, 'Attendance date is required'),
  attendanceType: attendanceTypeEnum.default('SUNDAY_WORSHIP'),
  eventId: z.string().uuid().optional().nullable(),
  records: z.array(bulkAttendanceItemSchema).min(1, 'At least one attendance record is required'),
});
export type BulkAttendanceInput = z.infer<typeof bulkAttendanceSchema>;

export const attendanceFilterSchema = z.object({
  date: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  attendanceType: attendanceTypeEnum.optional(),
  status: attendanceStatusEnum.optional(),
  memberId: z.string().uuid().optional(),
  search: z.string().optional(),
  eventId: z.string().uuid().optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
});
export type AttendanceFilterInput = z.infer<typeof attendanceFilterSchema>;

