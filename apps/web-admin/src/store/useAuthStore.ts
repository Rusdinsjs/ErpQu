import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { jwtDecode } from 'jwt-decode';

import { api } from '../api/http'; // Import API client

export interface User {
    id: string;
    email: string;
    name: string;
    role: string;
    role_level: number;
    permissions: string[];
    phone?: string;
    avatar_url?: string;
    department?: string;
    allowed_asset_group?: string;
}

interface AuthState {
    token: string | null;
    refreshToken: string | null;
    user: User | null;
    activeCompanyId: string | null;
    activeCompanyName: string | null;
    setActiveCompany: (id: string | null, name: string | null) => void;
    setTokens: (token: string, refreshToken?: string | null) => void;
    login: (token: string, user: Omit<User, 'permissions' | 'role_level'>, refreshToken?: string) => void;
    logout: () => void;
    refreshUser: () => Promise<void>;
    isAuthenticated: () => boolean;
    isAdmin: () => boolean;
    hasPermission: (permission: string) => boolean;
    hasRoleLevel: (level: number) => boolean;
}

interface JwtClaims {
    permissions?: string[];
    role_level?: number;
    department?: string;
    allowed_asset_group?: string;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            token: null,
            refreshToken: null,
            user: null,
            activeCompanyId: null,
            activeCompanyName: null,
            setActiveCompany: (id, name) => set({ activeCompanyId: id, activeCompanyName: name }),
            setTokens: (token, refreshToken) => set((state) => ({
                token,
                refreshToken: refreshToken !== undefined ? refreshToken : state.refreshToken,
            })),
            login: (token, baseUser, refreshToken) => {
                try {
                    const decoded = jwtDecode<JwtClaims>(token);
                    const permissions = decoded.permissions || [];
                    const isSuperAdminOrAdmin = baseUser.role === 'super_admin' || baseUser.role === 'admin';
                    const role_level = decoded.role_level ?? (baseUser.role === 'super_admin' ? 1 : baseUser.role === 'admin' ? 2 : 5);

                    set({
                        token,
                        refreshToken: refreshToken || null,
                        user: {
                            ...baseUser,
                            permissions: isSuperAdminOrAdmin && !permissions.includes('*') ? ['*', ...permissions] : permissions,
                            role_level,
                            department: decoded.department,
                            allowed_asset_group: decoded.allowed_asset_group,
                        },
                    });
                } catch (e) {
                    console.error("Failed to decode token", e);
                    set({
                        token,
                        refreshToken: refreshToken || null,
                        user: {
                            ...baseUser,
                            permissions: [],
                            role_level: 5,
                        },
                    });
                }
            },
            logout: () => set({ token: null, refreshToken: null, user: null, activeCompanyId: null, activeCompanyName: null }),
            refreshUser: async () => {
                const token = get().token;
                if (!token) return;
                try {
                    const res = await api.get<{ success: boolean; data: User }>('/me');
                    const userData = res.data.data;

                    const currentUser = get().user;
                    if (currentUser && userData) {
                        set({
                            user: {
                                ...currentUser,
                                ...userData,
                            }
                        });
                    }
                } catch (e) {
                    console.error("Failed to refresh user", e);
                }
            },
            isAuthenticated: () => !!get().token,
            isAdmin: () => {
                const user = get().user;
                return user?.role === 'admin' || user?.role === 'super_admin';
            },
            hasPermission: (permission: string) => {
                const user = get().user;
                if (!user) return false;
                if (user.role === 'super_admin' || user.role === 'admin' || (user.role_level && user.role_level <= 2)) return true;
                if (user.permissions && user.permissions.includes('*')) return true;
                if (user.permissions && user.permissions.includes(permission)) return true;

                const [resource] = permission.split('.');
                if (resource && user.permissions && user.permissions.includes(`${resource}.*`)) return true;

                return false;
            },
            hasRoleLevel: (level: number) => {
                const user = get().user;
                if (!user) return false;
                if (user.role === 'super_admin') return true;
                if (user.role === 'admin' && level >= 2) return true;
                return (user.role_level ?? 5) <= level;
            },
        }),
        {
            name: 'auth-storage',
        }
    )
);
