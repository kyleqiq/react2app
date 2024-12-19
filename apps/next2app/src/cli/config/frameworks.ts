import chalk from "chalk";
import { ServerAddress } from "../utils/devServer.js";
import { PATHS } from "../utils/path.js";

export const DEV_SERVERS = {
  NEXTJS: {
    DEV: {
      name: "nextjs-dev",
      command: {
        async getCommandConfig({ host, port }: ServerAddress) {
          return {
            command: "npx",
            args: ["next", "dev", "-H", host],
            env: {
              PORT: port.toString(),
            },
          };
        },
        readyMessage: "✓ Ready",
      },
      log: {
        logPrefix: "[Web]",
        logColor: chalk.blue,
      },
    },
  },
  EXPO: {
    DEV: {
      name: "expo-dev",
      command: {
        async getCommandConfig({ host, port }: ServerAddress) {
          const EXPO_PATHS = await PATHS.getExpoPaths();
          return {
            command: "npx",
            args: ["expo", "start", "--port", port.toString()],
            cwd: EXPO_PATHS.ROOT,
          };
        },
        readyMessage: "Logs for your project will appear below",
      },
      log: {
        logPrefix: "[App]",
        logColor: chalk.yellow,
      },
    },
  },
};
