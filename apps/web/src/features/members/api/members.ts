import { api } from '@/lib/api';
import { CreateMemberInput, UpdateMemberInput } from '@ministryhub/validation';
export type MembershipStatus = 'ACTIVE' | 'INACTIVE' | 'TRANSFERRED' | 'ARCHIVED';
export type BaptismStatus = 'BAPTIZED' | 'NOT_BAPTIZED';
export interface MemberResponse {
  id: string;
  memberId: string;
  churchId: string;
  profilePictureUrl: string | null;
  firstName: string;
  middleName: string | null;
  lastName: string;
  suffix: string | null;
  email: string | null;
  phoneNumber: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  address: string | null;
  membershipStatus: MembershipStatus;
  dateJoined: string | null;
  baptismStatus: BaptismStatus;
  baptismDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export const membersApi = {
  getMembers: async (params?: { search?: string; status?: string; baptismStatus?: string }) => {
    const response = await api.get<MemberResponse[]>('/members', { params });
    return response.data;
  },

  getMember: async (id: string) => {
    const response = await api.get<MemberResponse>(`/members/${id}`);
    return response.data;
  },

  createMember: async (data: CreateMemberInput) => {
    const response = await api.post<MemberResponse>('/members', data);
    return response.data;
  },

  updateMember: async (id: string, data: UpdateMemberInput) => {
    const response = await api.patch<MemberResponse>(`/members/${id}`, data);
    return response.data;
  },

  archiveMember: async (id: string) => {
    const response = await api.patch<MemberResponse>(`/members/${id}/archive`);
    return response.data;
  },

  uploadProfilePicture: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post<{ url: string }>('/upload/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.url;
  }
};
