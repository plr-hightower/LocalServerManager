import { describe, it, expect } from 'vitest'
import { GameService } from '../../../src/services/games/minecraft.service.js'
import type { ServerSettingsS } from '@hightower/shared'

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

describe('GameService (minecraft)', () => {
  describe('getDefaultPort', () => {
    it('returns the string "25565"', () => {
      expect(GameService.getDefaultPort()).toBe('25565')
    })

    it('returns a string, not a number', () => {
      expect(typeof GameService.getDefaultPort()).toBe('string')
    })
  })

  describe('getHostPort', () => {
    it('returns 25565 when no ports are used', () => {
      expect(GameService.getHostPort(new Set())).toBe(25565)
    })

    it('returns the next free port when the base is taken', () => {
      expect(GameService.getHostPort(new Set([25565]))).toBe(25566)
    })

    it('fills a gap left by a deleted server', () => {
      expect(GameService.getHostPort(new Set([25565, 25567]))).toBe(25566)
    })

    it('skips a run of used ports', () => {
      expect(GameService.getHostPort(new Set([25565, 25566, 25567]))).toBe(25568)
    })

    it('ignores ports belonging to other games', () => {
      expect(GameService.getHostPort(new Set([7000, 8211]))).toBe(25565)
    })
  })

  describe('getGameManifest', () => {
    it('returns the correct Docker image', async () => {
      const manifest = await GameService.getGameManifest(baseServer)
      expect(manifest.image).toBe('itzg/minecraft-server:2026.7.0-java21')
    })

    it('includes tcp in protocols', async () => {
      const manifest = await GameService.getGameManifest(baseServer)
      expect(manifest.protocols).toContain('tcp')
    })

    it('includes worldVolumes with /data path', async () => {
      const manifest = await GameService.getGameManifest(baseServer)
      expect(manifest.worldVolumes).toEqual([{ path: '/data' }])
    })

    it('all env vars follow KEY=VALUE format', async () => {
      const manifest = await GameService.getGameManifest(baseServer)
      for (const env of manifest.env) {
        expect(env).toMatch(/^[A-Z0-9_]+=.+$/)
      }
    })

    it('includes EULA from server settings', async () => {
      const manifest = await GameService.getGameManifest(baseServer)
      expect(manifest.env).toContain('EULA=TRUE')
    })

    it('includes VERSION from server settings', async () => {
      const manifest = await GameService.getGameManifest(baseServer)
      expect(manifest.env).toContain('VERSION=1.20.1')
    })

    it('includes TYPE from server settings', async () => {
      const manifest = await GameService.getGameManifest(baseServer)
      expect(manifest.env).toContain('TYPE=FABRIC')
    })

    it('includes MAX_PLAYERS env var', async () => {
      const manifest = await GameService.getGameManifest(baseServer)
      expect(manifest.env.some(e => e.startsWith('MAX_PLAYERS='))).toBe(true)
    })

    it('includes VIEW_DISTANCE env var', async () => {
      const manifest = await GameService.getGameManifest(baseServer)
      expect(manifest.env.some(e => e.startsWith('VIEW_DISTANCE='))).toBe(true)
    })

    it('includes MOTD env var', async () => {
      const manifest = await GameService.getGameManifest(baseServer)
      expect(manifest.env.some(e => e.startsWith('MOTD='))).toBe(true)
    })

    it('reflects custom VERSION in env', async () => {
      const custom: ServerSettingsS = {
        ...baseServer,
        game_settings: { ...baseServer.game_settings, VERSION: '1.21.0' },
      }
      const manifest = await GameService.getGameManifest(custom)
      expect(manifest.env).toContain('VERSION=1.21.0')
    })

    it('reflects custom TYPE in env', async () => {
      const custom: ServerSettingsS = {
        ...baseServer,
        game_settings: { ...baseServer.game_settings, TYPE: 'VANILLA' },
      }
      const manifest = await GameService.getGameManifest(custom)
      expect(manifest.env).toContain('TYPE=VANILLA')
    })

    it('resolves without throwing for valid settings', async () => {
      await expect(GameService.getGameManifest(baseServer)).resolves.toBeDefined()
    })

    it('returns an object with image, env, protocols, and worldVolumes', async () => {
      const manifest = await GameService.getGameManifest(baseServer)
      expect(manifest).toHaveProperty('image')
      expect(manifest).toHaveProperty('env')
      expect(manifest).toHaveProperty('protocols')
      expect(manifest).toHaveProperty('worldVolumes')
    })
  })
})