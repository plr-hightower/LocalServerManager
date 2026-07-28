import { describe, it, expect, afterEach } from 'vitest'
import type { ServerSettingsS } from '@hightower/shared'
import { hashManagerPassword, verifyManagerPassword } from '../../src/services/password.service.js'

function serverWith(manager_password: string | null): ServerSettingsS {
  return {
    core_settings: {
      server_id: 1,
      name: 'test-server',
      game_container: 'minecraft',
      container_id: 'a'.repeat(64),
      ram_alloc_mb: 4096,
      max_num_players: 10,
      status: 'stopped',
      host_port: 25565,
      default_host_port: '25565',
      created_by: 'admin',
      created_at: new Date('2026-01-01'),
      manager_password,
    },
    game_settings: {
      game: 'minecraft',
      EULA: 'TRUE',
      TYPE: 'FABRIC',
      VERSION: '1.20.1',
      MOTD: 'Test',
      MAX_PLAYERS: 10,
      VIEW_DISTANCE: 10,
    },
  }
}

describe('hashManagerPassword', () => {
  it('produces a hash that is not the plaintext', async () => {
    const hash = await hashManagerPassword('plaintext')
    expect(hash).not.toBe('plaintext')
  })
})

describe('verifyManagerPassword', () => {
  it('verifies a correct password against its hash', async () => {
    const hash = await hashManagerPassword('correct-horse')
    expect(await verifyManagerPassword(serverWith(hash), 'correct-horse')).toBe(true)
  })

  it('rejects an incorrect password', async () => {
    const hash = await hashManagerPassword('correct-horse')
    expect(await verifyManagerPassword(serverWith(hash), 'wrong')).toBe(false)
  })

  it('rejects when no manager_password is configured', async () => {
    expect(await verifyManagerPassword(serverWith(null), 'anything')).toBe(false)
  })
})

describe('admin master password', () => {
  const original = process.env.ADMIN_MASTER_PASSWORD

  afterEach(() => {
    if (original === undefined) delete process.env.ADMIN_MASTER_PASSWORD
    else process.env.ADMIN_MASTER_PASSWORD = original
  })

  it('accepts the master password on a server that has its own password', async () => {
    process.env.ADMIN_MASTER_PASSWORD = 'master-key'
    const hash = await hashManagerPassword('server-pw')
    expect(await verifyManagerPassword(serverWith(hash), 'master-key')).toBe(true)
  })

  it('accepts the master password even when the server has no password', async () => {
    process.env.ADMIN_MASTER_PASSWORD = 'master-key'
    expect(await verifyManagerPassword(serverWith(null), 'master-key')).toBe(true)
  })

  it('still accepts the correct per-server password', async () => {
    process.env.ADMIN_MASTER_PASSWORD = 'master-key'
    const hash = await hashManagerPassword('server-pw')
    expect(await verifyManagerPassword(serverWith(hash), 'server-pw')).toBe(true)
  })

  it('rejects a wrong password when a master is configured', async () => {
    process.env.ADMIN_MASTER_PASSWORD = 'master-key'
    const hash = await hashManagerPassword('server-pw')
    expect(await verifyManagerPassword(serverWith(hash), 'nope')).toBe(false)
  })

  it('treats an empty master env as disabled', async () => {
    process.env.ADMIN_MASTER_PASSWORD = ''
    expect(await verifyManagerPassword(serverWith(null), '')).toBe(false)
  })
})
