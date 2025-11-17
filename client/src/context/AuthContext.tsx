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

    // Restore session
    useEffect(() => {
        try {
            const t = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN) : null;
            if (t) setToken(t);
        } catch { }
    }, []);

    // Route guard
    useEffect(() => {
        const authRoutes = ['/Login', '/Register', '/ForgotPassword'];
        const isAuthRoute = authRoutes.includes(pathname || '');
        if (isAuthenticated && isAuthRoute) {
            router.replace('/Dashboard');
        } else if (!isAuthenticated && !isAuthRoute) {
            // Allow landing page
            if (pathname !== '/' && !pathname?.startsWith('/Dashboard')) return;
            if (pathname?.startsWith('/Dashboard')) router.replace('/Login');
        }
    }, [isAuthenticated, pathname, router]);

    const persistToken = useCallback((t: string) => {
        setToken(t);
        try {
            if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, t);
        } catch { }
    }, []);

    const clearSession = useCallback(() => {
        setToken(null);
        setUser(null);
        try {
            if (typeof window !== 'undefined') localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
        } catch { }
    }, []);

    const login = useCallback(async (email: string, password: string) => {
        try {
            const res = await apiService.login(email, password);
            persistToken(res.token);
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
            persistToken(res.token);
            setUser(res.user);
            showSuccess('Email Verified', 'Welcome to eduCreate!');
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

