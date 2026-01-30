import request from '../utils/request';
import type { ApiResponse } from './types';

export const searchService = {
  vectorSearch: <T = unknown>(query: string, limit = 10, threshold = 0.7) =>
    request.post<ApiResponse<T>>('/api/search/vector', { query, limit, threshold }),

  hybridSearch: <T = unknown>(query: string, limit = 10, threshold = 0.7) =>
    request.post<ApiResponse<T>>('/api/search/hybrid', { query, limit, threshold }),

  webSearch: <T = unknown>(query: string) =>
    request.post<ApiResponse<T>>('/api/search/web', { query, limit: 5, threshold: 0.7 }),

  // Unified search: first local, then fallback to web
  unifiedSearch: <T = unknown>(query: string, limit = 10, threshold = 0.6) =>
    request.post<ApiResponse<T>>('/api/search/unified', { query, limit, threshold }),

  // Add external content to knowledge base
  addToKnowledge: <T = unknown>(title: string, content: string, sourceUrl?: string) =>
    request.post<ApiResponse<T>>('/api/knowledge', { title, content, sourceUrl }),

  // Update existing knowledge content
  updateKnowledge: <T = unknown>(id: number, content: string) =>
    request.put<ApiResponse<T>>(`/api/knowledge/${id}`, { content })
};