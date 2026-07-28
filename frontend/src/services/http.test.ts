import { describe, it, expect } from 'vitest'
import type { AxiosError } from 'axios'
import { normalizeApiError } from './http'

type ApiErrorBody = { error?: string; details?: Array<{ message?: string }> }

function axErr(data?: ApiErrorBody, message = 'Request failed'): AxiosError<ApiErrorBody> {
    return {
        message,
        response: data ? { data } : undefined,
    } as AxiosError<ApiErrorBody>
}

describe('normalizeApiError', () => {
    it('joins the error and the first validation detail', () => {
        const err = axErr({
            error: 'Invalid body',
            details: [{ message: 'Too small: expected string to have >=4 characters' }],
        })
        expect(normalizeApiError(err).message)
            .toBe('Invalid body: Too small: expected string to have >=4 characters')
    })

    it('uses only the error when there are no details', () => {
        expect(normalizeApiError(axErr({ error: 'Server name already exists' })).message)
            .toBe('Server name already exists')
    })

    it('uses only the detail when the error field is missing', () => {
        expect(normalizeApiError(axErr({ details: [{ message: 'Password is required' }] })).message)
            .toBe('Password is required')
    })

    it('only surfaces the first detail', () => {
        const err = axErr({ error: 'Invalid body', details: [{ message: 'first' }, { message: 'second' }] })
        expect(normalizeApiError(err).message).toBe('Invalid body: first')
    })

    it('falls back to the axios message when there is no response body', () => {
        expect(normalizeApiError(axErr(undefined, 'Network Error')).message).toBe('Network Error')
    })

    it('falls back to "Request failed" when there is nothing else', () => {
        const err = { message: '', response: undefined } as unknown as AxiosError<ApiErrorBody>
        expect(normalizeApiError(err).message).toBe('Request failed')
    })

    it('ignores an empty details array', () => {
        expect(normalizeApiError(axErr({ error: 'Invalid body', details: [] })).message).toBe('Invalid body')
    })
})
