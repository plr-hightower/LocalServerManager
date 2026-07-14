import pino from 'pino'
import { createStream } from 'pino-seq'

const seqStream = createStream({
    serverUrl: process.env.SEQ_URL ?? 'http://seq',
    onError:   (err) => process.stderr.write(`pino-seq error: ${err}\n`),
})

export const logger = pino(
    {
        name:  'hightower-backend',
        level: process.env.LOG_LEVEL ?? 'info',
    },
    pino.multistream([
        { stream: process.stdout, level: 'debug' },
        { stream: seqStream,      level: 'info'  },
    ])
)

export async function closeLogger(): Promise<void> {
    await seqStream.flush()
}