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
            ME: '/auth/me',
        },
        AVATARS: {
            DEFAULT: '/avatars/default',
            MY_AVATARS: '/avatars/my-avatars',
            GET_BY_ID: (id: string) => `/avatars/${id}`,
            CREATE: '/avatars/create',
            UPDATE: (id: string) => `/avatars/${id}`,
            DELETE: (id: string) => `/avatars/${id}`,
            UPLOAD_IMAGE: '/avatars/upload-image',
            UPLOAD_AUDIO: '/avatars/upload-audio',
            GENERATE_PROMPT: '/avatars/generate-prompt',
        },
        CONVERSATIONS: {
            CHAT: '/conversations/chat',
            GET_CONVERSATIONS: '/conversations/conversations',
            GET_MESSAGES: (id: string) => `/conversations/conversations/${id}/messages`,
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
    USER_DATA: 'ailipsync_user_data',
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

// Avatar types
export interface Avatar {
    id: string;
    name: string;
    role_title: string;
    description?: string;
    image_url: string;
    audio_url?: string;
    language: string;
    specialty?: string;
    personality?: string;
    template_prompt?: string;
    theme_color?: string;
    active: boolean;
    created_by: string;
    created_at: string;
    updated_at: string;
}

export interface AvatarCreateRequest {
    name: string;
    role_title: string;
    description?: string;
    image_url?: string;
    audio_url?: string;
    language?: string;
    specialty?: string;
    personality?: string;
    template_prompt?: string;
    theme_color?: string;
}

