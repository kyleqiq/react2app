import { spawn, type ChildProcess } from "child_process";
import chalk from "chalk";
import { BaseError } from "../errors/index.js";
import type { CommandConfig } from "../types/index.js";
import { logger } from "./logger.js";
import qrcode from "qrcode-terminal";
import { getAvailableAddress } from "./network.js";
import { saveToSystemFile } from "./system.js";
import { updateExpoEnvFile } from "./expo.js";
import { EXPO_PORTS, WEB_PORTS } from "../config/constants.js";

export interface DevServerConfig {
  name: string;
  command: ServerCommandConfig;
  address: ServerAddress;
  log: LogConfig;
}

export interface ServerAddress {
  scheme?: string;
  host: string;
  port: number;
}

export interface LogConfig {
  logPrefix: string;
  logColor: typeof chalk;
  verbose?: boolean;
}

export interface ServerCommandConfig {
  getCommandConfig: (options: ServerAddress) => Promise<CommandConfig>;
  readyMessage: string;
}

export interface N2ADevServerConfig {
  webServer: DevServerConfig;
  appServer: DevServerConfig;
}

const printDevServerInfo = (
  webServerAddress: ServerAddress,
  appServerAddress: ServerAddress
) => {
  const formatServerAddress = (server: ServerAddress) =>
    server.scheme
      ? `${server.scheme}://${server.host}:${server.port}`
      : `${server.host}:${server.port}`;

  const messages = [
    "",
    chalk.green("🚀 Server is running at:\n"),
    chalk.blue(`  Web: ${formatServerAddress(webServerAddress)}`),
    chalk.blue(`  App: ${formatServerAddress(appServerAddress)}`),
    "",
  ];
  messages.forEach((msg) => console.log(msg));

  // For Expo QR code, we specifically need the exp:// scheme
  qrcode.generate(`exp://${appServerAddress.host}:${appServerAddress.port}`, {
    small: true,
  });

  const instructions = [
    "",
    chalk.yellow(
      "📱 Download 'Expo Go' app from App Store/Play Store and scan the QR code with phone camera\n"
    ),
    chalk.gray("💡 App not installed? Get it at https://expo.dev/expo-go"),
  ];

  instructions.forEach((msg) => console.log(msg));
};

export class DevServer {
  private readonly name: string;
  private readonly command: ServerCommandConfig;
  private readonly address: ServerAddress;
  private readonly log: LogConfig;

  private isReady = false;
  private process?: ChildProcess;

  constructor(config: DevServerConfig) {
    this.name = config.name;
    this.command = config.command;
    this.address = config.address;
    this.log = config.log;
  }

  getServerAddress(): ServerAddress {
    if (!this.address.host || !this.address.port) {
      throw new Error("Error while getting server info: Server not started");
    }
    return {
      host: this.address.host,
      port: this.address.port,
      scheme: this.address.scheme,
    };
  }

  async start(): Promise<void> {
    try {
      const { command, args, env, cwd } = await this.command.getCommandConfig({
        host: this.address.host,
        port: this.address.port,
      });

      await new Promise<void>((resolve, reject) => {
        this.process = spawn(command, args, {
          stdio: "pipe",
          shell: false,
          env: {
            ...process.env,
            ...env,
          },
          cwd,
        });
        this.setupLogging();
        this.setupErrorHandling(reject);
        this.waitForReady(resolve);
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const isPermissionError = errorMessage.includes("EACCES");

      throw new BaseError(
        `Failed to start server (${this.name})`,
        "SERVER_START_FAILED",
        isPermissionError
          ? `Permission denied for port ${this.address.port}. Please use a port number above 1024.`
          : errorMessage
      );
    }
  }

  private setupLogging(): void {
    const { logPrefix, logColor, verbose } = this.log;
    this.process?.stdout?.on("data", (data) => {
      const message = data.toString();
      if (this.isReady || verbose) {
        const lines = message
          .split("\n")
          .map((line: string) =>
            line.trim() ? `${logColor(logPrefix)} ${line}` : line
          )
          .join("\n");
        process.stdout.write(lines);
      }
    });

    this.process?.stderr?.on("data", (data) => {
      if (verbose) {
        const message = data.toString();
        process.stderr.write(chalk.red(`${logPrefix} ${message}`));
      }
    });
  }

  private setupErrorHandling(reject: (reason?: any) => void): void {
    this.process?.on("error", (error) => {
      logger.error(`${this.name} server failed: ${error.message}`);
      reject(error);
    });
  }

  private waitForReady(resolve: () => void): void {
    const { logPrefix, logColor, verbose } = this.log;
    if (verbose) {
      logger.info(
        `${logPrefix} Waiting for ready message: "${this.command.readyMessage}"`,
        logColor
      );
    }

    this.process?.stdout?.on("data", (data) => {
      const message = data.toString();
      if (message.includes(this.command.readyMessage)) {
        this.isReady = true;
        if (verbose) {
          logger.info(`${logPrefix} Server is ready!`, logColor);
        }
        resolve();
      }
    });
  }

  kill(): void {
    this.process?.kill();
  }

  async getEnv() {
    const { env } = await this.command.getCommandConfig({
      host: this.address.host,
      port: this.address.port,
    });
    const port = this.address.port ?? 3000;
    return {
      PORT: port.toString(),
      ...process.env,
      ...env,
    };
  }
}

export async function runDevServer(n2aServerConfig: N2ADevServerConfig) {
  try {
    const webServer = new DevServer(n2aServerConfig.webServer);
    const appServer = new DevServer(n2aServerConfig.appServer);
    await Promise.all([webServer.start(), appServer.start()]);

    printDevServerInfo(
      webServer.getServerAddress(),
      appServer.getServerAddress()
    );
    setupServerKill(webServer, appServer);
  } catch (error) {
    logger.error("Failed to start development servers");
    if (error instanceof Error) {
      logger.error(error.message);
    }
    throw error;
  }
}

export async function installNativeApp(platform: "ios" | "android") {
  await spawn("npx", ["expo", "run:" + platform, "--device"]);
}

function setupServerKill(webServer: DevServer, appServer: DevServer): void {
  const cleanup = () => {
    webServer.kill();
    appServer.kill();
    process.exit(0);
  };

  process.on("SIGINT", cleanup);
  process.on("SIGTERM", cleanup);
}

interface SetServerAddressOptions {
  preferredHost?: string;
  preferredPort?: number;
}

export const setWebServerAddress = async ({
  preferredHost,
  preferredPort,
}: SetServerAddressOptions) => {
  const { host, port } = await getAvailableAddress({
    preferredHost,
    preferredPort,
    alternativePorts: WEB_PORTS,
  });
  await saveToSystemFile({
    webServer: {
      lastHost: host,
      lastPort: port,
    },
  });
  await updateExpoEnvFile({
    EXPO_PUBLIC_WEBVIEW_URL: `http://${host}:${port}`,
  });
  return { host, port };
};

export const setAppServerAddress = async ({
  preferredHost,
  preferredPort,
}: SetServerAddressOptions) => {
  const { host, port } = await getAvailableAddress({
    preferredHost,
    preferredPort,
    alternativePorts: EXPO_PORTS,
  });
  await saveToSystemFile({
    appServer: {
      lastHost: host,
      lastPort: port,
    },
  });
  return { host, port };
};

export const getDevServer = ({
  server,
  host,
  port,
  verbose,
}: {
  server: Omit<DevServerConfig, "address">;
  host: string;
  port: number;
  verbose: boolean;
}) => {
  return {
    name: server.name,
    command: server.command,
    address: {
      scheme: "http",
      host: host,
      port: port,
    },
    log: {
      ...server.log,
      verbose: verbose,
    },
  };
};
