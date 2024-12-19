// src/commands/dev.ts
import chalk from "chalk";
import getPort from "get-port";
import { DevCommandOptions } from "../types/index.js";
import {
  runDevServer,
  setAppServerAddress,
  setWebServerAddress,
} from "../utils/devServer.js";
import { logger } from "../utils/logger.js";
import { loadN2AConfig as loadN2AConfig } from "../utils/config.js";
import { updateExpoEnvFile } from "../utils/expo.js";
import { cleanupN2A } from "../utils/cleanUp.js";
import {
  getAvailableAddress,
  getLocalIPAddress,
  validatePort,
} from "../utils/network.js";
import { frameworks } from "../config/frameworks.js";
import { initN2A } from "../features/init.js";
import { PATHS, validateProjectRoot } from "../utils/path.js";
import { syncExpoProject } from "../features/sync.js";
import { doctor } from "./doctor.js";
import { EXPO_PORTS, WEB_PORTS } from "../config/constants.js";
import { saveToSystemFile } from "../utils/system.js";
import Conf from "conf";

export const dev = async (
  platform: string,
  options: DevCommandOptions
): Promise<void> => {
  try {
    validateProjectRoot();
    const N2AConfig = await loadN2AConfig();
    const isFirstExecution = !N2AConfig;

    if (isFirstExecution) {
      await initN2A({ isDevMode: options.dev });
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

    runDevServer({
      webServer: {
        framework: frameworks.nextjs,
        host: webHost,
        port: webPort,
        debug: options.debug,
        cwd: PATHS.NEXTJS.ROOT,
        logColor: chalk.blue,
      },
      appServer: {
        framework: frameworks.expo,
        host: expoHost,
        port: expoPort,
        debug: options.debug,
        cwd: (await PATHS.getExpoPaths()).ROOT,
        logColor: chalk.yellow,
      },
    });
  } catch (error) {
    if (error instanceof Error) {
      logger.error(error.message);
    }
  }
};
