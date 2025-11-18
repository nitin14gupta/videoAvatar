import { API_CONFIG, STORAGE_KEYS, AuthResponse, Avatar, AvatarCreateRequest } from './config';

class ApiService {
    private baseURL: string;

    constructor() {
        this.baseURL = API_CONFIG.BASE_URL;
    }

    private getAuthToken(): string | null {
        try {
            return typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN) : null;
        } catch {
            return null;
        }
    }

    private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
        const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
        const headers = {
            ...API_CONFIG.DEFAULT_HEADERS,
            ...(options.headers || {}),
        } as Record<string, string>;
        // Let the browser set the correct multipart boundary when sending FormData
        if (isFormData && headers['Content-Type']) {
            delete headers['Content-Type'];
        }

        const token = this.getAuthToken();
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch(`${this.baseURL}${path}`, {
            ...options,
            headers,
        });

        const contentType = res.headers.get('content-type') || '';
        const data = contentType.includes('application/json') ? await res.json() : await res.text();
        if (!res.ok) {
            const message = typeof data === 'string' ? data : data?.error || data?.message || 'Request failed';
            throw new Error(message);
        }
        return data as T;
    }

    // Auth endpoints
    register(name: string, email: string, password: string) {
        return this.request<{ ok: boolean; sent?: boolean; message?: string }>(API_CONFIG.ENDPOINTS.AUTH.REGISTER, {
            method: 'POST',
            body: JSON.stringify({ name, email, password }),
        });
    }

    login(email: string, password: string) {
        return this.request<AuthResponse>(API_CONFIG.ENDPOINTS.AUTH.LOGIN, {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });
    }

    requestReset(email: string) {
        return this.request<{ ok: boolean; sent?: boolean }>(API_CONFIG.ENDPOINTS.AUTH.RESET_REQUEST, {
            method: 'POST',
            body: JSON.stringify({ email }),
        });
    }

    verifyReset(email: string, code: string) {
        return this.request<{ ok: boolean }>(API_CONFIG.ENDPOINTS.AUTH.RESET_VERIFY, {
            method: 'POST',
            body: JSON.stringify({ email, code }),
        });
    }

    confirmReset(email: string, code: string, newPassword: string) {
        return this.request<{ ok: boolean }>(API_CONFIG.ENDPOINTS.AUTH.RESET_CONFIRM, {
            method: 'POST',
            body: JSON.stringify({ email, code, new_password: newPassword }),
        });
    }

    verifyEmail(email: string, code: string) {
        return this.request<AuthResponse>(API_CONFIG.ENDPOINTS.AUTH.VERIFY_EMAIL, {
            method: 'POST',
            body: JSON.stringify({ email, code }),
        });
    }

    resendVerification(email: string) {
        return this.request<{ ok: boolean; sent?: boolean; message?: string }>(API_CONFIG.ENDPOINTS.AUTH.RESEND_VERIFICATION, {
            method: 'POST',
            body: JSON.stringify({ email }),
        });
    }

    getCurrentUser() {
        return this.request<AuthResponse['user']>(API_CONFIG.ENDPOINTS.AUTH.ME);
    }

    // Avatar endpoints
    getDefaultAvatars() {
        return this.request<{ avatars: Avatar[] }>(API_CONFIG.ENDPOINTS.AVATARS.DEFAULT);
    }

    getMyAvatars() {
        return this.request<{ avatars: Avatar[] }>(API_CONFIG.ENDPOINTS.AVATARS.MY_AVATARS);
    }

    getAvatarById(id: string) {
        return this.request<{ avatar: Avatar }>(API_CONFIG.ENDPOINTS.AVATARS.GET_BY_ID(id));
    }

    createAvatar(data: AvatarCreateRequest) {
        return this.request<{ avatar: Avatar }>(API_CONFIG.ENDPOINTS.AVATARS.CREATE, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    updateAvatar(id: string, data: Partial<AvatarCreateRequest>) {
        return this.request<{ avatar: Avatar }>(API_CONFIG.ENDPOINTS.AVATARS.UPDATE(id), {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    deleteAvatar(id: string) {
        return this.request<{ ok: boolean; message: string }>(API_CONFIG.ENDPOINTS.AVATARS.DELETE(id), {
            method: 'DELETE',
        });
    }

    uploadAvatarImage(file: File) {
        const formData = new FormData();
        formData.append('file', file);
        return this.uploadRequest<{ url: string; filename: string; path: string }>(
            API_CONFIG.ENDPOINTS.AVATARS.UPLOAD_IMAGE,
            formData
        );
    }

    uploadAvatarAudio(file: File) {
        const formData = new FormData();
        formData.append('file', file);
        return this.uploadRequest<{ url: string; filename: string; path: string }>(
            API_CONFIG.ENDPOINTS.AVATARS.UPLOAD_AUDIO,
            formData
        );
    }

    generateTemplatePrompt(roleTitle: string, description: string, specialty?: string) {
        return this.request<{ prompt: string }>(API_CONFIG.ENDPOINTS.AVATARS.GENERATE_PROMPT, {
            method: 'POST',
            body: JSON.stringify({ role_title: roleTitle, description, specialty }),
        }).then(res => res.prompt);
    }

    // Conversation endpoints
    chatWithAvatar(avatarId: string, message: string, conversationId?: string) {
        return this.request<{ conversation_id: string; message: string; avatar_response: string }>(
            API_CONFIG.ENDPOINTS.CONVERSATIONS.CHAT,
            {
                method: 'POST',
                body: JSON.stringify({ avatar_id: avatarId, message, conversation_id: conversationId }),
            }
        );
    }

    getConversations() {
        return this.request<{ conversations: any[] }>(API_CONFIG.ENDPOINTS.CONVERSATIONS.GET_CONVERSATIONS);
    }

    getMessages(conversationId: string) {
        return this.request<{ messages: any[] }>(API_CONFIG.ENDPOINTS.CONVERSATIONS.GET_MESSAGES(conversationId));
    }

    private async uploadRequest<T>(path: string, formData: FormData): Promise<T> {
        const headers: Record<string, string> = {};
        const token = this.getAuthToken();
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch(`${this.baseURL}${path}`, {
            method: 'POST',
            headers,
            body: formData,
        });

        const contentType = res.headers.get('content-type') || '';
        const data = contentType.includes('application/json') ? await res.json() : await res.text();

        if (!res.ok) {
            const message = typeof data === 'string' ? data : data?.error || data?.message || 'Request failed';
            throw new Error(message);
        }

        return data as T;
    }

    health() {
        return this.request<{ status: string }>(API_CONFIG.ENDPOINTS.HEALTH);
    }

}

export const apiService = new ApiService();

