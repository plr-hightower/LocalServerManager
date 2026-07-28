import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Request, Response } from 'express'
import type { ServerSettingsS } from '@hightower/shared'

const dbMock = vi.hoisted(() => ({ getServerByName: vi.fn() }))
vi.mock('../../src/repository/db.repository.js', () => ({
  DbService: vi.fn().mockImplementation(function () { return dbMock }),
}))

const svc = vi.hoisted(() => ({
  verifyManagerPassword: vi.fn(),
  listDirectory: vi.fn(),
  deleteEntry: vi.fn(),
  resolveUploadDir: vi.fn(),
}))
vi.mock('../../src/services/password.service.js', () => ({ verifyManagerPassword: svc.verifyManagerPassword }))
vi.mock('../../src/services/file.service.js', () => ({
  listDirectory: svc.listDirectory,
  deleteEntry: svc.deleteEntry,
  resolveUploadDir: svc.resolveUploadDir,
}))

import { fileController } from '../../src/controllers/file.controller.js'

function mockRes(): Response {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response
}

function mockReq(body: Record<string, unknown>, files?: unknown): Request {
  return { body, files } as unknown as Request
}

const stoppedServer: ServerSettingsS = {
  core_settings: {
    server_id: 1,
    name: 'srv',
    game_container: 'minecraft',
    container_id: 'a'.repeat(64),
    ram_alloc_mb: 4096,
    max_num_players: 10,
    status: 'stopped',
    host_port: 25565,
    default_host_port: '25565',
    created_by: 'admin',
    created_at: new Date('2026-01-01'),
    manager_password: 'hash',
  },
  game_settings: {
    game: 'minecraft', EULA: 'TRUE', TYPE: 'FABRIC', VERSION: '1.20.1',
    MOTD: 'A Minecraft Server', MAX_PLAYERS: 10, VIEW_DISTANCE: 10,
  },
}

const startedServer: ServerSettingsS = {
  ...stoppedServer,
  core_settings: { ...stoppedServer.core_settings, status: 'started' },
}

const validBody = { name: 'srv', created_by: 'admin', path: 'vol0', password: 'secret' }

beforeEach(() => {
  vi.clearAllMocks()
})

describe('listFiles', () => {
  it('returns 400 on invalid body (missing password)', async () => {
    const res = mockRes()
    await fileController.listFiles(mockReq({ name: 'srv', created_by: 'admin' }), res)
    expect(res.status).toHaveBeenCalledWith(400)
  })

  it('returns 404 when server not found', async () => {
    dbMock.getServerByName.mockResolvedValue(null)
    const res = mockRes()
    await fileController.listFiles(mockReq(validBody), res)
    expect(res.status).toHaveBeenCalledWith(404)
  })

  it('returns 401 on wrong password', async () => {
    dbMock.getServerByName.mockResolvedValue(stoppedServer)
    svc.verifyManagerPassword.mockResolvedValue(false)
    const res = mockRes()
    await fileController.listFiles(mockReq(validBody), res)
    expect(res.status).toHaveBeenCalledWith(401)
  })

  it('returns 200 with entries when authorized (browsing allowed while running)', async () => {
    dbMock.getServerByName.mockResolvedValue(startedServer)
    svc.verifyManagerPassword.mockResolvedValue(true)
    svc.listDirectory.mockResolvedValue([])
    const res = mockRes()
    await fileController.listFiles(mockReq(validBody), res)
    expect(res.status).toHaveBeenCalledWith(200)
  })
})

describe('deleteFiles', () => {
  it('returns 401 on wrong password', async () => {
    dbMock.getServerByName.mockResolvedValue(stoppedServer)
    svc.verifyManagerPassword.mockResolvedValue(false)
    const res = mockRes()
    await fileController.deleteFiles(mockReq({ ...validBody, path: 'vol0/x' }), res)
    expect(res.status).toHaveBeenCalledWith(401)
  })

  it('returns 400 when server is not stopped', async () => {
    dbMock.getServerByName.mockResolvedValue(startedServer)
    svc.verifyManagerPassword.mockResolvedValue(true)
    const res = mockRes()
    await fileController.deleteFiles(mockReq({ ...validBody, path: 'vol0/x' }), res)
    expect(res.status).toHaveBeenCalledWith(400)
    expect(svc.deleteEntry).not.toHaveBeenCalled()
  })

  it('deletes and returns 200 when stopped and authorized', async () => {
    dbMock.getServerByName.mockResolvedValue(stoppedServer)
    svc.verifyManagerPassword.mockResolvedValue(true)
    svc.deleteEntry.mockResolvedValue(undefined)
    const res = mockRes()
    await fileController.deleteFiles(mockReq({ ...validBody, path: 'vol0/x' }), res)
    expect(svc.deleteEntry).toHaveBeenCalledWith(stoppedServer, 'vol0/x')
    expect(res.status).toHaveBeenCalledWith(200)
  })
})

describe('uploadFiles', () => {
  it('returns 401 on wrong password', async () => {
    dbMock.getServerByName.mockResolvedValue(stoppedServer)
    svc.verifyManagerPassword.mockResolvedValue(false)
    const res = mockRes()
    await fileController.uploadFiles(mockReq(validBody, []), res)
    expect(res.status).toHaveBeenCalledWith(401)
  })

  it('returns 400 when server is not stopped', async () => {
    dbMock.getServerByName.mockResolvedValue(startedServer)
    svc.verifyManagerPassword.mockResolvedValue(true)
    const res = mockRes()
    await fileController.uploadFiles(mockReq(validBody, []), res)
    expect(res.status).toHaveBeenCalledWith(400)
  })

  it('returns 400 when no files were uploaded', async () => {
    dbMock.getServerByName.mockResolvedValue(stoppedServer)
    svc.verifyManagerPassword.mockResolvedValue(true)
    const res = mockRes()
    await fileController.uploadFiles(mockReq(validBody, []), res)
    expect(res.status).toHaveBeenCalledWith(400)
    expect(svc.resolveUploadDir).not.toHaveBeenCalled()
  })
})
