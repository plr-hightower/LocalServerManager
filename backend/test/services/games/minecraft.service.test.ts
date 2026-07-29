import { describe, it, expect } from 'vitest'
import { GameService } from '../../../src/services/games/minecraft.service.js'
import type { ServerSettingsS, MinecraftSettingsS } from '@hightower/shared'

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
    JAVA_VERSION: '21',
    LOADER_VERSION: 'LATEST',
  },
}

const withSettings = (over: Partial<MinecraftSettingsS>): ServerSettingsS => ({
  ...baseServer,
  game_settings: { ...baseServer.game_settings, ...over } as MinecraftSettingsS,
})

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
      const manifest = await GameService.getGameManifest(withSettings({ VERSION: '1.21.0' }))
      expect(manifest.env).toContain('VERSION=1.21.0')
    })

    it('reflects custom TYPE in env', async () => {
      const manifest = await GameService.getGameManifest(withSettings({ TYPE: 'VANILLA' }))
      expect(manifest.env).toContain('TYPE=VANILLA')
    })

    it('builds the image tag from JAVA_VERSION', async () => {
      const manifest = await GameService.getGameManifest(withSettings({ JAVA_VERSION: '17' }))
      expect(manifest.image).toBe('itzg/minecraft-server:2026.7.0-java17')
    })

    it('falls back to java21 when JAVA_VERSION is missing on an older server', async () => {
      const legacy = withSettings({})
      delete (legacy.game_settings as Partial<MinecraftSettingsS>).JAVA_VERSION
      const manifest = await GameService.getGameManifest(legacy)
      expect(manifest.image).toBe('itzg/minecraft-server:2026.7.0-java21')
    })

    it('never produces an undefined java tag', async () => {
      const legacy = withSettings({})
      delete (legacy.game_settings as Partial<MinecraftSettingsS>).JAVA_VERSION
      const manifest = await GameService.getGameManifest(legacy)
      expect(manifest.image).not.toContain('undefined')
    })

    it('supports FORGE as a TYPE', async () => {
      const manifest = await GameService.getGameManifest(withSettings({ TYPE: 'FORGE' }))
      expect(manifest.env).toContain('TYPE=FORGE')
    })

    it('pins FORGE_VERSION when a loader version is given', async () => {
      const manifest = await GameService.getGameManifest(
        withSettings({ TYPE: 'FORGE', VERSION: '1.19.2', LOADER_VERSION: '43.4.4' }),
      )
      expect(manifest.env).toContain('FORGE_VERSION=43.4.4')
    })

    it('uses the loader env var matching the TYPE', async () => {
      const cases: [MinecraftSettingsS['TYPE'], string][] = [
        ['FORGE', 'FORGE_VERSION'],
        ['NEOFORGE', 'NEOFORGE_VERSION'],
        ['FABRIC', 'FABRIC_LOADER_VERSION'],
        ['QUILT', 'QUILT_LOADER_VERSION'],
      ]
      for (const [type, key] of cases) {
        const manifest = await GameService.getGameManifest(
          withSettings({ TYPE: type, LOADER_VERSION: '1.2.3' }),
        )
        expect(manifest.env).toContain(`${key}=1.2.3`)
      }
    })

    it('omits the loader env var when LOADER_VERSION is LATEST', async () => {
      const manifest = await GameService.getGameManifest(
        withSettings({ TYPE: 'FORGE', LOADER_VERSION: 'LATEST' }),
      )
      expect(manifest.env.some(e => e.startsWith('FORGE_VERSION='))).toBe(false)
    })

    it('omits the loader env var for loaderless types', async () => {
      for (const type of ['VANILLA', 'PAPER'] as const) {
        const manifest = await GameService.getGameManifest(
          withSettings({ TYPE: type, LOADER_VERSION: '1.2.3' }),
        )
        expect(manifest.env.some(e => e.endsWith('=1.2.3'))).toBe(false)
      }
    })

    it('omits the loader env var when LOADER_VERSION is missing on an older server', async () => {
      const legacy = withSettings({ TYPE: 'FORGE' })
      delete (legacy.game_settings as Partial<MinecraftSettingsS>).LOADER_VERSION
      const manifest = await GameService.getGameManifest(legacy)
      expect(manifest.env.some(e => e.startsWith('FORGE_VERSION='))).toBe(false)
    })

    it('sets the JVM heap below the container limit', async () => {
      const manifest = await GameService.getGameManifest(baseServer)
      expect(manifest.env).toContain('MEMORY=3072M')
    })

    it('scales the heap with ram_alloc_mb', async () => {
      const cases: [number, string][] = [
        [1024, 'MEMORY=768M'],
        [2048, 'MEMORY=1536M'],
        [4096, 'MEMORY=3072M'],
        [8192, 'MEMORY=6144M'],
      ]
      for (const [ram, expected] of cases) {
        const manifest = await GameService.getGameManifest({
          ...baseServer,
          core_settings: { ...baseServer.core_settings, ram_alloc_mb: ram as 1024 },
        })
        expect(manifest.env).toContain(expected)
      }
    })

    it('always leaves headroom under the container limit', async () => {
      for (const ram of [1024, 2048, 4096, 8192] as const) {
        const manifest = await GameService.getGameManifest({
          ...baseServer,
          core_settings: { ...baseServer.core_settings, ram_alloc_mb: ram },
        })
        const heap = Number(manifest.env.find(e => e.startsWith('MEMORY='))!.slice(7, -1))
        expect(heap).toBeLessThan(ram)
      }
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