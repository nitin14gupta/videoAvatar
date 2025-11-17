// API Configuration
export const API_CONFIG = {
    BASE_URL: typeof window !== 'undefined' && window.location.hostname === 'localhost'
        ? 'http://localhost:8000'
        : 'https://ccsapi.mafatlaleducation.dev',

    ENDPOINTS: {
        AUTH: {
            REGISTER: '/auth/register',
            LOGIN: '/auth/login',
            RESET_REQUEST: '/auth/reset/request',
            RESET_VERIFY: '/auth/reset/verify',
            RESET_CONFIRM: '/auth/reset/confirm',
            VERIFY_EMAIL: '/auth/verify/email',
            RESEND_VERIFICATION: '/auth/verify/resend',
        },
        HEALTH: '/health',
    },

    DEFAULT_HEADERS: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
};

// Storage keys
export const STORAGE_KEYS = {
    AUTH_TOKEN: 'ailipsync_auth_token',
};

// API Response types
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
}

export interface AuthResponse {
    token: string;
    user: {
        id?: string;
        email: string;
        name?: string;
    };
}

