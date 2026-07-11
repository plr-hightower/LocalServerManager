import axios, { AxiosError } from 'axios';

// Single configured client for the app
export const api = axios.create({
    baseURL: '/api',
    headers: { 'Content-Type': 'application/json' },
})

// axios rejects on non-2xx. Normalize the error so callers get the backend's
// { error } message (falling back to axios' own), preserving the old fetch wrapper's behaviour.
api.interceptors.response.use(
    res => res,
    (err: AxiosError<{ error?: string }>) =>
        Promise.reject(new Error(err.response?.data?.error ?? err.message ?? 'Request failed')),
);