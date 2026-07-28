import { describe, it, expect, vi, beforeEach } from 'vitest'
import { z } from 'zod'
import type { Request, Response, NextFunction } from 'express'
import { validate } from '../../src/services/validate.service.js'

const schema = z.object({
  name: z.string(),
  count: z.number(),
})

function makeReqRes(body: unknown) {
  const req = { body } as Request
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response
  const next = vi.fn() as unknown as NextFunction
  return { req, res, next }
}

describe('validate middleware', () => {
  it('calls next() when body is valid', () => {
    const { req, res, next } = makeReqRes({ name: 'hello', count: 5 })
    validate(schema)(req, res, next)
    expect(next).toHaveBeenCalledOnce()
  })

  it('does not call res.status when body is valid', () => {
    const { req, res, next } = makeReqRes({ name: 'hello', count: 5 })
    validate(schema)(req, res, next)
    expect(res.status).not.toHaveBeenCalled()
  })

  it('sets parsed data on req.body after successful validation', () => {
    const { req, res, next } = makeReqRes({ name: 'hello', count: 5 })
    validate(schema)(req, res, next)
    expect(req.body).toEqual({ name: 'hello', count: 5 })
  })

  it('returns 400 when a required field is missing', () => {
    const { req, res, next } = makeReqRes({ name: 'hello' })
    validate(schema)(req, res, next)
    expect(res.status).toHaveBeenCalledWith(400)
    expect(next).not.toHaveBeenCalled()
  })

  it('returns error key in json on invalid body', () => {
    const { req, res, next } = makeReqRes({ name: 'hello' })
    validate(schema)(req, res, next)
    const payload = (res.json as ReturnType<typeof vi.fn>).mock.calls[0][0]
    expect(payload).toHaveProperty('error')
  })

  it('reports the error message as "Invalid body"', () => {
    const { req, res, next } = makeReqRes({ name: 'hello' })
    validate(schema)(req, res, next)
    const payload = (res.json as ReturnType<typeof vi.fn>).mock.calls[0][0]
    expect(payload.error).toBe('Invalid body')
  })

  it('returns details array in json on invalid body', () => {
    const { req, res, next } = makeReqRes({ name: 'hello' })
    validate(schema)(req, res, next)
    const payload = (res.json as ReturnType<typeof vi.fn>).mock.calls[0][0]
    expect(Array.isArray(payload.details)).toBe(true)
    expect(payload.details.length).toBeGreaterThan(0)
  })

  it('returns 400 when body has wrong field type', () => {
    const { req, res, next } = makeReqRes({ name: 123, count: 'not-a-number' })
    validate(schema)(req, res, next)
    expect(res.status).toHaveBeenCalledWith(400)
    expect(next).not.toHaveBeenCalled()
  })

  it('returns 400 when body is an empty object', () => {
    const { req, res, next } = makeReqRes({})
    validate(schema)(req, res, next)
    expect(res.status).toHaveBeenCalledWith(400)
    expect(next).not.toHaveBeenCalled()
  })

  it('returns 400 when body is null', () => {
    const { req, res, next } = makeReqRes(null)
    validate(schema)(req, res, next)
    expect(res.status).toHaveBeenCalledWith(400)
    expect(next).not.toHaveBeenCalled()
  })

  it('strips extra fields not in the schema', () => {
    const { req, res, next } = makeReqRes({ name: 'hello', count: 5, extra: 'ignored' })
    validate(schema)(req, res, next)
    expect(next).toHaveBeenCalledOnce()
    expect(req.body).not.toHaveProperty('extra')
  })

  it('works with different schema shapes', () => {
    const simpleSchema = z.object({ id: z.string().uuid() })
    const { req, res, next } = makeReqRes({ id: 'not-a-uuid' })
    validate(simpleSchema)(req, res, next)
    expect(res.status).toHaveBeenCalledWith(400)
    expect(next).not.toHaveBeenCalled()
  })
})
