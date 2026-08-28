import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const createMemberSchema = z.object({
  firstName: z.string().min(1),
  middleName: z.string().optional(),
  lastName: z.string().min(1),
  suffix: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  phoneNumber: z.string().optional(),
  dateOfBirth: z.string().datetime().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  address: z.string().optional(),
  membershipStatus: z.enum(['ACTIVE', 'INACTIVE', 'TRANSFERRED', 'ARCHIVED']).optional(),
  dateJoined: z.string().datetime().optional(),
  baptismStatus: z.enum(['BAPTIZED', 'NOT_BAPTIZED']).optional(),
  baptismDate: z.string().datetime().optional(),
  profilePictureUrl: z.string().optional(),
});

export type CreateMemberInput = z.infer<typeof createMemberSchema>;

export const updateMemberSchema = createMemberSchema.partial();
export type UpdateMemberInput = z.infer<typeof updateMemberSchema>;
