import request from '../utils/request';
import type { ApiResponse } from './types';

export type ArticleCreatePayload = {
  title: string;
  content: string;
  author?: string;
  category?: string;
  tags?: string;
  summary?: string;
  publish?: boolean;
};

export const articleService = {
  getAll: <T = unknown[]>() => request.get<ApiResponse<T>>('/api/articles'),
  getPublished: <T = unknown[]>() => request.get<ApiResponse<T>>('/api/articles/published'),
  getById: <T = unknown>(id: number) => request.get<ApiResponse<T>>(`/api/articles/${id}`),
  createManual: <T = unknown>(payload: ArticleCreatePayload) =>
    request.post<ApiResponse<T>>('/api/articles/manual', payload)
};
