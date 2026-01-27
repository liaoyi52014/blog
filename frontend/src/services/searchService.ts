import request from '../utils/request';
import type { ApiResponse } from './types';

export const searchService = {
  vectorSearch: <T = unknown>(query: string, limit = 10, threshold = 0.7) =>
    request.post<ApiResponse<T>>('/api/search/vector', { query, limit, threshold }),

  hybridSearch: <T = unknown>(query: string, limit = 10, threshold = 0.7) =>
    request.post<ApiResponse<T>>('/api/search/hybrid', { query, limit, threshold }),

  webSearch: <T = unknown>(query: string) =>
    request.post<ApiResponse<T>>('/api/search/web', { query, limit: 5, threshold: 0.7 })
};