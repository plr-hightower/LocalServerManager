import { GameManifestS, ServerSettingsS } from '@hightower/shared';
import Docker, { Container } from 'dockerode';

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
    if(!settings.core_settings.default_host_port){
        throw new Error("core_settings default hostport not set");
    }
    const ExposedPorts: Record<string, {}> = {};
    const PortBindings: Record<string, Array<{ HostPort: string }>> = {};

    // To be able to increment ports for different game servers (ex: 2 minecraft servers)
    // I need a tracking section in the db to keep track of everything
    // Loop through the protocols (e.g., ["tcp", "udp"]) and bind each one
    for (const protocol of manifest.protocols) {
        const portKey = `${settings.core_settings.default_host_port}/${protocol}`;
        const hostPortStr = settings.core_settings.host_port.toString();

        ExposedPorts[portKey] = {};
        PortBindings[portKey] = [{ HostPort: hostPortStr }];
    }
    const container = await docker.createContainer({
        Image: manifest.image,
        name: `${settings.core_settings.name}`, 
        Env: manifest.env,
        ExposedPorts,
        HostConfig: {
            PortBindings,
            RestartPolicy: { Name: 'unless-stopped' },
            Memory: settings.core_settings.ram_alloc_mb * 1024 * 1024 
        }
    });

    await container.start();
    
    return container.id;
}

async function stopContainer(containerId:string): Promise<void>{
    const container:Container = docker.getContainer(containerId);
    await container.stop();
    console.log(`Container ${container.id} stopped`);
}

export {createContainer,stopContainer};