import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { authService, type UserInfo } from '../services';

type AuthContextType = {
    user: UserInfo | null;
    isLoading: boolean;
    isLoggedIn: boolean;
    login: (username: string, password: string) => Promise<boolean>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

type AuthProviderProps = {
    children: ReactNode;
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<UserInfo | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const refreshUser = useCallback(async () => {
        try {
            const userInfo = await authService.getCurrentUser();
            setUser(userInfo);
        } catch {
            setUser(null);
        }
    }, []);

    useEffect(() => {
        const init = async () => {
            setIsLoading(true);
            await refreshUser();
            setIsLoading(false);
        };
        void init();
    }, [refreshUser]);

    const login = useCallback(async (username: string, password: string): Promise<boolean> => {
        try {
            const success = await authService.login(username, password);
            if (success) {
                await refreshUser();
            }
            return success;
        } catch {
            return false;
        }
    }, [refreshUser]);

    const logout = useCallback(async () => {
        try {
            await authService.logout();
        } catch {
            // Ignore errors
        }
        setUser(null);
    }, []);

    const value: AuthContextType = {
        user,
        isLoading,
        isLoggedIn: !!user,
        login,
        logout,
        refreshUser
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
