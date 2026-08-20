import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Request, Response } from 'express'
import type { ServerSettingsS } from '@hightower/shared'

const dbMock = vi.hoisted(() => ({
  getServerByName: vi.fn(),
}))

vi.mock('../../src/repository/db.repository.js', () => ({
  DbService: vi.fn().mockImplementation(function () { return dbMock }),
}))

vi.mock('../../src/services/world.service.js', () => ({
  streamWorldDownload: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('../../src/services/file.service.js', () => ({
  streamPathDownload: vi.fn().mockResolvedValue(undefined),
}))

import { worldController } from '../../src/controllers/world.controller.js'
import { streamWorldDownload } from '../../src/services/world.service.js'
import { streamPathDownload } from '../../src/services/file.service.js'

function mockRes(): Response {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response
}

function mockReq(query: Record<string, unknown> = {}): Request {
  return { query } as Request
}

const stoppedServer: ServerSettingsS = {
  core_settings: {
    server_id: 1,
    name: 'goonab2',
    game_container: 'minecraft',
    container_id: 'a'.repeat(64),
    ram_alloc_mb: 4096,
    max_num_players: 10,
    status: 'stopped',
    host_port: 25565,
    default_host_port: '25565',
    created_by: 'admin',
    created_at: new Date('2026-01-01'),
  },
  game_settings: {
    game: 'minecraft',
    EULA: 'TRUE',
    TYPE: 'FABRIC',
    VERSION: '1.20.1',
    MOTD: 'A Minecraft Server',
    MAX_PLAYERS: 10,
    VIEW_DISTANCE: 10,
  },
}

const startedServer: ServerSettingsS = {
  ...stoppedServer,
  core_settings: { ...stoppedServer.core_settings, status: 'started' },
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('downloadWorld', () => {
  it('returns 400 when query is invalid', async () => {
    const req = mockReq({ bad: 'data' })
    const res = mockRes()
    await worldController.downloadWorld(req, res)
    expect(res.status).toHaveBeenCalledWith(400)
  })

  it('returns 400 with error detail when query is empty', async () => {
    const req = mockReq({})
    const res = mockRes()
    await worldController.downloadWorld(req, res)
    expect(res.status).toHaveBeenCalledWith(400)
    const payload = (res.json as ReturnType<typeof vi.fn>).mock.calls[0][0]
    expect(payload).toHaveProperty('error')
  })

  it('returns 404 when server is not found', async () => {
    dbMock.getServerByName.mockResolvedValue(null)
    const req = mockReq({ name: 'missing', created_by: 'admin' })
    const res = mockRes()
    await worldController.downloadWorld(req, res)
    expect(res.status).toHaveBeenCalledWith(404)
    const payload = (res.json as ReturnType<typeof vi.fn>).mock.calls[0][0]
    expect(payload).toEqual({ error: 'Server not found' })
  })

  it('returns 400 when server is not stopped', async () => {
    dbMock.getServerByName.mockResolvedValue(startedServer)
    const req = mockReq({ name: 'goonab2', created_by: 'admin' })
    const res = mockRes()
    await worldController.downloadWorld(req, res)
    expect(res.status).toHaveBeenCalledWith(400)
    const payload = (res.json as ReturnType<typeof vi.fn>).mock.calls[0][0]
    expect(payload).toEqual({ error: 'Stop the server before downloading' })
  })

  it('calls streamWorldDownload when server is stopped', async () => {
    dbMock.getServerByName.mockResolvedValue(stoppedServer)
    const req = mockReq({ name: 'goonab2', created_by: 'admin' })
    const res = mockRes()
    await worldController.downloadWorld(req, res)
    expect(streamWorldDownload).toHaveBeenCalledWith(stoppedServer, res, undefined)
  })

  it('forwards the volume index to streamWorldDownload', async () => {
    dbMock.getServerByName.mockResolvedValue(stoppedServer)
    const req = mockReq({ name: 'goonab2', created_by: 'admin', vol: '1' })
    const res = mockRes()
    await worldController.downloadWorld(req, res)
    expect(streamWorldDownload).toHaveBeenCalledWith(stoppedServer, res, 1)
  })

  it('does not return an error response on successful download', async () => {
    dbMock.getServerByName.mockResolvedValue(stoppedServer)
    const req = mockReq({ name: 'goonab2', created_by: 'admin' })
    const res = mockRes()
    await worldController.downloadWorld(req, res)
    expect(res.status).not.toHaveBeenCalled()
  })

  it('returns 500 when streamWorldDownload throws', async () => {
    dbMock.getServerByName.mockResolvedValue(stoppedServer)
    vi.mocked(streamWorldDownload).mockRejectedValue(new Error('Archive failed'))
    const req = mockReq({ name: 'goonab2', created_by: 'admin' })
    const res = mockRes()
    await worldController.downloadWorld(req, res)
    expect(res.status).toHaveBeenCalledWith(500)
  })

  it('returns 500 with details when streamWorldDownload throws an Error', async () => {
    dbMock.getServerByName.mockResolvedValue(stoppedServer)
    vi.mocked(streamWorldDownload).mockRejectedValue(new Error('Disk full'))
    const req = mockReq({ name: 'goonab2', created_by: 'admin' })
    const res = mockRes()
    await worldController.downloadWorld(req, res)
    const payload = (res.json as ReturnType<typeof vi.fn>).mock.calls[0][0]
    expect(payload.details).toBe('Disk full')
  })

  it('returns 500 when db.getServerByName throws', async () => {
    dbMock.getServerByName.mockRejectedValue(new Error('DB error'))
    const req = mockReq({ name: 'goonab2', created_by: 'admin' })
    const res = mockRes()
    await worldController.downloadWorld(req, res)
    expect(res.status).toHaveBeenCalledWith(500)
  })
})

describe('downloadWorld with a path', () => {
  it('streams the single file instead of the volume', async () => {
    dbMock.getServerByName.mockResolvedValue(stoppedServer)
    const req = mockReq({ name: 'goonab2', created_by: 'admin', path: 'vol0/world/level.dat' })
    const res = mockRes()
    await worldController.downloadWorld(req, res)
    expect(streamPathDownload).toHaveBeenCalledWith(stoppedServer, res, 'vol0/world/level.dat')
    expect(streamWorldDownload).not.toHaveBeenCalled()
    expect(res.status).not.toHaveBeenCalled()
  })

  it('ignores vol when a path is given', async () => {
    dbMock.getServerByName.mockResolvedValue(stoppedServer)
    const req = mockReq({ name: 'goonab2', created_by: 'admin', vol: '1', path: 'vol0/ops.json' })
    const res = mockRes()
    await worldController.downloadWorld(req, res)
    expect(streamPathDownload).toHaveBeenCalledWith(stoppedServer, res, 'vol0/ops.json')
    expect(streamWorldDownload).not.toHaveBeenCalled()
  })

  it('returns 400 when the path escapes with ..', async () => {
    dbMock.getServerByName.mockResolvedValue(stoppedServer)
    const req = mockReq({ name: 'goonab2', created_by: 'admin', path: 'vol0/../../etc/passwd' })
    const res = mockRes()
    await worldController.downloadWorld(req, res)
    expect(res.status).toHaveBeenCalledWith(400)
    expect(streamPathDownload).not.toHaveBeenCalled()
  })

  it('returns 400 when the path is absolute', async () => {
    dbMock.getServerByName.mockResolvedValue(stoppedServer)
    const req = mockReq({ name: 'goonab2', created_by: 'admin', path: '/etc/passwd' })
    const res = mockRes()
    await worldController.downloadWorld(req, res)
    expect(res.status).toHaveBeenCalledWith(400)
    expect(streamPathDownload).not.toHaveBeenCalled()
  })

  it('returns 400 when the server is not stopped', async () => {
    dbMock.getServerByName.mockResolvedValue(startedServer)
    const req = mockReq({ name: 'goonab2', created_by: 'admin', path: 'vol0/ops.json' })
    const res = mockRes()
    await worldController.downloadWorld(req, res)
    expect(res.status).toHaveBeenCalledWith(400)
    expect(streamPathDownload).not.toHaveBeenCalled()
  })

  it('streams a folder path without an error response', async () => {
    dbMock.getServerByName.mockResolvedValue(stoppedServer)
    const req = mockReq({ name: 'goonab2', created_by: 'admin', path: 'vol0/world' })
    const res = mockRes()
    await worldController.downloadWorld(req, res)
    expect(streamPathDownload).toHaveBeenCalledWith(stoppedServer, res, 'vol0/world')
    expect(res.status).not.toHaveBeenCalled()
  })

  it('returns 500 when streaming fails', async () => {
    dbMock.getServerByName.mockResolvedValue(stoppedServer)
    vi.mocked(streamPathDownload).mockRejectedValue(new Error('Disk full'))
    const req = mockReq({ name: 'goonab2', created_by: 'admin', path: 'vol0/ops.json' })
    const res = mockRes()
    await worldController.downloadWorld(req, res)
    expect(res.status).toHaveBeenCalledWith(500)
    const payload = (res.json as ReturnType<typeof vi.fn>).mock.calls[0][0]
    expect(payload.details).toBe('Disk full')
  })

  it('falls back to the volume download when path is absent', async () => {
    dbMock.getServerByName.mockResolvedValue(stoppedServer)
    const req = mockReq({ name: 'goonab2', created_by: 'admin', vol: '0' })
    const res = mockRes()
    await worldController.downloadWorld(req, res)
    expect(streamWorldDownload).toHaveBeenCalledWith(stoppedServer, res, 0)
    expect(streamPathDownload).not.toHaveBeenCalled()
  })
})