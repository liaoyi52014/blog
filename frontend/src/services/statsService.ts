import request from '../utils/request';

export type DashboardStats = {
    knowledgeCount: number;
    articleCount: number;
    newsCount: number;
};

type CountResponse = {
    code: number;
    message: string;
    data: unknown[];
};

export const statsService = {
    getDashboardStats: async (): Promise<DashboardStats> => {
        // Fetch all counts in parallel - request.get returns ApiResponse directly (not wrapped in axios.data)
        const [knowledgeResp, articlesResp, newsResp] = await Promise.all([
            request.get<CountResponse>('/api/knowledge'),
            request.get<CountResponse>('/api/articles/published'),
            request.get<CountResponse>('/api/news/featured')
        ]);

        return {
            knowledgeCount: Array.isArray(knowledgeResp?.data) ? knowledgeResp.data.length : 0,
            articleCount: Array.isArray(articlesResp?.data) ? articlesResp.data.length : 0,
            newsCount: Array.isArray(newsResp?.data) ? newsResp.data.length : 0
        };
    }
};
