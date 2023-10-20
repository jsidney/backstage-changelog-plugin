import { createApiRef, createRouteRef, createPlugin, createApiFactory, discoveryApiRef, fetchApiRef, createRoutableExtension } from '@backstage/core-plugin-api';
import { generatePath } from 'react-router-dom';
import { DEFAULT_NAMESPACE } from '@backstage/catalog-model';
import { ResponseError } from '@backstage/errors';

const changelogApiRef = createApiRef({
  id: "plugin.changelog.client"
});

const rootRouteRef = createRouteRef({
  id: "backstage-plugin-changelog"
});

var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
class ChangelogClient {
  constructor(options) {
    __publicField(this, "discoveryApi");
    __publicField(this, "fetchApi");
    this.discoveryApi = options.discoveryApi;
    this.fetchApi = options.fetchApi;
  }
  getEntityRouteParams(entity) {
    var _a, _b;
    return {
      kind: entity.kind.toLocaleLowerCase("en-US"),
      namespace: (_b = (_a = entity.metadata.namespace) == null ? void 0 : _a.toLocaleLowerCase("en-US")) != null ? _b : DEFAULT_NAMESPACE,
      name: entity.metadata.name
    };
  }
  async readChangelog(entity) {
    const routeParams = this.getEntityRouteParams(entity);
    const path = generatePath(`:namespace/:kind/:name`, routeParams);
    const baseUrl = await this.discoveryApi.getBaseUrl("changelog");
    const response = await this.fetchApi.fetch(`${baseUrl}/entity/${path}`);
    if (!response.ok) {
      throw await ResponseError.fromResponse(response);
    }
    const result = await response.json();
    return result.content;
  }
}

const backstagePluginChangelogPlugin = createPlugin({
  id: "changelog",
  apis: [
    createApiFactory({
      api: changelogApiRef,
      deps: {
        discoveryApi: discoveryApiRef,
        fetchApi: fetchApiRef
      },
      factory: ({ discoveryApi, fetchApi }) => new ChangelogClient({
        discoveryApi,
        fetchApi
      })
    })
  ],
  routes: {
    root: rootRouteRef
  }
});
const EntityChangelogCard = backstagePluginChangelogPlugin.provide(
  createRoutableExtension({
    name: "EntityChangelogCard",
    component: () => import('./index-ade22ce9.esm.js').then(
      (m) => m.ChangelogCard
    ),
    mountPoint: rootRouteRef
  })
);
const EntityChangelogContent = backstagePluginChangelogPlugin.provide(
  createRoutableExtension({
    name: "EntityChangelogContent",
    component: () => import('./index-ade22ce9.esm.js').then(
      (m) => m.ChangelogContent
    ),
    mountPoint: rootRouteRef
  })
);

export { EntityChangelogCard as E, EntityChangelogContent as a, backstagePluginChangelogPlugin as b, changelogApiRef as c };
//# sourceMappingURL=index-33eb0045.esm.js.map
