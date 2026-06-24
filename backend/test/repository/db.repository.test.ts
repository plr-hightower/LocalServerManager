import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { ResultSetHeader } from 'mysql2'
import type { ServerSettingsS } from '@hightower/shared'

vi.mock('../../src/db/pool.js', () => ({
  pool: { execute: vi.fn() },
}))

import { DbService } from '../../src/repository/db.repository.js'
import { pool } from '../../src/db/pool.js'

const mockExecute = vi.mocked(pool.execute)

// A DB row that passes rowToServerSettings / ServerSettingsSchema validation
const mockRow = {
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
  game_settings: JSON.stringify({
    game: 'minecraft',
    EULA: 'TRUE',
    TYPE: 'FABRIC',
    VERSION: '1.20.1',
    MOTD: 'A Minecraft Server',
    MAX_PLAYERS: 10,
    VIEW_DISTANCE: 10,
  }),
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('DbService.getServerByName', () => {
  it('returns null when no server is found', async () => {
    mockExecute.mockResolvedValueOnce([[], []] as any)
    const db = new DbService()
    const result = await db.getServerByName('missing')
    expect(result).toBeNull()
  })

  it('returns a parsed ServerSettingsS when a row is found', async () => {
    mockExecute.mockResolvedValueOnce([[mockRow], []] as any)
    const db = new DbService()
    const result = await db.getServerByName('test-server')
    expect(result).not.toBeNull()
    expect(result!.core_settings.name).toBe('test-server')
  })

  it('queries with the correct server name', async () => {
    mockExecute.mockResolvedValueOnce([[], []] as any)
    const db = new DbService()
    await db.getServerByName('my-server')
    expect(mockExecute).toHaveBeenCalledWith(
      expect.stringContaining('WHERE name = ?'),
      ['my-server']
    )
  })

  it('parses game_settings JSON string into an object', async () => {
    mockExecute.mockResolvedValueOnce([[mockRow], []] as any)
    const db = new DbService()
    const result = await db.getServerByName('test-server')
    expect(typeof result!.game_settings).toBe('object')
    expect(result!.game_settings).toHaveProperty('game', 'minecraft')
  })
})

describe('DbService.getServersByGame', () => {
  it('returns an empty array when no servers match', async () => {
    mockExecute.mockResolvedValueOnce([[], []] as any)
    const db = new DbService()
    const result = await db.getServersByGame('minecraft')
    expect(result).toEqual([])
  })

  it('returns an array of ServerSettingsS when rows are found', async () => {
    mockExecute.mockResolvedValueOnce([[mockRow, mockRow], []] as any)
    const db = new DbService()
    const result = await db.getServersByGame('minecraft')
    expect(result).toHaveLength(2)
    expect(result[0].core_settings.game_container).toBe('minecraft')
  })

  it('queries with the correct game_container value', async () => {
    mockExecute.mockResolvedValueOnce([[], []] as any)
    const db = new DbService()
    await db.getServersByGame('minecraft')
    expect(mockExecute).toHaveBeenCalledWith(
      expect.stringContaining('game_container = ?'),
      ['minecraft']
    )
  })
})

describe('DbService.logNewServer', () => {
  const serverToLog: ServerSettingsS = {
    core_settings: {
      server_id: undefined,
      name: 'new-server',
      game_container: 'minecraft',
      container_id: 'b'.repeat(64),
      ram_alloc_mb: 2048,
      max_num_players: 5,
      status: 'starting',
      host_port: 25566,
      default_host_port: '25565',
      created_by: 'user1',
      created_at: new Date('2026-01-01'),
    },
    game_settings: {
      game: 'minecraft',
      EULA: 'TRUE',
      TYPE: 'FABRIC',
      VERSION: '1.20.1',
      MOTD: 'A Minecraft Server',
      MAX_PLAYERS: 5,
      VIEW_DISTANCE: 10,
    },
  }

  it('returns the insert ID', async () => {
    mockExecute.mockResolvedValueOnce([{ insertId: 42 } as ResultSetHeader, []] as any)
    const db = new DbService()
    const id = await db.logNewServer(serverToLog)
    expect(id).toBe(42)
  })

  it('calls execute with an INSERT statement', async () => {
    mockExecute.mockResolvedValueOnce([{ insertId: 1 } as ResultSetHeader, []] as any)
    const db = new DbService()
    await db.logNewServer(serverToLog)
    const sql = (mockExecute.mock.calls[0][0] as string).toUpperCase()
    expect(sql).toContain('INSERT INTO')
  })

  it('includes the server name in the query params', async () => {
    mockExecute.mockResolvedValueOnce([{ insertId: 1 } as ResultSetHeader, []] as any)
    const db = new DbService()
    await db.logNewServer(serverToLog)
    const params = mockExecute.mock.calls[0][1] as unknown[]
    expect(params).toContain('new-server')
  })

  it('throws when execute rejects', async () => {
    mockExecute.mockRejectedValueOnce(new Error('DB error'))
    const db = new DbService()
    await expect(db.logNewServer(serverToLog)).rejects.toThrow('DB error')
  })
})

describe('DbService.updateServerStatus', () => {
  it('calls execute with the correct status and server_id', async () => {
    mockExecute.mockResolvedValueOnce([{ affectedRows: 1 } as ResultSetHeader, []] as any)
    const db = new DbService()
    await db.updateServerStatus(1, 'started')
    expect(mockExecute).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE'),
      ['started', 1]
    )
  })

  it('does not throw on success', async () => {
    mockExecute.mockResolvedValueOnce([{ affectedRows: 1 } as ResultSetHeader, []] as any)
    const db = new DbService()
    await expect(db.updateServerStatus(5, 'stopped')).resolves.not.toThrow()
  })
})

describe('DbService.updateServerStatusByContainerId', () => {
  it('calls execute with the correct status and container ID', async () => {
    mockExecute.mockResolvedValueOnce([{ affectedRows: 1 } as ResultSetHeader, []] as any)
    const db = new DbService()
    await db.updateServerStatusByContainerId('container-abc', 'stopped')
    expect(mockExecute).toHaveBeenCalledWith(
      expect.stringContaining('container_id = ?'),
      ['stopped', 'container-abc']
    )
  })
})

describe('DbService.deleteServerRow', () => {
  it('returns true on success', async () => {
    mockExecute.mockResolvedValueOnce([{ affectedRows: 1 } as ResultSetHeader, []] as any)
    const db = new DbService()
    const result = await db.deleteServerRow(1)
    expect(result).toBe(true)
  })

  it('calls execute with a DELETE statement and the server_id', async () => {
    mockExecute.mockResolvedValueOnce([{ affectedRows: 1 } as ResultSetHeader, []] as any)
    const db = new DbService()
    await db.deleteServerRow(99)
    const sql = (mockExecute.mock.calls[0][0] as string).toUpperCase()
    expect(sql).toContain('DELETE')
    expect(mockExecute.mock.calls[0][1]).toContain(99)
  })
})

describe('DbService.getAllServers', () => {
  it('returns an empty array when no rows exist', async () => {
    mockExecute.mockResolvedValueOnce([[], []] as any)
    const db = new DbService()
    const result = await db.getAllServers()
    expect(result).toEqual([])
  })

  it('returns all rows mapped to ServerSettingsS', async () => {
    mockExecute.mockResolvedValueOnce([[mockRow, mockRow], []] as any)
    const db = new DbService()
    const result = await db.getAllServers()
    expect(result).toHaveLength(2)
    expect(result[0]).toHaveProperty('core_settings')
    expect(result[0]).toHaveProperty('game_settings')
  })
})

describe('DbService.getServersByStatus', () => {
  it('returns only servers with the given status', async () => {
    mockExecute.mockResolvedValueOnce([[mockRow], []] as any)
    const db = new DbService()
    const result = await db.getServersByStatus('stopped')
    expect(result).toHaveLength(1)
    expect(result[0].core_settings.status).toBe('stopped')
  })

  it('returns an empty array when no servers match the status', async () => {
    mockExecute.mockResolvedValueOnce([[], []] as any)
    const db = new DbService()
    const result = await db.getServersByStatus('started')
    expect(result).toEqual([])
  })

  it('queries with the correct status param', async () => {
    mockExecute.mockResolvedValueOnce([[], []] as any)
    const db = new DbService()
    await db.getServersByStatus('started')
    expect(mockExecute).toHaveBeenCalledWith(
      expect.stringContaining('status = ?'),
      ['started']
    )
  })
})

describe('DbService.getServerList', () => {
  it('returns null when no servers exist', async () => {
    mockExecute.mockResolvedValueOnce([[], []] as any)
    const db = new DbService()
    const result = await db.getServerList()
    expect(result).toBeNull()
  })

  it('returns a list of servers when rows exist', async () => {
    mockExecute.mockResolvedValueOnce([[mockRow], []] as any)
    const db = new DbService()
    const result = await db.getServerList()
    expect(result).toHaveLength(1)
    expect(result![0].core_settings.name).toBe('test-server')
  })
})