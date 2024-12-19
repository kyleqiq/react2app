import chalk from "chalk";
import { PATHS } from "../utils/path.js";
import { Platform } from "../types/index.js";
import { spawn } from "child_process";

export interface GetCommandConfigOptions {
  host?: string;
  port?: number;
  platform?: Platform;
}

export const DEV_SERVERS = {
  NEXTJS: {
    DEV: {
      name: "nextjs-dev",
      command: {
        async runCommand({
          host = "localhost",
          port = 3000,
        }: GetCommandConfigOptions) {
          const serverProcess = spawn("npx", ["next", "dev", "-H", host], {
            stdio: "pipe",
            shell: false,
            env: {
              ...process.env,
              PORT: port.toString(),
            },
            cwd: PATHS.NEXTJS.ROOT,
          });
          return serverProcess;
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
        async runCommand({ port = 8081 }: GetCommandConfigOptions) {
          const EXPO_PATHS = await PATHS.getExpoPaths();
          const serverProcess = spawn(
            "npx",
            ["expo", "start", "--port", port.toString()],
            {
              stdio: "pipe",
              shell: false,
              cwd: EXPO_PATHS.ROOT,
              env: {
                ...process.env,
                PORT: port.toString(),
              },
            }
          );
          return serverProcess;
        },
        readyMessage: "Logs for your project will appear below",
      },
      log: {
        logPrefix: "[App]",
        logColor: chalk.yellow,
      },
    },
    RUN: {
      name: "expo-run",
      command: {
        async runCommand({ platform }: GetCommandConfigOptions) {
          const EXPO_PATHS = await PATHS.getExpoPaths();
          const serverProcess = spawn(
            "npx",
            ["expo", `run:${platform}`, "--device"],
            {
              stdio: "inherit",
              shell: true,
              cwd: EXPO_PATHS.ROOT,
              env: {
                ...process.env,
              },
            }
          );
          return serverProcess;
        },
        readyMessage: "✔ Complete 100%",
      },
      log: {
        logPrefix: "[App]",
        logColor: chalk.yellow,
      },
    },
  },
};
