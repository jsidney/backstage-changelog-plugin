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

import { createApiFactory, createPlugin, createRoutableExtension, discoveryApiRef, fetchApiRef } from '@backstage/core-plugin-api';
import { changelogApiRef } from './api';

import { rootRouteRef } from './routes';
import { ChangelogClient } from './api/ChangelogClient';

export const backstagePluginChangelogPlugin = createPlugin({
  id: 'changelog',
  apis: [
    createApiFactory({
      api: changelogApiRef,
      deps: {
        discoveryApi: discoveryApiRef,
        fetchApi: fetchApiRef
      },
      factory: ({  discoveryApi, fetchApi }) =>
        new ChangelogClient({
          discoveryApi,
          fetchApi
        }),
    }),
  ],
  routes: {
    root: rootRouteRef,
  },
});

export const EntityChangelogCard = backstagePluginChangelogPlugin.provide(
  createRoutableExtension({
    name: 'EntityChangelogCard',
    component: () =>
      import('./components').then(
        m => m.ChangelogCard
      ),
    mountPoint: rootRouteRef,
  }),
);

export const EntityChangelogContent = backstagePluginChangelogPlugin.provide(
  createRoutableExtension({
    name: 'EntityChangelogContent',
    component: () =>
      import('./components').then(
        m => m.EntityChangelogContent
      ),
    mountPoint: rootRouteRef,
  }),
);