"use client";
import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { apiService } from '@/src/api/apiService';
import { STORAGE_KEYS } from '@/src/api/config';
import { useToast } from './ToastContext';

type AuthUser = { id?: string; email: string; name?: string } | null;

type AuthContextType = {
    user: AuthUser;
    token: string | null;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (name: string, email: string, password: string) => Promise<any>;
    verifyEmail: (email: string, code: string) => Promise<void>;
    logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const router = useRouter();
    const pathname = usePathname();
    const { showError, showSuccess } = useToast();

    const [user, setUser] = useState<AuthUser>(null);
    const [token, setToken] = useState<string | null>(null);
    const isAuthenticated = !!token;

    const clearSession = useCallback(() => {
        setToken(null);
        setUser(null);
        try {
            if (typeof window !== 'undefined') {
                localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
                localStorage.removeItem(STORAGE_KEYS.USER_DATA);
            }
        } catch { }
    }, []);

    // Restore session - set token immediately, fetch user data async
    useEffect(() => {
        try {
            if (typeof window !== 'undefined') {
                const t = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
                const userData = localStorage.getItem(STORAGE_KEYS.USER_DATA);

                if (t) {
                    // Set token immediately so route guard works
                    setToken(t);

                    // Restore user data if available
                    if (userData) {
                        try {
                            const parsedUser = JSON.parse(userData);
                            setUser(parsedUser);
                        } catch {
                            // If user data is invalid, fetch from API (non-blocking)
                            apiService.getCurrentUser().then((user) => {
                                setUser(user);
                                localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
                            }).catch(() => {
                                // If fetch fails, don't clear session - just log error
                                console.error('Failed to fetch user data');
                            });
                        }
                    } else {
                        // Token exists but no user data, fetch it (non-blocking)
                        apiService.getCurrentUser().then((user) => {
                            setUser(user);
                            localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
                        }).catch(() => {
                            // If fetch fails, don't clear session - token might still be valid
                            console.error('Failed to fetch user data');
                        });
                    }
                }
            }
        } catch { }
    }, []);

    // Route guard
    useEffect(() => {
        const authRoutes = ['/Login', '/Register', '/ForgotPassword'];
        const isAuthRoute = authRoutes.includes(pathname || '');

        if (isAuthenticated) {
            // If authenticated and on auth routes, redirect to dashboard
            if (isAuthRoute) {
                router.replace('/Dashboard');
            }
            // If authenticated and on landing page, redirect to dashboard
            else if (pathname === '/') {
                router.replace('/Dashboard');
            }
        } else if (!isAuthenticated) {
            // If not authenticated and trying to access dashboard, redirect to login
            if (pathname?.startsWith('/Dashboard')) {
                router.replace('/Login');
            }
            // Allow landing page and auth routes when not authenticated
        }
    }, [isAuthenticated, pathname, router]);

    const persistToken = useCallback((t: string, userData?: AuthUser) => {
        setToken(t);
        try {
            if (typeof window !== 'undefined') {
                localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, t);
                if (userData) {
                    localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
                }
            }
        } catch { }
    }, []);

    const login = useCallback(async (email: string, password: string) => {
        try {
            const res = await apiService.login(email, password);
            persistToken(res.token, res.user);
            setUser(res.user);
            showSuccess('Logged in', `Welcome back${res.user?.name ? ', ' + res.user.name : ''}!`);
            router.replace('/Dashboard');
        } catch (e: any) {
            showError('Login failed', e?.message || 'Please check your credentials');
            throw e;
        }
    }, [persistToken, router, showError, showSuccess]);

    const register = useCallback(async (name: string, email: string, password: string) => {
        try {
            const res = await apiService.register(name, email, password);
            // Registration now returns verification status instead of immediate login
            if (res.ok) {
                // Don't set token or user yet - wait for email verification
                return res;
            } else {
                throw new Error(res.message || 'Registration failed');
            }
        } catch (e: any) {
            showError('Registration failed', e?.message || 'Please try again');
            throw e;
        }
    }, [showError]);

    const verifyEmail = useCallback(async (email: string, code: string) => {
        try {
            const res = await apiService.verifyEmail(email, code);
            persistToken(res.token, res.user);
            setUser(res.user);
            showSuccess('Email Verified', `Welcome to VideoAvatar${res.user?.name ? ', ' + res.user.name : ''}!`);
            router.replace('/Dashboard');
        } catch (e: any) {
            showError('Verification Failed', e?.message || 'Invalid or expired code');
            throw e;
        }
    }, [persistToken, router, showError, showSuccess]);

    const logout = useCallback(() => {
        clearSession();
        router.replace('/Login');
    }, [clearSession, router]);

    const value = useMemo<AuthContextType>(() => ({ user, token, isAuthenticated, login, register, verifyEmail, logout }), [user, token, isAuthenticated, login, register, verifyEmail, logout]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
};

