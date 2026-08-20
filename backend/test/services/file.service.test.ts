import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { ServerSettingsS } from '@hightower/shared'

const mocks = vi.hoisted(() => ({
  getWorldHostPaths: vi.fn(),
  streamZip: vi.fn(),
  fs: {
    stat: vi.fn(),
    readdir: vi.fn(),
    rm: vi.fn(),
    mkdir: vi.fn(),
    chown: vi.fn(),
    rename: vi.fn(),
    copyFile: vi.fn(),
  },
}))

vi.mock('../../src/services/world.service.js', () => ({
  getWorldHostPaths: mocks.getWorldHostPaths,
  streamZip: mocks.streamZip,
}))

vi.mock('fs/promises', () => ({
  default: mocks.fs,
}))

import { listDirectory, deleteEntry, prepareUploadTarget, writeUploadedFile, streamPathDownload } from '../../src/services/file.service.js'

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

describe('writeUploadedFile ownership', () => {
  const owner = { uid: 1000, gid: 1000 }

  beforeEach(() => {
    mocks.fs.mkdir.mockResolvedValue(undefined)
    mocks.fs.chown.mockResolvedValue(undefined)
    mocks.fs.rename.mockResolvedValue(undefined)
    mocks.fs.readdir.mockResolvedValue([])
  })

  it('hands the written file to the game uid', async () => {
    await writeUploadedFile('/vol/a', 'mod.jar', '/tmp/1', owner)
    expect(mocks.fs.chown).toHaveBeenCalledWith('/vol/a/mod.jar', 1000, 1000)
  })

  it('moves the temp file into place', async () => {
    await writeUploadedFile('/vol/a', 'mod.jar', '/tmp/1', owner)
    expect(mocks.fs.rename).toHaveBeenCalledWith('/tmp/1', '/vol/a/mod.jar')
  })

  it('falls back to copy when rename crosses devices', async () => {
    mocks.fs.rename.mockRejectedValue(Object.assign(new Error('EXDEV'), { code: 'EXDEV' }))
    mocks.fs.copyFile.mockResolvedValue(undefined)
    mocks.fs.rm.mockResolvedValue(undefined)

    await writeUploadedFile('/vol/a', 'mod.jar', '/tmp/1', owner)

    expect(mocks.fs.copyFile).toHaveBeenCalledWith('/tmp/1', '/vol/a/mod.jar')
    expect(mocks.fs.chown).toHaveBeenCalledWith('/vol/a/mod.jar', 1000, 1000)
  })

  it('chowns directories it had to create', async () => {
    mocks.fs.mkdir.mockResolvedValue('/vol/a/world')
    await writeUploadedFile('/vol/a', 'world/region/r.0.0.mca', '/tmp/1', owner)
    expect(mocks.fs.chown).toHaveBeenCalledWith('/vol/a/world', 1000, 1000)
  })

  it('does not chown directories that already existed', async () => {
    mocks.fs.mkdir.mockResolvedValue(undefined)
    await writeUploadedFile('/vol/a', 'world/region/r.0.0.mca', '/tmp/1', owner)
    expect(mocks.fs.chown).not.toHaveBeenCalledWith('/vol/a/world', 1000, 1000)
  })

  it('walks into created subdirectories', async () => {
    mocks.fs.mkdir.mockResolvedValue('/vol/a/world')
    mocks.fs.readdir.mockResolvedValueOnce([{ name: 'region', isDirectory: () => true }])
    mocks.fs.readdir.mockResolvedValueOnce([{ name: 'r.0.0.mca', isDirectory: () => false }])

    await writeUploadedFile('/vol/a', 'world/region/r.0.0.mca', '/tmp/1', owner)

    expect(mocks.fs.chown).toHaveBeenCalledWith('/vol/a/world/region', 1000, 1000)
    expect(mocks.fs.chown).toHaveBeenCalledWith('/vol/a/world/region/r.0.0.mca', 1000, 1000)
  })

  it('uses the uid the game asked for, not a hardcoded one', async () => {
    await writeUploadedFile('/vol/a', 'mod.jar', '/tmp/1', { uid: 0, gid: 0 })
    expect(mocks.fs.chown).toHaveBeenCalledWith('/vol/a/mod.jar', 0, 0)
  })
})

describe('streamPathDownload', () => {
  function mockRes() {
    return { download: vi.fn() } as unknown as import('express').Response
  }

  it('sends a file straight to the browser', async () => {
    mocks.fs.stat.mockResolvedValue({ isDirectory: () => false })
    const res = mockRes()

    await streamPathDownload(serverWith(null), res, 'vol0/world/level.dat')

    expect(res.download).toHaveBeenCalledWith(
      '/var/lib/docker/volumes/test/_data/world/level.dat',
      'level.dat',
      { dotfiles: 'allow' },
    )
    expect(mocks.streamZip).not.toHaveBeenCalled()
  })

  it('sends a dotfile instead of 404ing on it', async () => {
    mocks.fs.stat.mockResolvedValue({ isDirectory: () => false })
    const res = mockRes()

    await streamPathDownload(serverWith(null), res, 'vol0/.fabric-manifest.json')

    expect(res.download).toHaveBeenCalledWith(
      '/var/lib/docker/volumes/test/_data/.fabric-manifest.json',
      '.fabric-manifest.json',
      { dotfiles: 'allow' },
    )
  })

  it('zips a folder under its own name', async () => {
    mocks.fs.stat.mockResolvedValue({ isDirectory: () => true })
    const res = mockRes()

    await streamPathDownload(serverWith(null), res, 'vol0/world/region')

    expect(mocks.streamZip).toHaveBeenCalledWith(res, 'region.zip', [
      { src: '/var/lib/docker/volumes/test/_data/world/region', name: 'region' },
    ])
    expect(res.download).not.toHaveBeenCalled()
  })

  it('rejects a traversal outside the volume', async () => {
    const res = mockRes()

    await expect(streamPathDownload(serverWith(null), res, 'vol0/../../etc/passwd')).rejects.toThrow('escapes')

    expect(res.download).not.toHaveBeenCalled()
    expect(mocks.streamZip).not.toHaveBeenCalled()
  })

  it('rejects an unknown volume', async () => {
    await expect(streamPathDownload(serverWith(null), mockRes(), 'notavol/file')).rejects.toThrow('Unknown volume')
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
