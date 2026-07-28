import axios, { AxiosError } from 'axios';

// Single configured client for the app
export const api = axios.create({
    baseURL: '/api',
    headers: { 'Content-Type': 'application/json' },
})

type ApiErrorBody = { error?: string; details?: Array<{ message?: string }> };

// Normalize an axios error into the backend's { error } message, appending the
// first validation detail when present so Zod issues (e.g. "expected string to
// have >=4 characters") reach the user instead of a bare "Invalid body".
export function normalizeApiError(err: AxiosError<ApiErrorBody>): Error {
    const data = err.response?.data;
    const detail = Array.isArray(data?.details) ? data.details[0]?.message : undefined;
    const message = [data?.error, detail].filter(Boolean).join(': ')
        || err.message || 'Request failed';
    return new Error(message);
}

// axios rejects on non-2xx , normalize so callers get a useful message.
api.interceptors.response.use(
    res => res,
    (err: AxiosError<ApiErrorBody>) => Promise.reject(normalizeApiError(err)),
);