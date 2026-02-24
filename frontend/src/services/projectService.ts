import request from '../utils/request';
import type { ApiResponse } from './types';

export type Project = {
  id: number;
  name: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  status: 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
  color?: string;
  createdAt: string;
  updatedAt: string;
};

export type ProjectCreatePayload = {
  name: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  color?: string;
};

export const projectService = {
  getAll: () =>
    request.get<ApiResponse<Project[]>>('/api/projects'),

  getActive: () =>
    request.get<ApiResponse<Project[]>>('/api/projects/active'),

  getById: (id: number) =>
    request.get<ApiResponse<Project>>(`/api/projects/${id}`),

  create: (payload: ProjectCreatePayload) =>
    request.post<ApiResponse<Project>>('/api/projects', payload),

  update: (id: number, payload: Partial<Project>) =>
    request.put<ApiResponse<Project>>(`/api/projects/${id}`, payload),

  updateStatus: (id: number, status: string) =>
    request.patch<ApiResponse<Project>>(`/api/projects/${id}/status`, { status }),

  delete: (id: number) =>
    request.delete<ApiResponse<{ deleted: boolean }>>(`/api/projects/${id}`)
};
