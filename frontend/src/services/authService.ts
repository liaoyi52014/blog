import request from '../utils/request';

export type AuthStatus = {
    hasAdmin: boolean;
    message: string;
};

export type UserInfo = {
    username: string;
    role: string;
    createdAt: string;
};

type AuthResponse = {
    code: number;
    message: string;
    data: {
        success?: boolean;
        message?: string;
        hasAdmin?: boolean;
        username?: string;
        role?: string;
        createdAt?: string;
    };
};

export const authService = {
    /**
     * Check if admin account exists
     */
    getStatus: async (): Promise<AuthStatus> => {
        const resp = await request.get<AuthResponse>('/api/auth/status');
        return {
            hasAdmin: resp.data?.hasAdmin ?? false,
            message: resp.data?.message ?? ''
        };
    },

    /**
     * Setup admin account (first time)
     */
    setup: async (username: string, password: string): Promise<boolean> => {
        const resp = await request.post<AuthResponse>('/api/auth/setup', { username, password });
        return resp.data?.success ?? false;
    },

    /**
     * Login with username and password
     */
    login: async (username: string, password: string): Promise<boolean> => {
        const resp = await request.post<AuthResponse>('/api/auth/login', { username, password });
        return resp.data?.success ?? false;
    },

    /**
     * Logout
     */
    logout: async (): Promise<void> => {
        await request.post<AuthResponse>('/api/auth/logout');
    },

    /**
     * Get current user info
     */
    getCurrentUser: async (): Promise<UserInfo | null> => {
        try {
            const resp = await request.get<AuthResponse>('/api/auth/me');
            if (resp.data?.username) {
                return {
                    username: resp.data.username,
                    role: resp.data.role ?? 'admin',
                    createdAt: resp.data.createdAt ?? ''
                };
            }
            return null;
        } catch {
            return null;
        }
    }
};
