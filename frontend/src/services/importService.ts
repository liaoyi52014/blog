import request from '../utils/request';
import type { ApiResponse } from './types';

export const importService = {
  upload: <T = unknown>(formData: FormData) =>
    request.post<ApiResponse<T>>('/api/import/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),

  getRecords: <T = unknown[]>() => request.get<ApiResponse<T>>('/api/import/records'),
  getRecord: <T = unknown>(id: number) => request.get<ApiResponse<T>>(`/api/import/records/${id}`)
};