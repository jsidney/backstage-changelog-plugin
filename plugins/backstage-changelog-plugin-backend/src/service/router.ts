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

import { UrlReader, errorHandler, TokenManager, PluginEndpointDiscovery } from '@backstage/backend-common';
import { CatalogClient } from '@backstage/catalog-client';
import { NotFoundError } from '@backstage/errors';
import express from 'express';
import Router from 'express-promise-router';
import { Logger } from 'winston';
import { readChangelogFile } from '../lib/changelogReader';
import {
  getEntitySourceLocation,
  parseLocationRef,
} from '@backstage/catalog-model';

export interface RouterOptions {
  logger: Logger;
  reader: UrlReader;
  tokenManager: TokenManager;
  discovery: PluginEndpointDiscovery
}

export async function createRouter(
  options: RouterOptions,
): Promise<express.Router> {
  const { logger, tokenManager, reader } = options;

  const catalog = new CatalogClient({ discoveryApi: options.discovery });

  const router = Router();
  router.use(express.json());

  router.get('/health', (_, response) => {
    logger.info('PONG!');
    response.json({ status: 'ok' });
  });

  router.get('/v2/entity/:namespace/:kind/:name', async (req, res) => {
    const token = await tokenManager.getToken();
    const { namespace, kind, name } = req.params;
    const entity = await catalog.getEntityByRef(
      { namespace, kind, name },
      token,
    );
    if (!entity) {
      throw new NotFoundError(
        `No ${kind} entity in ${namespace} named "${name}"`,
      );
    }
    const changelogFilename = entity?.metadata.annotations?.['changelog-name'];
    const changelogFileReference = entity?.metadata.annotations?.['changelog-file-ref'];

    let result: string | undefined;

    if (!changelogFileReference) {
      const location = getEntitySourceLocation(entity);
      if (changelogFilename) {
        result = await readChangelogFile(location.target + changelogFilename);
      } else {
        result = await readChangelogFile(location.target + 'CHANGELOG.md');

      }
    } else {
      const { type, target } = parseLocationRef(changelogFileReference);
      if (type === 'url') {
        const urlResult = await reader.readUrl(target);
        result = (await urlResult.buffer()).toString('utf8');
      }
      if (type === 'file') {
        result = await readChangelogFile(target);
      }
    }
    if (result) {
      
    } else {
      res.status(404).json();
    }
  });

  router.get('/entity/:namespace/:kind/:name', async (req, res) => {
    const token = await tokenManager.getToken();
    const { namespace, kind, name } = req.params;
    const entity = await catalog.getEntityByRef(
      { namespace, kind, name },
      token,
    );
    if (!entity) {
      throw new NotFoundError(
        `No ${kind} entity in ${namespace} named "${name}"`,
      );
    }
    const changelogFilename = entity?.metadata.annotations?.['changelog-name'];
    const changelogFileReference = entity?.metadata.annotations?.['changelog-file-ref'];

    if (!changelogFileReference) {
      const location = getEntitySourceLocation(entity);
      if (changelogFilename) {
        const result = await readChangelogFile(location.target + changelogFilename);
        res.status(200).json({content: result})
      } else {
        const result = await readChangelogFile(location.target + 'CHANGELOG.md');
        res.status(200).json({content: result})

      }
    } else {
      const { type, target } = parseLocationRef(changelogFileReference);
      if (type === 'url') {
        const result = await reader.readUrl(target);
        res.status(200).json({content: (await result.buffer()).toString('utf8')})
      }
      if (type === 'file') {
        const result = await readChangelogFile(target);
        res.status(200).json({content: result})
      }
    }
  });

  router.use(errorHandler());
  return router;
}
