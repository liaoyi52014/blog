import request from '../utils/request';
import type { ApiResponse } from './types';

export const articleService = {
  getAll: <T = unknown[]>() => request.get<ApiResponse<T>>('/api/articles'),
  getPublished: <T = unknown[]>() => request.get<ApiResponse<T>>('/api/articles/published'),
  getById: <T = unknown>(id: number) => request.get<ApiResponse<T>>(`/api/articles/${id}`)
};