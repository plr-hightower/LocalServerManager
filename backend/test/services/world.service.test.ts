import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PassThrough } from 'node:stream'
import type { ServerSettingsS, GameManifestS } from '@hightower/shared'
import type { Response } from 'express'

const mocks = vi.hoisted(() => {
  const volume = { inspect: vi.fn().mockResolvedValue({ Mountpoint: '/var/lib/docker/volumes/test/_data' }) }
  const dockerInstance = { getVolume: vi.fn().mockReturnValue(volume) }
  return { volume, dockerInstance }
})

vi.mock('dockerode', () => ({
  default: vi.fn().mockImplementation(function () { return mocks.dockerInstance }),
}))

vi.mock('../../src/services/game.service.js', () => ({
  getManifest: vi.fn(),
}))

import { streamWorldDownload, streamZip } from '../../src/services/world.service.js'
import { getManifest } from '../../src/services/game.service.js'

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

// Manifest with no world volumes , lets archiver finalize cleanly without filesystem reads
const emptyVolumeManifest: GameManifestS = {
  image: 'itzg/minecraft-server:2024.1.0',
  env: ['EULA=TRUE'],
  protocols: ['tcp'],
  worldVolumes: [],
}

// archiver.pipe(res) requires res to implement the Writable stream interface
function mockRes(): Response {
  const pt = new PassThrough()
  pt.resume()
  return {
    setHeader: vi.fn(),
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    headersSent: false,
    destroy: vi.fn(),
    write: pt.write.bind(pt),
    end: pt.end.bind(pt),
    on: pt.on.bind(pt),
    once: pt.once.bind(pt),
    emit: pt.emit.bind(pt),
    removeListener: pt.removeListener.bind(pt),
    removeAllListeners: pt.removeAllListeners.bind(pt),
    writable: true,
    writableEnded: false,
  } as unknown as Response
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(getManifest).mockResolvedValue(emptyVolumeManifest)
  mocks.volume.inspect.mockResolvedValue({ Mountpoint: '/var/lib/docker/volumes/test/_data' })
  mocks.dockerInstance.getVolume.mockReturnValue(mocks.volume)
})

describe('streamZip', () => {
  it('sets Content-Type header to application/zip', async () => {
    const res = mockRes()
    await streamZip(res, 'region.zip', [])
    expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'application/zip')
  })

  it('offers the given file name to the browser', async () => {
    const res = mockRes()
    await streamZip(res, 'region.zip', [])
    expect(res.setHeader).toHaveBeenCalledWith(
      'Content-Disposition',
      'attachment; filename="region.zip"'
    )
  })

  it('resolves without throwing when there are no directories', async () => {
    const res = mockRes()
    await expect(streamZip(res, 'empty.zip', [])).resolves.not.toThrow()
  })
})

describe('streamWorldDownload', () => {
  it('sets Content-Type header to application/zip', async () => {
    const res = mockRes()
    await streamWorldDownload(baseServer, res)
    expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'application/zip')
  })

  it('sets Content-Disposition header with the server name', async () => {
    const res = mockRes()
    await streamWorldDownload(baseServer, res)
    expect(res.setHeader).toHaveBeenCalledWith(
      'Content-Disposition',
      'attachment; filename="test-server_world.zip"'
    )
  })

  it('calls getManifest with the server', async () => {
    const res = mockRes()
    await streamWorldDownload(baseServer, res)
    expect(getManifest).toHaveBeenCalledWith(baseServer)
  })

  it('calls getManifest only once (manifest is reused for host paths)', async () => {
    const res = mockRes()
    await streamWorldDownload(baseServer, res)
    expect(getManifest).toHaveBeenCalledTimes(1)
  })

  it('does not inspect Docker volumes when worldVolumes is empty', async () => {
    const res = mockRes()
    await streamWorldDownload(baseServer, res)
    expect(mocks.dockerInstance.getVolume).not.toHaveBeenCalled()
  })

  it('inspects one Docker volume per worldVolume entry', async () => {
    vi.mocked(getManifest).mockResolvedValue({
      ...emptyVolumeManifest,
      worldVolumes: [{ path: '/data' }],
    })
    mocks.volume.inspect.mockResolvedValue({ Mountpoint: '/tmp' })
    const res = mockRes()
    // Don't await full completion , archiver may hang reading /tmp.
    // getVolume is called before archiver starts, so waitFor catches it quickly.
    streamWorldDownload(baseServer, res).catch(() => {})
    await vi.waitFor(() => {
      expect(mocks.dockerInstance.getVolume).toHaveBeenCalledTimes(1)
    })
  })

  it('resolves without throwing when worldVolumes is empty', async () => {
    const res = mockRes()
    await expect(streamWorldDownload(baseServer, res)).resolves.not.toThrow()
  })

  it('throws when Docker volume inspect fails', async () => {
    vi.mocked(getManifest).mockResolvedValue({
      ...emptyVolumeManifest,
      worldVolumes: [{ path: '/data' }],
    })
    mocks.volume.inspect.mockRejectedValue(new Error('Volume not found'))
    const res = mockRes()
    await expect(streamWorldDownload(baseServer, res)).rejects.toThrow('Volume not found')
  })
})