// src/commands/dev.ts

import { DevCommandOptions } from "../types/index.js";
import {
  getDevServer,
  printDevServerInfo,
  runDevServer,
  setAppServerAddress,
  setWebServerAddress,
} from "../utils/devServer.js";
import { logger } from "../utils/logger.js";
import { loadN2AConfig as loadN2AConfig } from "../utils/config.js";
import { DEV_SERVERS } from "../config/frameworks.js";
import { initN2A } from "../features/init.js";
import { validateProjectRoot } from "../utils/path.js";
import { syncExpoProject } from "../features/sync.js";
import { doctor } from "./doctor.js";

export const dev = async (
  platform: string,
  options: DevCommandOptions
): Promise<void> => {
  try {
    validateProjectRoot();
    const N2AConfig = await loadN2AConfig();
    const isFirstExecution = !N2AConfig;

    if (isFirstExecution) {
      await initN2A({ isDevMode: options.verbose });
    } else {
      await doctor();
      await syncExpoProject();
    }

    const { host: webHost, port: webPort } = await setWebServerAddress({
      preferredHost: options.host,
      preferredPort: options.port,
    });
    const { host: expoHost, port: expoPort } = await setAppServerAddress({
      preferredHost: options.host,
    });

    const webServer = getDevServer({
      server: DEV_SERVERS.NEXTJS.DEV,
      host: webHost,
      port: webPort,
      verbose: options.verbose ?? false,
    });

    const appServer = getDevServer({
      server: DEV_SERVERS.EXPO.DEV,
      host: expoHost,
      port: expoPort,
      verbose: options.verbose ?? false,
    });

    runDevServer({
      webServer,
      appServer,
    });
    printDevServerInfo(webServer.address, appServer.address);
  } catch (error) {
    if (error instanceof Error) {
      logger.error(error.message);
    }
  }
};
