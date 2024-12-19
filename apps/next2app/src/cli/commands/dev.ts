// src/commands/dev.ts

import { DevCommandOptions, Platform } from "../types/index.js";
import {
  DevServer,
  getDevServerConfig,
  printDevServerInfo,
  runDevServer,
  setAppServerAddress,
  setWebServerAddress,
} from "../utils/devServer.js";
import { logger } from "../utils/logger.js";
import { loadN2AConfig as loadN2AConfig } from "../utils/config.js";
import { DEV_SERVERS } from "../config/devServer.js";
import { initN2A } from "../features/init.js";
import { validateProjectRoot } from "../utils/path.js";
import { syncExpoProject } from "../features/sync.js";
import { doctor } from "./doctor.js";
import { PLATFORM } from "../constants/index.js";

export const dev = async (
  platform: Platform | undefined,
  options: DevCommandOptions
): Promise<void> => {
  try {
    const { host, port, verbose = false, dev: isDevMode = false } = options;

    // Advanced mode (Install app to phone)
    if (platform === PLATFORM.IOS) {
      // prebuild
      // ios setup
      // sync expo project
      await doctor();
      await syncExpoProject();

      // set server address (app, web)
      const { host: webHost, port: webPort } = await setWebServerAddress({
        preferredHost: host,
        preferredPort: port,
      });

      const { host: expoHost, port: expoPort } = await setAppServerAddress({
        preferredHost: host,
      });

      // start web server
      const webServerConfig = getDevServerConfig({
        server: DEV_SERVERS.NEXTJS.DEV,
        host: webHost,
        port: webPort,
      });
      const webServer = new DevServer(webServerConfig);
      await webServer.start();
      console.log("webserver started");

      // start app install server
      const appInstallServerConfig = getDevServerConfig({
        server: DEV_SERVERS.EXPO.RUN,
        host: expoHost,
        port: expoPort,
        platform,
        verbose: true,
      });
      const appInstallServer = new DevServer(appInstallServerConfig);
      await appInstallServer.start();
    }
    if (platform === PLATFORM.ANDROID) {
      // android advanced mode
    }
    // Normal mode
    if (typeof platform === "undefined") {
      validateProjectRoot();
      const N2AConfig = await loadN2AConfig();
      const isFirstExecution = !N2AConfig;

      if (isFirstExecution) {
        await initN2A({ isDevMode });
      } else {
        await doctor();
        await syncExpoProject();
      }

      const { host: webHost, port: webPort } = await setWebServerAddress({
        preferredHost: host,
        preferredPort: port,
      });
      const { host: expoHost, port: expoPort } = await setAppServerAddress({
        preferredHost: host,
      });

      const webServerConfig = getDevServerConfig({
        server: DEV_SERVERS.NEXTJS.DEV,
        host: webHost,
        port: webPort,
        verbose,
      });

      const appServerConfig = getDevServerConfig({
        server: DEV_SERVERS.EXPO.DEV,
        host: expoHost,
        port: expoPort,
        verbose,
      });

      runDevServer({
        webServer: webServerConfig,
        appServer: appServerConfig,
      });
      printDevServerInfo(webServerConfig.address, appServerConfig.address);
    }
  } catch (error) {
    if (error instanceof Error) {
      logger.error(error.message);
    }
  }
};
