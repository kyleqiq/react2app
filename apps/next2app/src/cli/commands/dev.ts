// src/commands/dev.ts
import chalk from "chalk";
import getPort from "get-port";
import { DevCommandOptions } from "../types/index.js";
import { runDevServer } from "../utils/devServer.js";
import { logger } from "../utils/logger.js";
import { loadN2AConfig as loadN2AConfig } from "../utils/config.js";
import { updateExpoEnvFile } from "../utils/expo.js";
import { cleanupN2A } from "../utils/cleanUp.js";
import { getLocalIPAddress, validatePort } from "../utils/network.js";
import { frameworks } from "../config/frameworks.js";
import { initN2A } from "../features/init.js";
import { PATHS, validateProjectRoot } from "../utils/path.js";
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
      await initN2A({ isDevMode: options.dev });
    } else {
      await doctor();
      await syncExpoProject();
    }

    const ipAddress = getLocalIPAddress();
    const webHost = options.host || ipAddress;
    const webPort = await getPort({
      port: options.port || [3000, 3001, 3002, 3003, 3004, 3005, 3006, 3007],
    });
    const expoHost = options.host || ipAddress;
    const expoPort = await getPort({
      port: options.port || [8081, 8082, 8083, 8084, 8085, 8086, 8087, 8088],
    });

    await updateExpoEnvFile({
      EXPO_PUBLIC_WEBVIEW_URL: `http://${webHost}:${webPort}`,
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
      await cleanupN2A();
    }
  }
};
