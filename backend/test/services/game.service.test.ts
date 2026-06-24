import { describe, it, expect, vi } from 'vitest'
import type { ServerSettingsS, GameManifestS } from '@hightower/shared'

const mockManifest: GameManifestS = {
  image: 'itzg/minecraft-server:2024.1.0',
  env: ['EULA=TRUE', 'TYPE=FABRIC', 'VERSION=1.20.1', 'MOTD=Test Server', 'MAX_PLAYERS=10', 'VIEW_DISTANCE=12'],
  protocols: ['tcp'],
  worldVolumes: [{ path: '/data' }],
}

vi.mock('../../src/services/games/minecraft.service.js', () => ({
  GameService: {
    getGameManifest: vi.fn().mockResolvedValue(mockManifest),
    getDefaultPort: vi.fn().mockReturnValue('25565'),
    getHostPort: vi.fn().mockReturnValue(25565),
  },
}))

import { getGameService, getManifest } from '../../src/services/game.service.js'

const baseServer: ServerSettingsS = {
  core_settings: {
    server_id: 1,
    name: 'test-server',
    game_container: 'minecraft',
    container_id: 'abc123def456abc123def456abc123def456abc123def456abc123def456abc1',
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
    MOTD: 'Test Server',
    MAX_PLAYERS: 10,
    VIEW_DISTANCE: 12,
  },
}

describe('getGameService', () => {
  it('returns an object for minecraft', async () => {
    const service = await getGameService(baseServer)
    expect(service).toBeDefined()
  })

  it('returned service has getGameManifest method', async () => {
    const service = await getGameService(baseServer)
    expect(typeof service.getGameManifest).toBe('function')
  })

  it('returned service has getDefaultPort method', async () => {
    const service = await getGameService(baseServer)
    expect(typeof service.getDefaultPort).toBe('function')
  })

  it('returned service has getHostPort method', async () => {
    const service = await getGameService(baseServer)
    expect(typeof service.getHostPort).toBe('function')
  })
})

describe('getManifest', () => {
  it('returns a manifest with an image string', async () => {
    const manifest = await getManifest(baseServer)
    expect(typeof manifest.image).toBe('string')
    expect(manifest.image.length).toBeGreaterThan(0)
  })

  it('returns a manifest with an env array', async () => {
    const manifest = await getManifest(baseServer)
    expect(Array.isArray(manifest.env)).toBe(true)
    expect(manifest.env.length).toBeGreaterThan(0)
  })

  it('returns a manifest with protocols array', async () => {
    const manifest = await getManifest(baseServer)
    expect(Array.isArray(manifest.protocols)).toBe(true)
  })

  it('returns a manifest with worldVolumes array', async () => {
    const manifest = await getManifest(baseServer)
    expect(Array.isArray(manifest.worldVolumes)).toBe(true)
  })

  it('delegates to the game-specific service getGameManifest', async () => {
    const manifest = await getManifest(baseServer)
    expect(manifest).toEqual(mockManifest)
  })
})