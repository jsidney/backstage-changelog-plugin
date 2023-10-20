'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var backendCommon = require('@backstage/backend-common');
var catalogClient = require('@backstage/catalog-client');
var errors = require('@backstage/errors');
var express = require('express');
var Router = require('express-promise-router');
var fs = require('fs-extra');
var catalogModel = require('@backstage/catalog-model');
var backendPluginApi = require('@backstage/backend-plugin-api');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var express__default = /*#__PURE__*/_interopDefaultLegacy(express);
var Router__default = /*#__PURE__*/_interopDefaultLegacy(Router);
var fs__default = /*#__PURE__*/_interopDefaultLegacy(fs);

const readChangelogFile = async (changeLogFileReference) => {
  const result = fs__default["default"].readFileSync(changeLogFileReference);
  return result.toString("utf8");
};

async function createRouter(options) {
  const { logger, tokenManager, reader } = options;
  const catalog = new catalogClient.CatalogClient({ discoveryApi: options.discovery });
  const router = Router__default["default"]();
  router.use(express__default["default"].json());
  router.get("/health", (_, response) => {
    logger.info("PONG!");
    response.json({ status: "ok" });
  });
  router.get("/v2/entity/:namespace/:kind/:name", async (req, res) => {
    var _a, _b;
    const token = await tokenManager.getToken();
    const { namespace, kind, name } = req.params;
    const entity = await catalog.getEntityByRef(
      { namespace, kind, name },
      token
    );
    if (!entity) {
      throw new errors.NotFoundError(
        `No ${kind} entity in ${namespace} named "${name}"`
      );
    }
    const changelogFilename = (_a = entity == null ? void 0 : entity.metadata.annotations) == null ? void 0 : _a["changelog-name"];
    const changelogFileReference = (_b = entity == null ? void 0 : entity.metadata.annotations) == null ? void 0 : _b["changelog-file-ref"];
    let result;
    if (!changelogFileReference) {
      const location = catalogModel.getEntitySourceLocation(entity);
      if (changelogFilename) {
        result = await readChangelogFile(location.target + changelogFilename);
      } else {
        result = await readChangelogFile(location.target + "CHANGELOG.md");
      }
    } else {
      const { type, target } = catalogModel.parseLocationRef(changelogFileReference);
      if (type === "url") {
        const urlResult = await reader.readUrl(target);
        result = (await urlResult.buffer()).toString("utf8");
      }
      if (type === "file") {
        result = await readChangelogFile(target);
      }
    }
    if (result) ; else {
      res.status(404).json();
    }
  });
  router.get("/entity/:namespace/:kind/:name", async (req, res) => {
    var _a, _b;
    const token = await tokenManager.getToken();
    const { namespace, kind, name } = req.params;
    const entity = await catalog.getEntityByRef(
      { namespace, kind, name },
      token
    );
    if (!entity) {
      throw new errors.NotFoundError(
        `No ${kind} entity in ${namespace} named "${name}"`
      );
    }
    const changelogFilename = (_a = entity == null ? void 0 : entity.metadata.annotations) == null ? void 0 : _a["changelog-name"];
    const changelogFileReference = (_b = entity == null ? void 0 : entity.metadata.annotations) == null ? void 0 : _b["changelog-file-ref"];
    if (!changelogFileReference) {
      const location = catalogModel.getEntitySourceLocation(entity);
      if (changelogFilename) {
        const result = await readChangelogFile(location.target + changelogFilename);
        res.status(200).json({ content: result });
      } else {
        const result = await readChangelogFile(location.target + "CHANGELOG.md");
        res.status(200).json({ content: result });
      }
    } else {
      const { type, target } = catalogModel.parseLocationRef(changelogFileReference);
      if (type === "url") {
        const result = await reader.readUrl(target);
        res.status(200).json({ content: (await result.buffer()).toString("utf8") });
      }
      if (type === "file") {
        const result = await readChangelogFile(target);
        res.status(200).json({ content: result });
      }
    }
  });
  router.use(backendCommon.errorHandler());
  return router;
}

const changelogPlugin = backendPluginApi.createBackendPlugin({
  pluginId: "changelog",
  register(env) {
    env.registerInit({
      deps: {
        logger: backendPluginApi.coreServices.logger,
        reader: backendPluginApi.coreServices.urlReader,
        httpRouter: backendPluginApi.coreServices.httpRouter,
        tokenManager: backendPluginApi.coreServices.tokenManager,
        discovery: backendPluginApi.coreServices.discovery
      },
      async init({ logger, reader, httpRouter, tokenManager, discovery }) {
        httpRouter.use(
          await createRouter({
            logger: backendCommon.loggerToWinstonLogger(logger),
            reader,
            tokenManager,
            discovery
          })
        );
      }
    });
  }
});

exports.createRouter = createRouter;
exports["default"] = changelogPlugin;
//# sourceMappingURL=index.cjs.js.map
