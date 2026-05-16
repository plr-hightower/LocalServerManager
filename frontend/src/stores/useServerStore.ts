import { defineStore } from "pinia";
import { ref } from "vue";
import { type ServerInstance, ServerStatus } from "@rig/shared";

export const useServerStore = defineStore("server", () => {
    // global list of server instances
    const instances = ref<ServerInstance[]>([
        { 
          id: '1', 
          name: 'Survival World', 
          gameId: 'minecraft', 
          status: ServerStatus.RUNNING, 
          port: 25565, 
          settings: { memory: 4 } 
        },
        { 
          id: '2', 
          name: 'Viking Test', 
          gameId: 'valheim', 
          status: ServerStatus.STOPPED, 
          port: 2456, 
          settings: { memory: 8 } 
        }
    ]);

    // function that add a new server instance to the list
    const createInstance = (configData: any, gameName: string) => {
        const newServerInstance: ServerInstance = {
            id: Math.random().toString(36).substring(7), // generates a random ID
            name: `${gameName} Server`,
            gameId: gameName.toLowerCase(),
            status: ServerStatus.STOPPED, // start with stopped status
            port: 25565,       // default port, can be overridden by configData
            settings: configData,
        };
        instances.value.push(newServerInstance);
        console.log("Created new server instance:", newServerInstance);
    };
    return { 
        instances,
        createInstance
    };
});