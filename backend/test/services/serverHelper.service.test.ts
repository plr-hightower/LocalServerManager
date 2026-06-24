import { describe, it, expect } from 'vitest'
import { nameToInt } from '../../src/services/serverHelper.service.js'

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