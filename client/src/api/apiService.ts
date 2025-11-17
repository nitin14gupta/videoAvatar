import { API_CONFIG, STORAGE_KEYS, AuthResponse } from './config';

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

