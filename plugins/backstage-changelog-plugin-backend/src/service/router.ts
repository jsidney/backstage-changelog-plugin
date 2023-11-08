/*
 * Copyright 2023 RSC-Labs, https://rsoftcon.com/
 *
 * Licensed under the Mozilla Public License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.mozilla.org/en-US/MPL/2.0/
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { UrlReader, errorHandler, TokenManager, PluginEndpointDiscovery, resolveSafeChildPath } from '@backstage/backend-common';
import { CatalogClient, CatalogApi } from '@backstage/catalog-client';
import { NotFoundError } from '@backstage/errors';
import express from 'express';
import Router from 'express-promise-router';
import { Logger } from 'winston';
import { readChangelogFile } from '../lib/changelogReader';
import {
  ANNOTATION_SOURCE_LOCATION,
  parseLocationRef,
} from '@backstage/catalog-model';

export interface RouterOptions {
  logger: Logger;
  reader: UrlReader;
  tokenManager: TokenManager;
  discovery: PluginEndpointDiscovery,
  catalogApi?: CatalogApi   
}

export async function createRouter(
  options: RouterOptions,
): Promise<express.Router> {
  const { logger, tokenManager, reader, discovery } = options;

  const catalogApi =
    options.catalogApi ?? new CatalogClient({ discoveryApi: discovery });

  const router = Router();
  router.use(express.json());

  router.get('/health', (_, response) => {
    logger.info('PONG!');
    response.json({ status: 'ok' });
  });

  router.get('/entity/:namespace/:kind/:name', async (req, res) => {
    const token = await tokenManager.getToken();
    const { namespace, kind, name } = req.params;
    const entity = await catalogApi.getEntityByRef(
      { namespace, kind, name },
      token,
    );
    if (!entity) {
      throw new NotFoundError(
        `No ${kind} entity in ${namespace} named "${name}"`,
      );
    }
    const entitySourceLocation = entity?.metadata.annotations?.[ANNOTATION_SOURCE_LOCATION];
    const changelogFilename = entity?.metadata.annotations?.['changelog-name'];
    const changelogFileReference = entity?.metadata.annotations?.['changelog-file-ref'];

    if (!changelogFileReference) {
      if (changelogFilename && entitySourceLocation) {
        const result = await readChangelogFile(entitySourceLocation + changelogFilename);
        return res.status(200).json({content: result})
      } else if (entitySourceLocation) {
        const { type, target } = parseLocationRef(entitySourceLocation);
        if (type === 'url') {
          const result = await reader.readUrl(target + 'CHANGELOG.md');
          return res.status(200).json({content: (await result.buffer()).toString('utf8')})
        }
        if (type === 'file') {
          const result = await readChangelogFile(target +'CHANGELOG.md');
          return res.status(200).json({content: result})
        }
        return res.status(500).json()
      } else {
        return res.status(404).json();
      }
    } else {
      const { type, target } = parseLocationRef(changelogFileReference);
      if (type === 'url') {
        const result = await reader.readUrl(target);
        return res.status(200).json({content: (await result.buffer()).toString('utf8')})
      }
      if (type === 'file') {
        const result = await readChangelogFile(target);
        return res.status(200).json({content: result})
      }
    }
  });

  router.use(errorHandler());
  return router;
}
