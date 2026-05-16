import type { ServerStatus } from '@rig/shared';

export const STATUS_CONFIG: Record<ServerStatus, any> = {
    running: {
        color: 'green',
        icon: 'play',
        label: 'Running',
    },
    stopped: {
        color: 'red',
        icon: 'stop',
        label: 'Stopped',
    },
    starting: {
        color: 'blue',
        icon: 'loading',
        label: 'Starting',
    },
    stopping: {
        color: 'yellow',
        icon: 'loading',
        label: 'Stopping',
    },
    error:{
        color:'orange',
        icon:'error',
        label:'Error',
    },
};