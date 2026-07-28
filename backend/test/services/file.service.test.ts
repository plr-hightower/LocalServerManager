import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { ServerSettingsS } from '@hightower/shared'

const mocks = vi.hoisted(() => ({
  getWorldHostPaths: vi.fn(),
  fs: {
    stat: vi.fn(),
    readdir: vi.fn(),
    rm: vi.fn(),
    mkdir: vi.fn(),
  },
}))

vi.mock('../../src/services/world.service.js', () => ({
  getWorldHostPaths: mocks.getWorldHostPaths,
}))

vi.mock('fs/promises', () => ({
  default: mocks.fs,
}))

import { listDirectory, deleteEntry, prepareUploadTarget } from '../../src/services/file.service.js'

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

beforeEach(() => {
  vi.clearAllMocks()
  mocks.getWorldHostPaths.mockResolvedValue(['/var/lib/docker/volumes/test/_data'])
})

describe('listDirectory', () => {
  it('lists synthetic volume folders at the root', async () => {
    mocks.getWorldHostPaths.mockResolvedValue(['/vol/a', '/vol/b'])
    mocks.fs.stat.mockResolvedValue({ mtimeMs: 123, isDirectory: () => true })

    const entries = await listDirectory(serverWith(null), '')

    expect(entries.map(e => e.name)).toEqual(['vol0', 'vol1'])
    expect(entries.every(e => e.type === 'dir')).toBe(true)
  })

  it('lists directory contents with dirs first', async () => {
    mocks.fs.readdir.mockResolvedValue(['file.txt', 'world'])
    mocks.fs.stat.mockImplementation((p: string) =>
      Promise.resolve(
        p.endsWith('world')
          ? { isDirectory: () => true, size: 0, mtimeMs: 1 }
          : { isDirectory: () => false, size: 100, mtimeMs: 2 },
      ),
    )

    const entries = await listDirectory(serverWith(null), 'vol0')

    expect(entries[0]).toMatchObject({ name: 'world', type: 'dir' })
    expect(entries[1]).toMatchObject({ name: 'file.txt', type: 'file', size: 100 })
  })

  it('throws on an unknown volume segment', async () => {
    await expect(listDirectory(serverWith(null), 'notavol')).rejects.toThrow('Unknown volume')
  })

  it('throws on an out-of-range volume index', async () => {
    await expect(listDirectory(serverWith(null), 'vol9')).rejects.toThrow('out of range')
  })
})

describe('prepareUploadTarget', () => {
  beforeEach(() => {
    mocks.fs.mkdir.mockResolvedValue(undefined)
  })

  it('keeps a plain file directly in the target directory', async () => {
    const dest = await prepareUploadTarget('/vol/a', 'mod.jar')

    expect(dest).toBe('/vol/a/mod.jar')
    expect(mocks.fs.mkdir).toHaveBeenCalledWith('/vol/a', { recursive: true })
  })

  it('recreates the folder structure of an uploaded folder', async () => {
    const dest = await prepareUploadTarget('/vol/a', 'pack/config/opts.toml')

    expect(dest).toBe('/vol/a/pack/config/opts.toml')
    expect(mocks.fs.mkdir).toHaveBeenCalledWith('/vol/a/pack/config', { recursive: true })
  })

  it('strips traversal segments from the relative name', async () => {
    const dest = await prepareUploadTarget('/vol/a', '../../etc/passwd')

    expect(dest).toBe('/vol/a/etc/passwd')
  })

  it('rejects a name with no usable segments', async () => {
    await expect(prepareUploadTarget('/vol/a', '../..')).rejects.toThrow('Invalid upload file name')
    expect(mocks.fs.mkdir).not.toHaveBeenCalled()
  })
})

describe('deleteEntry path safety', () => {
  it('rejects a traversal outside the volume', async () => {
    await expect(deleteEntry(serverWith(null), 'vol0/../../etc')).rejects.toThrow('escapes')
    expect(mocks.fs.rm).not.toHaveBeenCalled()
  })

  it('refuses to delete a volume root', async () => {
    await expect(deleteEntry(serverWith(null), 'vol0')).rejects.toThrow('volume root')
    expect(mocks.fs.rm).not.toHaveBeenCalled()
  })

  it('deletes a valid nested path', async () => {
    mocks.fs.rm.mockResolvedValue(undefined)
    await deleteEntry(serverWith(null), 'vol0/world/level.dat')
    expect(mocks.fs.rm).toHaveBeenCalledWith(
      '/var/lib/docker/volumes/test/_data/world/level.dat',
      { recursive: true, force: false },
    )
  })
})
