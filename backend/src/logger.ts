import pino from 'pino'
// @ts-expect-error pino-roll ships no type declarations
import build from 'pino-roll'
import path from 'path'

const fileStream = await build({
    file:       path.join('logs', 'backend'),
    frequency:  'daily',
    dateFormat: 'yyyy-MM-dd',
    extension:  '.log',
    mkdir:      true,
    limit:      { count: 13 }, // 13 rotated + 1 active file = 14 days retained
})

export const logger = pino(
    {
        name:  'hightower-backend',
        level: process.env.LOG_LEVEL ?? 'info',
    },
    pino.multistream([
        { stream: process.stdout, level: 'debug' },
        { stream: fileStream,     level: 'info'  },
    ])
)

export async function closeLogger(): Promise<void> {
    await fileStream.flush()
}
