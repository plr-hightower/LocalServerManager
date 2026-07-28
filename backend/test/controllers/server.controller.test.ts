import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { Request, Response } from 'express'
import type { ServerSettingsS } from '@hightower/shared'
import os from 'os'

vi.mock('../../src/repository/db.repository.js', () => ({
  DbService: vi.fn(),
}))

vi.mock('../../src/services/docker.service.js', () => ({
  createContainer: vi.fn(),
  deleteContainer: vi.fn(),
  startContainer: vi.fn(),
  stopContainer: vi.fn(),
  getDockerStats: vi.fn().mockResolvedValue([]),
  reconcileStatuses: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('../../src/services/password.service.js', () => ({
  hashManagerPassword: vi.fn().mockResolvedValue('hashed'),
  verifyManagerPassword: vi.fn().mockResolvedValue(true),
  isMasterPassword: vi.fn().mockReturnValue(false),
}))

vi.mock('../../src/services/games/minecraft.service.js', () => ({
  GameService: {
    getGameManifest: vi.fn().mockResolvedValue({
      image: 'itzg/minecraft-server:2024.1.0',
      env: ['EULA=TRUE', 'TYPE=FABRIC', 'VERSION=1.20.1', 'MOTD=Test', 'MAX_PLAYERS=10', 'VIEW_DISTANCE=10'],
      protocols: ['tcp'],
      worldVolumes: [{ path: '/data' }],
    }),
    getDefaultPort: vi.fn().mockReturnValue('25565'),
    getHostPort: vi.fn().mockReturnValue(25566),
  },
}))

import { serverController } from '../../src/controllers/server.controller.js'
import { DbService } from '../../src/repository/db.repository.js'
import * as dockerService from '../../src/services/docker.service.js'
import { verifyManagerPassword, isMasterPassword } from '../../src/services/password.service.js'

// ── helpers ──────────────────────────────────────────────────────────────────

function mockRes() {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response
}

function mockReq(body: Record<string, unknown> = {}): Request {
  return { body } as Request
}

function makeDbMock(overrides: Partial<InstanceType<typeof DbService>> = {}) {
  const defaults = {
    getServerByName: vi.fn().mockResolvedValue(null),
    getServersByGame: vi.fn().mockResolvedValue([]),
    logNewServer: vi.fn().mockResolvedValue(1),
    getAllServers: vi.fn().mockResolvedValue([]),
    getServersByStatus: vi.fn().mockResolvedValue([]),
    updateServerStatus: vi.fn().mockResolvedValue(undefined),
    deleteServerRow: vi.fn().mockResolvedValue(true),
    getServerList: vi.fn().mockResolvedValue([]),
    countServers: vi.fn().mockResolvedValue(0),
    countServersSince: vi.fn().mockResolvedValue(0),
    sumRamAllocForActiveServers: vi.fn().mockResolvedValue(0),
  }
  const db = { ...defaults, ...overrides }
  vi.mocked(DbService).mockImplementation(function () { return db as unknown as InstanceType<typeof DbService> })
  return db
}

const stoppedServer: ServerSettingsS = {
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

const ENV_KEYS = ['MAX_TOTAL_SERVERS', 'MAX_SERVERS_WITHIN_WINDOW', 'CREATE_SERVER_WINDOW_MINUTES', 'RAM_SAFETY_MARGIN_MB'] as const
const originalEnv: Record<string, string | undefined> = {}
for (const key of ENV_KEYS) originalEnv[key] = process.env[key]

beforeEach(() => {
  vi.clearAllMocks()
  // 16384 MB total; matches the default 4096MB ram_alloc_mb in validBody with plenty of room
  vi.spyOn(os, 'totalmem').mockReturnValue(16384 * 1024 * 1024)
  for (const key of ENV_KEYS) delete process.env[key]
})

afterEach(() => {
  // Note: intentionally not vi.restoreAllMocks() here , that would reset the
  // vi.fn() implementations set inside the module-level vi.mock(...) factories
  // above (DbService, docker.service, minecraft.service) to empty stubs after
  // the first test, breaking every test after it.
  vi.spyOn(os, 'totalmem').mockRestore()
  for (const key of ENV_KEYS) {
    if (originalEnv[key] === undefined) delete process.env[key]
    else process.env[key] = originalEnv[key]
  }
})

// ── buildServer ───────────────────────────────────────────────────────────────

describe('buildServer', () => {
  const validBody = {
    core_settings: {
      name: 'new-server',
      game_container: 'minecraft',
      ram_alloc_mb: 4096,
      max_num_players: 10,
      created_by: 'admin',
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

  it('returns 400 when request body is invalid', async () => {
    makeDbMock()
    const req = mockReq({ bad: 'data' })
    const res = mockRes()
    await serverController.buildServer(req, res)
    expect(res.status).toHaveBeenCalledWith(400)
  })

  it('returns 400 when a server with that name already exists', async () => {
    makeDbMock({ getServerByName: vi.fn().mockResolvedValue(stoppedServer) })
    const req = mockReq(validBody)
    const res = mockRes()
    await serverController.buildServer(req, res)
    expect(res.status).toHaveBeenCalledWith(400)
  })

  it('returns 200 with the new server ID on success', async () => {
    makeDbMock({
      getServerByName: vi.fn().mockResolvedValue(null),
      getServersByGame: vi.fn().mockResolvedValue([]),
      logNewServer: vi.fn().mockResolvedValue(99),
    })
    vi.mocked(dockerService.createContainer).mockResolvedValue('new-container-id')

    const req = mockReq(validBody)
    const res = mockRes()
    await serverController.buildServer(req, res)
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith(99)
  })

  it('persists env_visibility passed in core_settings', async () => {
    const logNewServer = vi.fn().mockResolvedValue(7)
    makeDbMock({ logNewServer })
    vi.mocked(dockerService.createContainer).mockResolvedValue('new-container-id')

    const req = mockReq({
      ...validBody,
      core_settings: { ...validBody.core_settings, env_visibility: { MOTD: true, VIEW_DISTANCE: false } },
    })
    const res = mockRes()
    await serverController.buildServer(req, res)

    expect(res.status).toHaveBeenCalledWith(200)
    expect(logNewServer).toHaveBeenCalledTimes(1)
    expect(logNewServer.mock.calls[0][0].core_settings.env_visibility)
      .toEqual({ MOTD: true, VIEW_DISTANCE: false })
  })

  it('returns 500 when createContainer throws', async () => {
    makeDbMock({
      getServerByName: vi.fn().mockResolvedValue(null),
      getServersByGame: vi.fn().mockResolvedValue([]),
    })
    vi.mocked(dockerService.createContainer).mockRejectedValue(new Error('Docker failure'))

    const req = mockReq(validBody)
    const res = mockRes()
    await serverController.buildServer(req, res)
    expect(res.status).toHaveBeenCalledWith(500)
  })

  // ── rate limiting ──────────────────────────────────────────────────────────

  it('returns 429 when the total server count is at the default max (40)', async () => {
    makeDbMock({ countServers: vi.fn().mockResolvedValue(40) })
    const req = mockReq(validBody)
    const res = mockRes()
    await serverController.buildServer(req, res)
    expect(res.status).toHaveBeenCalledWith(429)
  })

  it('returns 429 when the total server count is over the default max', async () => {
    makeDbMock({ countServers: vi.fn().mockResolvedValue(41) })
    const req = mockReq(validBody)
    const res = mockRes()
    await serverController.buildServer(req, res)
    expect(res.status).toHaveBeenCalledWith(429)
  })

  it('allows creation when the total server count is one below the default max', async () => {
    makeDbMock({ countServers: vi.fn().mockResolvedValue(39) })
    vi.mocked(dockerService.createContainer).mockResolvedValue('new-container-id')
    const req = mockReq(validBody)
    const res = mockRes()
    await serverController.buildServer(req, res)
    expect(res.status).toHaveBeenCalledWith(200)
  })

  it('respects a custom MAX_TOTAL_SERVERS override', async () => {
    process.env.MAX_TOTAL_SERVERS = '2'
    makeDbMock({ countServers: vi.fn().mockResolvedValue(2) })
    const req = mockReq(validBody)
    const res = mockRes()
    await serverController.buildServer(req, res)
    expect(res.status).toHaveBeenCalledWith(429)
  })

  it('returns 429 when the creation-window limit is reached (default max 1 per hour)', async () => {
    makeDbMock({ countServersSince: vi.fn().mockResolvedValue(1) })
    const req = mockReq(validBody)
    const res = mockRes()
    await serverController.buildServer(req, res)
    expect(res.status).toHaveBeenCalledWith(429)
  })

  it('bypasses the creation-window limit when the admin master password is supplied', async () => {
    vi.mocked(isMasterPassword).mockReturnValueOnce(true)
    makeDbMock({ countServersSince: vi.fn().mockResolvedValue(1) })
    vi.mocked(dockerService.createContainer).mockResolvedValue('new-container-id')
    const req = mockReq({ ...validBody, admin_password: 'master-key' })
    const res = mockRes()
    await serverController.buildServer(req, res)
    expect(res.status).toHaveBeenCalledWith(200)
  })

  it('allows creation when nothing has been created within the window', async () => {
    makeDbMock({ countServersSince: vi.fn().mockResolvedValue(0) })
    vi.mocked(dockerService.createContainer).mockResolvedValue('new-container-id')
    const req = mockReq(validBody)
    const res = mockRes()
    await serverController.buildServer(req, res)
    expect(res.status).toHaveBeenCalledWith(200)
  })

  it('respects a custom MAX_SERVERS_WITHIN_WINDOW override', async () => {
    process.env.MAX_SERVERS_WITHIN_WINDOW = '5'
    makeDbMock({ countServersSince: vi.fn().mockResolvedValue(4) })
    vi.mocked(dockerService.createContainer).mockResolvedValue('new-container-id')
    const req = mockReq(validBody)
    const res = mockRes()
    await serverController.buildServer(req, res)
    expect(res.status).toHaveBeenCalledWith(200)
  })

  it('passes a Date computed from CREATE_SERVER_WINDOW_MINUTES to countServersSince', async () => {
    const db = makeDbMock()
    const req = mockReq(validBody)
    const res = mockRes()
    await serverController.buildServer(req, res)
    expect(db.countServersSince).toHaveBeenCalledWith(expect.any(Date))
  })

  // ── RAM checks ────────────────────────────────────────────────────────────

  it('returns 400 when there is not enough RAM available', async () => {
    // total is mocked to 16384MB; reserving 15000MB leaves no room for a 4096MB request
    makeDbMock({ sumRamAllocForActiveServers: vi.fn().mockResolvedValue(15000) })
    const req = mockReq(validBody)
    const res = mockRes()
    await serverController.buildServer(req, res)
    expect(res.status).toHaveBeenCalledWith(400)
    expect(dockerService.createContainer).not.toHaveBeenCalled()
  })

  it('allows creation when there is enough RAM available', async () => {
    makeDbMock({ sumRamAllocForActiveServers: vi.fn().mockResolvedValue(0) })
    vi.mocked(dockerService.createContainer).mockResolvedValue('new-container-id')
    const req = mockReq(validBody)
    const res = mockRes()
    await serverController.buildServer(req, res)
    expect(res.status).toHaveBeenCalledWith(200)
  })

  it('checks RAM before creating the container', async () => {
    makeDbMock({ sumRamAllocForActiveServers: vi.fn().mockResolvedValue(15000) })
    const req = mockReq(validBody)
    const res = mockRes()
    await serverController.buildServer(req, res)
    expect(dockerService.createContainer).not.toHaveBeenCalled()
  })
})

// ── changeServerStatus ────────────────────────────────────────────────────────

describe('changeServerStatus', () => {
  it('returns 400 when body is invalid', async () => {
    makeDbMock()
    const req = mockReq({ bad: 'data' })
    const res = mockRes()
    await serverController.changeServerStatus(req, res)
    expect(res.status).toHaveBeenCalledWith(400)
  })

  it('returns 404 when server is not found', async () => {
    makeDbMock({ getServerByName: vi.fn().mockResolvedValue(null) })
    const req = mockReq({ name: 'ghost', action: 'started' })
    const res = mockRes()
    await serverController.changeServerStatus(req, res)
    expect(res.status).toHaveBeenCalledWith(404)
  })

  it('returns 400 for an invalid action value', async () => {
    makeDbMock()
    const req = mockReq({ name: 'test-server', action: 'explode' })
    const res = mockRes()
    await serverController.changeServerStatus(req, res)
    expect(res.status).toHaveBeenCalledWith(400)
  })

  it('calls startContainer and returns 200 for "started" action', async () => {
    makeDbMock({ getServerByName: vi.fn().mockResolvedValue(stoppedServer) })
    vi.mocked(dockerService.startContainer).mockResolvedValue(undefined)

    const req = mockReq({ name: 'test-server', action: 'started' })
    const res = mockRes()
    await serverController.changeServerStatus(req, res)

    expect(dockerService.startContainer).toHaveBeenCalledWith(stoppedServer.core_settings.container_id)
    expect(res.status).toHaveBeenCalledWith(200)
  })

  it('calls startContainer and returns 200 for "starting" action', async () => {
    makeDbMock({ getServerByName: vi.fn().mockResolvedValue(stoppedServer) })
    vi.mocked(dockerService.startContainer).mockResolvedValue(undefined)

    const req = mockReq({ name: 'test-server', action: 'starting' })
    const res = mockRes()
    await serverController.changeServerStatus(req, res)

    expect(dockerService.startContainer).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(200)
  })

  // ── RAM checks ────────────────────────────────────────────────────────────

  it('returns 400 and does not start the container when there is not enough RAM', async () => {
    makeDbMock({
      getServerByName: vi.fn().mockResolvedValue(stoppedServer),
      sumRamAllocForActiveServers: vi.fn().mockResolvedValue(15000),
    })
    const req = mockReq({ name: 'test-server', action: 'started' })
    const res = mockRes()
    await serverController.changeServerStatus(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(dockerService.startContainer).not.toHaveBeenCalled()
  })

  it('starts the container when there is enough RAM', async () => {
    makeDbMock({
      getServerByName: vi.fn().mockResolvedValue(stoppedServer),
      sumRamAllocForActiveServers: vi.fn().mockResolvedValue(0),
    })
    vi.mocked(dockerService.startContainer).mockResolvedValue(undefined)
    const req = mockReq({ name: 'test-server', action: 'started' })
    const res = mockRes()
    await serverController.changeServerStatus(req, res)

    expect(dockerService.startContainer).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(200)
  })

  it('does not RAM-check a "stopped" action', async () => {
    const db = makeDbMock({ getServerByName: vi.fn().mockResolvedValue(startedServer) })
    vi.mocked(dockerService.stopContainer).mockResolvedValue(undefined)
    const req = mockReq({ name: 'test-server', action: 'stopped' })
    const res = mockRes()
    await serverController.changeServerStatus(req, res)

    expect(db.sumRamAllocForActiveServers).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(200)
  })

  it('calls stopContainer and returns 200 for "stopped" action', async () => {
    makeDbMock({ getServerByName: vi.fn().mockResolvedValue(startedServer) })
    vi.mocked(dockerService.stopContainer).mockResolvedValue(undefined)

    const req = mockReq({ name: 'test-server', action: 'stopped' })
    const res = mockRes()
    await serverController.changeServerStatus(req, res)

    expect(dockerService.stopContainer).toHaveBeenCalledWith(startedServer.core_settings.container_id)
    expect(res.status).toHaveBeenCalledWith(200)
  })

  it('calls stopContainer and returns 200 for "stopping" action', async () => {
    makeDbMock({ getServerByName: vi.fn().mockResolvedValue(startedServer) })
    vi.mocked(dockerService.stopContainer).mockResolvedValue(undefined)

    const req = mockReq({ name: 'test-server', action: 'stopping' })
    const res = mockRes()
    await serverController.changeServerStatus(req, res)

    expect(dockerService.stopContainer).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(200)
  })

  it('returns 500 when startContainer throws', async () => {
    makeDbMock({ getServerByName: vi.fn().mockResolvedValue(stoppedServer) })
    vi.mocked(dockerService.startContainer).mockRejectedValue(new Error('Container failed'))

    const req = mockReq({ name: 'test-server', action: 'started' })
    const res = mockRes()
    await serverController.changeServerStatus(req, res)
    expect(res.status).toHaveBeenCalledWith(500)
  })

  it('updates DB status after starting', async () => {
    const db = makeDbMock({ getServerByName: vi.fn().mockResolvedValue(stoppedServer) })
    vi.mocked(dockerService.startContainer).mockResolvedValue(undefined)

    const req = mockReq({ name: 'test-server', action: 'started' })
    const res = mockRes()
    await serverController.changeServerStatus(req, res)

    expect(db.updateServerStatus).toHaveBeenCalledWith(1, 'started')
  })

  it('updates DB status after stopping', async () => {
    const db = makeDbMock({ getServerByName: vi.fn().mockResolvedValue(startedServer) })
    vi.mocked(dockerService.stopContainer).mockResolvedValue(undefined)

    const req = mockReq({ name: 'test-server', action: 'stopped' })
    const res = mockRes()
    await serverController.changeServerStatus(req, res)

    expect(db.updateServerStatus).toHaveBeenCalledWith(1, 'stopped')
  })
})

// ── deleteServer ──────────────────────────────────────────────────────────────

describe('deleteServer', () => {
  it('returns 400 when body is invalid', async () => {
    makeDbMock()
    const req = mockReq({ bad: 'data' })
    const res = mockRes()
    await serverController.deleteServer(req, res)
    expect(res.status).toHaveBeenCalledWith(400)
  })

  it('returns 400 when password is missing', async () => {
    makeDbMock({ getServerByName: vi.fn().mockResolvedValue(stoppedServer) })
    const req = mockReq({ name: 'test-server', created_by: 'admin' })
    const res = mockRes()
    await serverController.deleteServer(req, res)
    expect(res.status).toHaveBeenCalledWith(400)
  })

  it('returns 404 when server is not found', async () => {
    makeDbMock({ getServerByName: vi.fn().mockResolvedValue(null) })
    const req = mockReq({ name: 'ghost', created_by: 'admin', password: 'secret' })
    const res = mockRes()
    await serverController.deleteServer(req, res)
    expect(res.status).toHaveBeenCalledWith(404)
  })

  it('returns 401 on wrong password and does not delete', async () => {
    const db = makeDbMock({ getServerByName: vi.fn().mockResolvedValue(stoppedServer) })
    vi.mocked(verifyManagerPassword).mockResolvedValueOnce(false)

    const req = mockReq({ name: 'test-server', created_by: 'admin', password: 'wrong' })
    const res = mockRes()
    await serverController.deleteServer(req, res)

    expect(res.status).toHaveBeenCalledWith(401)
    expect(dockerService.deleteContainer).not.toHaveBeenCalled()
    expect(db.deleteServerRow).not.toHaveBeenCalled()
  })

  it('calls deleteContainer with the server container ID', async () => {
    makeDbMock({ getServerByName: vi.fn().mockResolvedValue(stoppedServer) })
    vi.mocked(dockerService.deleteContainer).mockResolvedValue(false)

    const req = mockReq({ name: 'test-server', created_by: 'admin', password: 'secret' })
    const res = mockRes()
    await serverController.deleteServer(req, res)

    expect(dockerService.deleteContainer).toHaveBeenCalledWith(stoppedServer.core_settings.container_id)
  })

  it('returns 200 on successful deletion', async () => {
    makeDbMock({ getServerByName: vi.fn().mockResolvedValue(stoppedServer) })
    vi.mocked(dockerService.deleteContainer).mockResolvedValue(false)

    const req = mockReq({ name: 'test-server', created_by: 'admin', password: 'secret' })
    const res = mockRes()
    await serverController.deleteServer(req, res)
    expect(res.status).toHaveBeenCalledWith(200)
  })

  it('deletes the DB row after removing the container', async () => {
    const db = makeDbMock({ getServerByName: vi.fn().mockResolvedValue(stoppedServer) })
    vi.mocked(dockerService.deleteContainer).mockResolvedValue(false)

    const req = mockReq({ name: 'test-server', created_by: 'admin', password: 'secret' })
    const res = mockRes()
    await serverController.deleteServer(req, res)

    expect(db.deleteServerRow).toHaveBeenCalledWith(1)
  })

  it('returns 500 when deleteContainer throws', async () => {
    makeDbMock({ getServerByName: vi.fn().mockResolvedValue(stoppedServer) })
    vi.mocked(dockerService.deleteContainer).mockRejectedValue(new Error('Docker error'))

    const req = mockReq({ name: 'test-server', created_by: 'admin', password: 'secret' })
    const res = mockRes()
    await serverController.deleteServer(req, res)
    expect(res.status).toHaveBeenCalledWith(500)
  })
})

// ── getServerList ─────────────────────────────────────────────────────────────

describe('getServerList', () => {
  it('returns 200 with the server list', async () => {
    makeDbMock({ getServerList: vi.fn().mockResolvedValue([stoppedServer]) })
    const req = mockReq()
    const res = mockRes()
    await serverController.getServerList(req, res)
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith([stoppedServer])
  })

  it('returns 200 with null when no servers exist', async () => {
    makeDbMock({ getServerList: vi.fn().mockResolvedValue(null) })
    const req = mockReq()
    const res = mockRes()
    await serverController.getServerList(req, res)
    expect(res.status).toHaveBeenCalledWith(200)
  })

  it('returns 500 when db throws', async () => {
    makeDbMock({ getServerList: vi.fn().mockRejectedValue(new Error('DB down')) })
    const req = mockReq()
    const res = mockRes()
    await serverController.getServerList(req, res)
    expect(res.status).toHaveBeenCalledWith(500)
  })
})

// ── getHealthCheck ────────────────────────────────────────────────────────────

describe('getHealthCheck', () => {
  it('returns 200 with server counts', async () => {
    makeDbMock({
      getAllServers: vi.fn().mockResolvedValue([stoppedServer, startedServer]),
      getServersByStatus: vi.fn().mockResolvedValue([startedServer]),
    })
    vi.mocked(dockerService.getDockerStats).mockResolvedValue([])

    const req = mockReq()
    const res = mockRes()
    await serverController.getHealthCheck(req, res)

    expect(res.status).toHaveBeenCalledWith(200)
    const payload = (res.json as ReturnType<typeof vi.fn>).mock.calls[0][0]
    expect(payload.servers.total).toBe(2)
    expect(payload.servers.running).toBe(1)
    expect(payload.servers.available).toBe(1)
  })

  it('includes containers array in response', async () => {
    makeDbMock({
      getAllServers: vi.fn().mockResolvedValue([]),
      getServersByStatus: vi.fn().mockResolvedValue([]),
    })
    vi.mocked(dockerService.getDockerStats).mockResolvedValue([])

    const req = mockReq()
    const res = mockRes()
    await serverController.getHealthCheck(req, res)

    const payload = (res.json as ReturnType<typeof vi.fn>).mock.calls[0][0]
    expect(Array.isArray(payload.containers)).toBe(true)
  })

  it('returns 500 when getAllServers throws', async () => {
    makeDbMock({
      getAllServers: vi.fn().mockRejectedValue(new Error('DB down')),
      getServersByStatus: vi.fn().mockResolvedValue([]),
    })

    const req = mockReq()
    const res = mockRes()
    await serverController.getHealthCheck(req, res)
    expect(res.status).toHaveBeenCalledWith(500)
  })
})