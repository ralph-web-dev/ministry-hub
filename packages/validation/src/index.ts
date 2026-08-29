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
