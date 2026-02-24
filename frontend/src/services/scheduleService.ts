import request from '../utils/request';
import type { ApiResponse } from './types';

export type Schedule = {
  id: number;
  title: string;
  description?: string;
  scheduleDate: string;
  endDate?: string;
  projectId?: number;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';
  createdAt: string;
  updatedAt: string;
};

export type ScheduleCreatePayload = {
  title: string;
  description?: string;
  scheduleDate: string;
  endDate?: string;
  projectId?: number;
  priority?: string;
};

export const scheduleService = {
  getByDate: (date: string) =>
    request.get<ApiResponse<Schedule[]>>(`/api/schedules?date=${date}`),

  getTodayPending: () =>
    request.get<ApiResponse<Schedule[]>>('/api/schedules/today'),

  getByDateRange: (start: string, end: string) =>
    request.get<ApiResponse<Schedule[]>>(`/api/schedules/range?start=${start}&end=${end}`),

  getByProject: (projectId: number) =>
    request.get<ApiResponse<Schedule[]>>(`/api/schedules/project/${projectId}`),

  getActiveByProject: (projectId: number) =>
    request.get<ApiResponse<Schedule[]>>(`/api/schedules/project/${projectId}/active`),

  getById: (id: number) =>
    request.get<ApiResponse<Schedule>>(`/api/schedules/${id}`),

  create: (payload: ScheduleCreatePayload) =>
    request.post<ApiResponse<Schedule>>('/api/schedules', payload),

  updateStatus: (id: number, status: string) =>
    request.patch<ApiResponse<Schedule>>(`/api/schedules/${id}/status`, { status }),

  update: (id: number, payload: Partial<Schedule>) =>
    request.put<ApiResponse<Schedule>>(`/api/schedules/${id}`, payload),

  delete: (id: number) =>
    request.delete<ApiResponse<{ deleted: boolean }>>(`/api/schedules/${id}`)
};
