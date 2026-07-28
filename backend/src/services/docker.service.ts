import { ContainerStatS, ContainerStatSchema, GameManifestS, ServerSettingsS, StatusE, toBind } from '@hightower/shared';
import Docker, { Container } from 'dockerode';
import { DbService } from '../repository/db.repository.js';

// Docker controller??
const docker = new Docker();

// ok so for typescript, always say what will be returned with :Promise<Type>
// and for some fucking reason we have to put function infront whenever

async function imageExists(image:string): Promise<boolean>{
    try{
        await docker.getImage(image).inspect();
        return true;
    } catch {
        return false;
    }
}
async function createContainer(settings: ServerSettingsS, manifest: GameManifestS): Promise<string> {
    if (!settings.core_settings.default_host_port || !settings.core_settings.host_port) {
        throw new Error("core_settings default hostport not set");
    }

    const ExposedPorts: Record<string, {}> = {};
    const PortBindings: Record<string, Array<{ HostPort: string }>> = {};

    // To be able to increment ports for different game servers (ex: 2 minecraft servers)
    // I need a tracking section in the db to keep track of everything
    // Loop through the protocols (e.g., ["tcp", "udp"]) and bind each one
    for (const protocol of manifest.protocols) {
        const internalPort: string = manifest.useHostPort
            ? settings.core_settings.host_port.toString()
            : settings.core_settings.default_host_port!;
        const hostPortStr: string = settings.core_settings.host_port.toString();

        const portKey = `${internalPort}/${protocol}`;
        ExposedPorts[portKey] = {};
        PortBindings[portKey] = [{ HostPort: hostPortStr }];

        for (const offset of manifest.extraPorts) {
            const extraInternal = (parseInt(internalPort) + offset).toString();
            const extraExternal = (settings.core_settings.host_port + offset).toString();
            const extraPortKey = `${extraInternal}/${protocol}`;
            ExposedPorts[extraPortKey] = {};
            PortBindings[extraPortKey] = [{ HostPort: extraExternal }];
        }
    }

    const container = await docker.createContainer({
        Image: manifest.image,
        name: settings.core_settings.name,
        Env: manifest.env,
        ExposedPorts,
        HostConfig: {
            PortBindings,
            Binds: [...manifest.worldVolumes, ...manifest.supportVolumes].map(v => toBind(settings.core_settings.name, v)),
            RestartPolicy: { Name: 'unless-stopped' },
            Memory: settings.core_settings.ram_alloc_mb * 1024 * 1024,
        }
    });

    await container.start();
    return container.id;
}

async function deleteContainer(containerId:string): Promise<void>{
    const container:Container = docker.getContainer(containerId);
    try {
        await container.stop(); // graceful SIGTERM lets the game autosave
    } catch (err: unknown) {
        // ignore "already stopped"
        if (!(err instanceof Error && (err as { statusCode?: number }).statusCode === 304)) {
            throw err;
        }
    }
    await container.remove();
}

async function getDockerStats(servers: ServerSettingsS[]): Promise<ContainerStatS[]> {
    const containerIds = new Set(servers.map(s => s.core_settings.container_id));

    const containers = await docker.listContainers();
    const managedContainers = containers.filter(c => containerIds.has(c.Id));

    const stats = await Promise.all(
        managedContainers.map(async (containerInfo) => {
            const container = docker.getContainer(containerInfo.Id);
            const stat = await container.stats({ stream: false });

            // guard empty stats blocks -> no NaN
            const cpuDelta = (stat.cpu_stats?.cpu_usage?.total_usage ?? 0) - (stat.precpu_stats?.cpu_usage?.total_usage ?? 0);
            const systemDelta = (stat.cpu_stats?.system_cpu_usage ?? 0) - (stat.precpu_stats?.system_cpu_usage ?? 0);
            const cpuUsagePercent = systemDelta > 0 ? Math.max(0, (cpuDelta / systemDelta) * 100) : 0;

            const memoryUsageMb = (stat.memory_stats?.usage ?? 0) / 1024 / 1024;
            const memoryLimitMb = (stat.memory_stats?.limit ?? 0) / 1024 / 1024;
            const memoryUsagePercent = memoryLimitMb > 0 ? (memoryUsageMb / memoryLimitMb) * 100 : 0;

            return ContainerStatSchema.parse({
                containerId: containerInfo.Id,
                name: containerInfo.Names[0].slice(1),
                cpuUsagePercent: Math.round(cpuUsagePercent * 100) / 100,
                memoryUsageMb: Math.round(memoryUsageMb),
                memoryLimitMb: Math.round(memoryLimitMb),
                memoryUsagePercent: Math.round(memoryUsagePercent * 100) / 100,
            });
        })
    );

    return stats;
}
async function startContainer(containerId: string): Promise<void> {
    const container: Container = docker.getContainer(containerId);
    const info = await container.inspect();

    if (info.State.Running) {
        throw new Error("Container is already running");
    }

    await container.start();
}

async function stopContainer(containerId: string): Promise<void> {
    const container: Container = docker.getContainer(containerId);
    const info = await container.inspect();

    if (!info.State.Running) {
        throw new Error("Container is already stopped");
    }

    await container.stop();
}
// docker state -> our status; missing container = error
export function mapDockerState(state: string | undefined): StatusE {
    switch (state) {
        case "running":
        case "restarting":
        case "paused":
            return "started";
        case "created":
        case "exited":
        case "dead":
        case "removing":
            return "stopped";
        default:
            return "error";
    }
}

export async function getActualStatuses(containerIds: string[]): Promise<Map<string, StatusE>> {
    const containers = await docker.listContainers({ all: true });
    const stateById = new Map(containers.map(c => [c.Id, c.State]));
    return new Map(containerIds.map(id => [id, mapDockerState(stateById.get(id))]));
}

// heal DB status from docker (source of truth)
export async function reconcileStatuses(db: DbService): Promise<void> {
    const servers = await db.getAllServers();
    if (servers.length === 0) return;

    const actual = await getActualStatuses(servers.map(s => s.core_settings.container_id));

    await Promise.all(servers.map(server => {
        const { status, server_id, container_id } = server.core_settings;
        const truth = actual.get(container_id);
        if (truth && truth !== status && server_id !== undefined) {
            return db.updateServerStatus(server_id, truth);
        }
        return undefined;
    }));
}

async function watchContainerEvents(db: DbService): Promise<void> {
    const eventStream = await docker.getEvents({
        filters: {
            type: ["container"],
            event: ["start", "stop", "die", "kill", "pause"]
        }
    });

    eventStream.on("data", async (chunk: Buffer) => {
        const event = JSON.parse(chunk.toString());
        const containerId: string = event.id;
        const action: string = event.status;

        const statusMap: Partial<Record<string, StatusE>> = {
            start: "started",
            stop:  "stopped",
            die:   "stopped",
            kill:  "stopped",
        };

        const newStatus = statusMap[action];
        if (!newStatus) return;

        try {
            await db.updateServerStatusByContainerId(containerId, newStatus);
        } catch (err) {
            console.error(`Failed to update status for container ${containerId}:`, err);
        }
    });

    eventStream.on("error", (err: Error) => {
        console.error("Docker event stream error:", err);
    });
}

export {createContainer, startContainer, stopContainer, deleteContainer, watchContainerEvents, getDockerStats};