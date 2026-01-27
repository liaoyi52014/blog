import request from '../utils/request';
import type { ApiResponse } from './types';

export const newsService = {
  getLatest: <T = unknown[]>() => request.get<ApiResponse<T>>('/api/news'),
  getFeatured: <T = unknown[]>() => request.get<ApiResponse<T>>('/api/news/featured')
};