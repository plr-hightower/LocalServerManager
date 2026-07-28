import { describe, it, expect } from 'vitest'
import { useServerForm } from './useServerForm'

describe('useServerForm visibility defaults', () => {
    it('defaults a secret field to hidden (valheim SERVER_PASS)', () => {
        const { fields, visibility } = useServerForm(() => 'valheim')
        const pass = fields.value.find(f => f.key === 'SERVER_PASS')
        expect(pass?.visibility).toBe(false)
        expect(visibility.value.SERVER_PASS).toBe(false)
    })

    it('defaults non-secret fields to visible (minecraft)', () => {
        const { fields, visibility } = useServerForm(() => 'minecraft')
        expect(fields.value.length).toBeGreaterThan(0)
        for (const f of fields.value) {
            expect(f.visibility).toBe(true)
            expect(visibility.value[f.key]).toBe(true)
        }
    })

    it('marks palworld password fields hidden but leaves others visible', () => {
        const { fields } = useServerForm(() => 'palworld')
        const byKey = Object.fromEntries(fields.value.map(f => [f.key, f]))
        expect(byKey.SERVER_PASSWORD.visibility).toBe(false)
        expect(byKey.ADMIN_PASSWORD.visibility).toBe(false)
        expect(byKey.DIFFICULTY.visibility).toBe(true)
    })
})
