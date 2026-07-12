import pino from 'pino';
import { createStream } from 'pino-seq';

const seqStream = createStream({
  serverUrl: process.env.SEQ_URL ?? 'http://seq',
  // apiKey: process.env.SEQ_API_KEY, // only needed if you enable an API key in Seq's UI
  onError: (err) => console.error('pino-seq error:', err),
});

export const logger = pino(
  { name: 'backend', level: process.env.LOG_LEVEL ?? 'info' },
  process.env.NODE_ENV === 'production'
    ? seqStream
    : pino.multistream([
        { stream: pino.transport({ target: 'pino-pretty' }) }, // readable local dev logs
        { stream: seqStream },
      ])
);

export async function closeLogger() {
  await seqStream.flush();
}
