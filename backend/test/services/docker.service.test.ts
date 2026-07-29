import { describe, it, expect, vi, beforeEach } from 'vitest'
import { EventEmitter } from 'node:events'
import type { ServerSettingsS, GameManifestS } from '@hightower/shared'

// hoisted so they're available inside vi.mock factories
const mocks = vi.hoisted(() => {
  const container = {
    id: 'mock-container-id-abc123',
    inspect: vi.fn(),
    start: vi.fn().mockResolvedValue(undefined),
    stop: vi.fn().mockResolvedValue(undefined),
    remove: vi.fn().mockResolvedValue(undefined),
    stats: vi.fn(),
  }
  const image = { inspect: vi.fn() }
  const dockerInstance = {
    getImage: vi.fn().mockReturnValue(image),
    getContainer: vi.fn().mockReturnValue(container),
    createContainer: vi.fn().mockResolvedValue(container),
    listContainers: vi.fn().mockResolvedValue([]),
    getEvents: vi.fn(),
  }
  return { container, image, dockerInstance }
})

vi.mock('dockerode', () => ({
  default: vi.fn().mockImplementation(function () { return mocks.dockerInstance }),
}))

vi.mock('../../src/repository/db.repository.js', () => ({
  DbService: vi.fn(),
}))

import {
  createContainer,
  recreateContainer,
  deleteContainer,
  startContainer,
  stopContainer,
  getDockerStats,
  watchContainerEvents,
  mapDockerState,
  getActualStatuses,
  reconcileStatuses,
} from '../../src/services/docker.service.js'
import { DbService } from '../../src/repository/db.repository.js'

const baseServer: ServerSettingsS = {
  core_settings: {
    server_id: 1,
    name: 'test-server',
    game_container: 'minecraft',
    container_id: 'mock-container-id-abc123',
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

const baseManifest: GameManifestS = {
  image: 'itzg/minecraft-server:2026.7.0-java21',
  env: ['EULA=TRUE', 'TYPE=FABRIC', 'VERSION=1.20.1'],
  protocols: ['tcp'],
  worldVolumes: [{ path: '/data' }],
  supportVolumes: [],
  extraPorts: [],
  useHostPort: false,
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.container.inspect.mockResolvedValue({ State: { Running: false, Paused: false } })
  mocks.container.start.mockResolvedValue(undefined)
  mocks.container.stop.mockResolvedValue(undefined)
  mocks.container.remove.mockResolvedValue(undefined)
  mocks.image.inspect.mockResolvedValue({})
  mocks.dockerInstance.getContainer.mockReturnValue(mocks.container)
  mocks.dockerInstance.createContainer.mockResolvedValue(mocks.container)
  mocks.dockerInstance.listContainers.mockResolvedValue([])
})

describe('createContainer', () => {
  it('throws when default_host_port is missing', async () => {
    const settings: ServerSettingsS = {
      ...baseServer,
      core_settings: { ...baseServer.core_settings, default_host_port: null },
    }
    await expect(createContainer(settings, baseManifest)).rejects.toThrow(
      'core_settings default hostport not set'
    )
  })

  it('throws when host_port is missing', async () => {
    const settings: ServerSettingsS = {
      ...baseServer,
      core_settings: { ...baseServer.core_settings, host_port: null },
    }
    await expect(createContainer(settings, baseManifest)).rejects.toThrow(
      'core_settings default hostport not set'
    )
  })

  it('returns the container ID on success', async () => {
    const id = await createContainer(baseServer, baseManifest)
    expect(id).toBe('mock-container-id-abc123')
  })

  it('calls docker.createContainer with the server name', async () => {
    await createContainer(baseServer, baseManifest)
    const call = mocks.dockerInstance.createContainer.mock.calls[0][0]
    expect(call.name).toBe('test-server')
  })

  it('sets Memory from ram_alloc_mb converted to bytes', async () => {
    await createContainer(baseServer, baseManifest)
    const call = mocks.dockerInstance.createContainer.mock.calls[0][0]
    expect(call.HostConfig.Memory).toBe(4096 * 1024 * 1024)
  })

  it('does not start the container', async () => {
    await createContainer(baseServer, baseManifest)
    expect(mocks.container.start).not.toHaveBeenCalled()
  })

  it('still returns the new container id', async () => {
    const id = await createContainer(baseServer, baseManifest)
    expect(id).toBe(mocks.container.id)
  })

  it('binds the correct host port', async () => {
    await createContainer(baseServer, baseManifest)
    const call = mocks.dockerInstance.createContainer.mock.calls[0][0]
    const bindings = call.HostConfig.PortBindings
    const key = '25565/tcp'
    expect(bindings[key]).toEqual([{ HostPort: '25565' }])
  })

  it('passes env vars from the manifest', async () => {
    await createContainer(baseServer, baseManifest)
    const call = mocks.dockerInstance.createContainer.mock.calls[0][0]
    expect(call.Env).toEqual(baseManifest.env)
  })
})

describe('deleteContainer', () => {
  it('gracefully stops then removes the container', async () => {
    await deleteContainer('mock-container-id-abc123')
    expect(mocks.container.stop).toHaveBeenCalledOnce()
    expect(mocks.container.remove).toHaveBeenCalledOnce()
  })

  it('ignores a 304 "already stopped" and still removes', async () => {
    mocks.container.stop.mockRejectedValue(Object.assign(new Error('already stopped'), { statusCode: 304 }))
    await deleteContainer('mock-container-id-abc123')
    expect(mocks.container.remove).toHaveBeenCalledOnce()
  })

  it('propagates a non-304 stop error and does not remove', async () => {
    mocks.container.stop.mockRejectedValue(Object.assign(new Error('boom'), { statusCode: 500 }))
    await expect(deleteContainer('mock-container-id-abc123')).rejects.toThrow('boom')
    expect(mocks.container.remove).not.toHaveBeenCalled()
  })

  it('calls docker.getContainer with the provided ID', async () => {
    await deleteContainer('some-id')
    expect(mocks.dockerInstance.getContainer).toHaveBeenCalledWith('some-id')
  })
})

describe('recreateContainer', () => {
  it('removes the old container then creates a new one', async () => {
    await recreateContainer(baseServer, baseManifest)
    expect(mocks.container.remove).toHaveBeenCalledOnce()
    expect(mocks.dockerInstance.createContainer).toHaveBeenCalledOnce()
  })

  it('targets the stored container id for removal', async () => {
    await recreateContainer(baseServer, baseManifest)
    expect(mocks.dockerInstance.getContainer).toHaveBeenCalledWith(baseServer.core_settings.container_id)
  })

  it('returns the new container id', async () => {
    const id = await recreateContainer(baseServer, baseManifest)
    expect(id).toBe(mocks.container.id)
  })

  it('does not start the replacement', async () => {
    await recreateContainer(baseServer, baseManifest)
    expect(mocks.container.start).not.toHaveBeenCalled()
  })

  it('reuses the same volume bind so the world survives', async () => {
    await recreateContainer(baseServer, baseManifest)
    const call = mocks.dockerInstance.createContainer.mock.calls[0][0]
    expect(call.HostConfig.Binds).toContain('test-server:/data')
  })

  it('never passes v:true to remove, which would delete the world volume', async () => {
    await recreateContainer(baseServer, baseManifest)
    const removeArg = mocks.container.remove.mock.calls[0]?.[0]
    expect(removeArg?.v).not.toBe(true)
  })

  it('does not create a replacement if removing the old one fails', async () => {
    mocks.container.stop.mockRejectedValue(Object.assign(new Error('boom'), { statusCode: 500 }))
    await expect(recreateContainer(baseServer, baseManifest)).rejects.toThrow('boom')
    expect(mocks.dockerInstance.createContainer).not.toHaveBeenCalled()
  })
})

describe('startContainer', () => {
  it('starts the container when it is not running', async () => {
    mocks.container.inspect.mockResolvedValue({ State: { Running: false } })
    await startContainer('mock-container-id-abc123')
    expect(mocks.container.start).toHaveBeenCalledOnce()
  })

  it('throws when the container is already running', async () => {
    mocks.container.inspect.mockResolvedValue({ State: { Running: true } })
    await expect(startContainer('mock-container-id-abc123')).rejects.toThrow(
      'Container is already running'
    )
  })

  it('does not call start() when already running', async () => {
    mocks.container.inspect.mockResolvedValue({ State: { Running: true } })
    await startContainer('mock-container-id-abc123').catch(() => {})
    expect(mocks.container.start).not.toHaveBeenCalled()
  })
})

describe('stopContainer', () => {
  it('stops the container when it is running', async () => {
    mocks.container.inspect.mockResolvedValue({ State: { Running: true } })
    await stopContainer('mock-container-id-abc123')
    expect(mocks.container.stop).toHaveBeenCalledOnce()
  })

  it('throws when the container is already stopped', async () => {
    mocks.container.inspect.mockResolvedValue({ State: { Running: false } })
    await expect(stopContainer('mock-container-id-abc123')).rejects.toThrow(
      'Container is already stopped'
    )
  })

  it('does not call stop() when already stopped', async () => {
    mocks.container.inspect.mockResolvedValue({ State: { Running: false } })
    await stopContainer('mock-container-id-abc123').catch(() => {})
    expect(mocks.container.stop).not.toHaveBeenCalled()
  })
})

describe('getDockerStats', () => {
  it('returns an empty array when no managed containers are running', async () => {
    mocks.dockerInstance.listContainers.mockResolvedValue([])
    const result = await getDockerStats([baseServer])
    expect(result).toEqual([])
  })

  it('returns stats for each matching running container', async () => {
    mocks.dockerInstance.listContainers.mockResolvedValue([
      { Id: 'mock-container-id-abc123', Names: ['/test-server'] },
    ])
    mocks.container.stats.mockResolvedValue({
      cpu_stats: {
        cpu_usage: { total_usage: 2000 },
        system_cpu_usage: 10000,
        online_cpus: 2,
      },
      precpu_stats: {
        cpu_usage: { total_usage: 1000 },
        system_cpu_usage: 8000,
      },
      memory_stats: {
        usage: 512 * 1024 * 1024,
        limit: 4096 * 1024 * 1024,
      },
    })

    const result = await getDockerStats([baseServer])
    expect(result).toHaveLength(1)
    expect(result[0].containerId).toBe('mock-container-id-abc123')
    expect(result[0].name).toBe('test-server')
    expect(typeof result[0].cpuUsagePercent).toBe('number')
    expect(typeof result[0].memoryUsageMb).toBe('number')
  })

  it('ignores containers not in the servers list', async () => {
    mocks.dockerInstance.listContainers.mockResolvedValue([
      { Id: 'unrelated-container', Names: ['/other'] },
    ])
    const result = await getDockerStats([baseServer])
    expect(result).toHaveLength(0)
  })

  it('calculates memoryUsageMb correctly', async () => {
    mocks.dockerInstance.listContainers.mockResolvedValue([
      { Id: 'mock-container-id-abc123', Names: ['/test-server'] },
    ])
    const usageBytes = 256 * 1024 * 1024
    mocks.container.stats.mockResolvedValue({
      cpu_stats: { cpu_usage: { total_usage: 100 }, system_cpu_usage: 1000, online_cpus: 1 },
      precpu_stats: { cpu_usage: { total_usage: 0 }, system_cpu_usage: 0 },
      memory_stats: { usage: usageBytes, limit: 4096 * 1024 * 1024 },
    })

    const result = await getDockerStats([baseServer])
    expect(result[0].memoryUsageMb).toBe(256)
  })

  it('returns empty array when servers list is empty', async () => {
    const result = await getDockerStats([])
    expect(result).toEqual([])
  })

  it('emits zeros instead of NaN when stats blocks are empty (first read after start)', async () => {
    mocks.dockerInstance.listContainers.mockResolvedValue([
      { Id: 'mock-container-id-abc123', Names: ['/test-server'] },
    ])
    // Docker returns empty precpu/memory blocks on a container's first stats read
    mocks.container.stats.mockResolvedValue({
      cpu_stats: {},
      precpu_stats: {},
      memory_stats: {},
    })

    const result = await getDockerStats([baseServer])
    expect(result).toHaveLength(1)
    expect(result[0].cpuUsagePercent).toBe(0)
    expect(result[0].memoryUsageMb).toBe(0)
    expect(result[0].memoryLimitMb).toBe(0)
    expect(result[0].memoryUsagePercent).toBe(0)
  })
})

describe('watchContainerEvents', () => {
  it('registers a data listener on the event stream', async () => {
    const emitter = new EventEmitter()
    mocks.dockerInstance.getEvents.mockResolvedValue(emitter)

    const mockDb = { updateServerStatusByContainerId: vi.fn().mockResolvedValue(undefined) }
    vi.mocked(DbService).mockImplementation(() => mockDb as unknown as DbService)

    await watchContainerEvents(mockDb as unknown as DbService)
    expect(emitter.listenerCount('data')).toBe(1)
  })

  it('calls updateServerStatusByContainerId with "started" on start event', async () => {
    const emitter = new EventEmitter()
    mocks.dockerInstance.getEvents.mockResolvedValue(emitter)

    const mockDb = { updateServerStatusByContainerId: vi.fn().mockResolvedValue(undefined) }
    await watchContainerEvents(mockDb as unknown as DbService)

    emitter.emit('data', Buffer.from(JSON.stringify({ id: 'abc', status: 'start' })))
    await new Promise(r => setImmediate(r))

    expect(mockDb.updateServerStatusByContainerId).toHaveBeenCalledWith('abc', 'started')
  })

  it('calls updateServerStatusByContainerId with "stopped" on die event', async () => {
    const emitter = new EventEmitter()
    mocks.dockerInstance.getEvents.mockResolvedValue(emitter)

    const mockDb = { updateServerStatusByContainerId: vi.fn().mockResolvedValue(undefined) }
    await watchContainerEvents(mockDb as unknown as DbService)

    emitter.emit('data', Buffer.from(JSON.stringify({ id: 'abc', status: 'die' })))
    await new Promise(r => setImmediate(r))

    expect(mockDb.updateServerStatusByContainerId).toHaveBeenCalledWith('abc', 'stopped')
  })

  it('does not call updateServerStatusByContainerId for unknown events', async () => {
    const emitter = new EventEmitter()
    mocks.dockerInstance.getEvents.mockResolvedValue(emitter)

    const mockDb = { updateServerStatusByContainerId: vi.fn().mockResolvedValue(undefined) }
    await watchContainerEvents(mockDb as unknown as DbService)

    emitter.emit('data', Buffer.from(JSON.stringify({ id: 'abc', status: 'unknown-event' })))
    await new Promise(r => setImmediate(r))

    expect(mockDb.updateServerStatusByContainerId).not.toHaveBeenCalled()
  })
})

describe('mapDockerState', () => {
  it('maps running-like states to started', () => {
    expect(mapDockerState('running')).toBe('started')
    expect(mapDockerState('restarting')).toBe('started')
    expect(mapDockerState('paused')).toBe('started')
  })

  it('maps stopped-like states to stopped', () => {
    expect(mapDockerState('exited')).toBe('stopped')
    expect(mapDockerState('created')).toBe('stopped')
    expect(mapDockerState('dead')).toBe('stopped')
  })

  it('maps a missing/unknown state to error', () => {
    expect(mapDockerState(undefined)).toBe('error')
    expect(mapDockerState('weird')).toBe('error')
  })
})

describe('getActualStatuses', () => {
  it('resolves each id to its real status in one Docker call', async () => {
    mocks.dockerInstance.listContainers.mockResolvedValue([
      { Id: 'a', State: 'running' },
      { Id: 'b', State: 'exited' },
    ])
    const result = await getActualStatuses(['a', 'b', 'c'])
    expect(result.get('a')).toBe('started')
    expect(result.get('b')).toBe('stopped')
    expect(result.get('c')).toBe('error')
    expect(mocks.dockerInstance.listContainers).toHaveBeenCalledOnce()
  })
})

describe('reconcileStatuses', () => {
  const mkServer = (server_id: number, container_id: string, status: string) =>
    ({ core_settings: { server_id, container_id, status } } as unknown as ServerSettingsS)

  it('updates only the servers whose real state differs', async () => {
    const mockDb = {
      getAllServers: vi.fn().mockResolvedValue([
        mkServer(1, 'a', 'starting'),
        mkServer(2, 'b', 'started'),
      ]),
      updateServerStatus: vi.fn().mockResolvedValue(undefined),
    }
    mocks.dockerInstance.listContainers.mockResolvedValue([
      { Id: 'a', State: 'running' },
      { Id: 'b', State: 'running' },
    ])

    await reconcileStatuses(mockDb as unknown as DbService)

    expect(mockDb.updateServerStatus).toHaveBeenCalledOnce()
    expect(mockDb.updateServerStatus).toHaveBeenCalledWith(1, 'started')
  })

  it('marks a server as error when its container is gone', async () => {
    const mockDb = {
      getAllServers: vi.fn().mockResolvedValue([mkServer(3, 'gone', 'started')]),
      updateServerStatus: vi.fn().mockResolvedValue(undefined),
    }
    mocks.dockerInstance.listContainers.mockResolvedValue([])

    await reconcileStatuses(mockDb as unknown as DbService)

    expect(mockDb.updateServerStatus).toHaveBeenCalledWith(3, 'error')
  })

  it('does nothing when there are no servers', async () => {
    const mockDb = {
      getAllServers: vi.fn().mockResolvedValue([]),
      updateServerStatus: vi.fn(),
    }
    await reconcileStatuses(mockDb as unknown as DbService)
    expect(mockDb.updateServerStatus).not.toHaveBeenCalled()
  })
})