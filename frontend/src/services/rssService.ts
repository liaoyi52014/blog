import request from '../utils/request';
import type { ApiResponse } from './types';

export type RssFeedImportResult = {
  sourceFile?: string;
  total?: number;
  created?: number;
  updated?: number;
  skipped?: number;
  errors?: string[];
};

export const rssService = {
  importFeeds: <T = RssFeedImportResult>(formData: FormData) =>
    request.post<ApiResponse<T>>('/api/rss/feeds/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  listFeeds: <T = unknown[]>() => request.get<ApiResponse<T>>('/api/rss/feeds')
};
