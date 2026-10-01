import { createServer } from 'node:http';

import { createApp } from './app';
import { container } from './container';
import { disconnectPrisma } from './shared/db/prisma';
import { logger } from './shared/logging/logger';

const server = createServer(createApp());
server.listen(container.config.PORT, () => {
  logger.info({ port: container.config.PORT }, 'Qaryati API listening');
});

let shuttingDown = false;
async function shutdown(signal: string): Promise<void> {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info({ signal }, 'Shutting down');
  server.close(async (error) => {
    if (error) {
      logger.error({ err: error }, 'HTTP server close failed');
      process.exitCode = 1;
    }
    await disconnectPrisma();
  });
}

process.once('SIGTERM', () => void shutdown('SIGTERM'));
process.once('SIGINT', () => void shutdown('SIGINT'));
