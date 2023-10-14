import { UrlReaders, createServiceBuilder, loadBackendConfig, ServerTokenManager, HostDiscovery } from '@backstage/backend-common';
import { Server } from 'http';
import { Logger } from 'winston';
import { createRouter } from './router';

export interface ServerOptions {
  port: number;
  enableCors: boolean;
  logger: Logger;
}

export async function startStandaloneServer(
  options: ServerOptions,
): Promise<Server> {
  const logger = options.logger.child({ service: 'changelog-backend' });
  const config = await loadBackendConfig({ logger, argv: process.argv });
  const discovery = HostDiscovery.fromConfig(config);
  const tokenManager = ServerTokenManager.noop();
  logger.debug('Starting application server...');
  const router = await createRouter({
    logger,
    reader: UrlReaders.default({ logger, config }),
    tokenManager,
    discovery
  });

  let service = createServiceBuilder(module)
    .setPort(options.port)
    .addRouter('/changelog', router);
  if (options.enableCors) {
    service = service.enableCors({ origin: 'http://localhost:3000' });
  }

  return await service.start().catch(err => {
    logger.error(err);
    process.exit(1);
  });
}

module.hot?.accept();
