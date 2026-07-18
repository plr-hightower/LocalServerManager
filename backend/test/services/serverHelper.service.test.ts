import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import os from 'os'
import { nameToInt, hasEnoughRam } from '../../src/services/serverHelper.service.js'

describe('nameToInt', () => {
  it('returns a number', () => {
    expect(typeof nameToInt('hello')).toBe('number')
  })

  it('is deterministic — same input always returns the same value', () => {
    expect(nameToInt('my-server')).toBe(nameToInt('my-server'))
    expect(nameToInt('goonab2')).toBe(nameToInt('goonab2'))
  })

  it('always returns a non-negative number', () => {
    const names = ['a', 'test', 'server-1', 'my_world', 'aaaaaaaaaaaaaaaaaaaaaa']
    for (const name of names) {
      expect(nameToInt(name)).toBeGreaterThanOrEqual(0)
    }
  })

  it('returns 0 for an empty string', () => {
    expect(nameToInt('')).toBe(0)
  })

  it('returns different values for different inputs', () => {
    expect(nameToInt('server-a')).not.toBe(nameToInt('server-b'))
    expect(nameToInt('abc')).not.toBe(nameToInt('xyz'))
  })

  it('result fits within unsigned 32-bit integer range', () => {
    const result = nameToInt('some-long-server-name')
    expect(result).toBeGreaterThanOrEqual(0)
    expect(result).toBeLessThanOrEqual(2147483647)
  })

  it('handles a single character', () => {
    expect(typeof nameToInt('a')).toBe('number')
    expect(nameToInt('a')).toBeGreaterThanOrEqual(0)
  })

  it('handles names with underscores and dashes', () => {
    expect(typeof nameToInt('my_server-1')).toBe('number')
    expect(nameToInt('my_server-1')).toBeGreaterThanOrEqual(0)
  })

  it('is sensitive to character order — anagrams produce different results', () => {
    expect(nameToInt('abc')).not.toBe(nameToInt('bca'))
  })

  it('handles a long name without throwing', () => {
    const longName = 'a'.repeat(100)
    expect(() => nameToInt(longName)).not.toThrow()
    expect(nameToInt(longName)).toBeGreaterThanOrEqual(0)
  })
})

describe('hasEnoughRam', () => {
  const originalMargin = process.env.RAM_SAFETY_MARGIN_MB
  // 16384 MB total, matching os.totalmem()'s byte-based return value
  const totalMb = 16384

  beforeEach(() => {
    vi.spyOn(os, 'totalmem').mockReturnValue(totalMb * 1024 * 1024)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    if (originalMargin === undefined) {
      delete process.env.RAM_SAFETY_MARGIN_MB
    } else {
      process.env.RAM_SAFETY_MARGIN_MB = originalMargin
    }
  })

  it('returns true when there is plenty of room', () => {
    delete process.env.RAM_SAFETY_MARGIN_MB
    expect(hasEnoughRam(1000, 0)).toBe(true)
  })

  it('returns true right at the boundary (projected === available)', () => {
    delete process.env.RAM_SAFETY_MARGIN_MB
    // default margin is 512, so available = 16384 - 512 = 15872
    expect(hasEnoughRam(15872, 0)).toBe(true)
  })

  it('returns false one MB past the boundary', () => {
    delete process.env.RAM_SAFETY_MARGIN_MB
    expect(hasEnoughRam(15873, 0)).toBe(false)
  })

  it('returns false when already-used RAM alone exceeds available, regardless of request size', () => {
    delete process.env.RAM_SAFETY_MARGIN_MB
    expect(hasEnoughRam(1, 16000)).toBe(false)
  })

  it('returns true for a zero-MB request when there is room', () => {
    delete process.env.RAM_SAFETY_MARGIN_MB
    expect(hasEnoughRam(0, 1000)).toBe(true)
  })

  it('returns false for a single request that alone exceeds total memory', () => {
    delete process.env.RAM_SAFETY_MARGIN_MB
    expect(hasEnoughRam(totalMb + 1, 0)).toBe(false)
  })

  it('uses the default 512MB safety margin when RAM_SAFETY_MARGIN_MB is unset', () => {
    delete process.env.RAM_SAFETY_MARGIN_MB
    // 16384 - 512 = 15872 available; requesting exactly that plus 1 should fail
    expect(hasEnoughRam(15873, 0)).toBe(false)
    expect(hasEnoughRam(15872, 0)).toBe(true)
  })

  it('respects a custom RAM_SAFETY_MARGIN_MB override', () => {
    process.env.RAM_SAFETY_MARGIN_MB = '2048'
    // available = 16384 - 2048 = 14336
    expect(hasEnoughRam(14336, 0)).toBe(true)
    expect(hasEnoughRam(14337, 0)).toBe(false)
  })

  it('treats a zero safety margin as no headroom reserved', () => {
    process.env.RAM_SAFETY_MARGIN_MB = '0'
    expect(hasEnoughRam(totalMb, 0)).toBe(true)
    expect(hasEnoughRam(totalMb + 1, 0)).toBe(false)
  })

  it('sums requested and current usage correctly across multiple active servers', () => {
    delete process.env.RAM_SAFETY_MARGIN_MB
    // 4 servers already using 4096MB each = 16384 reserved, way past 15872 available
    expect(hasEnoughRam(1024, 4096 * 4)).toBe(false)
  })
})