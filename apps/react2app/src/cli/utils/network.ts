import { networkInterfaces } from "os";
import { logger } from "./logger.js";
import getPort from "get-port";

export const getLocalIPAddress = (): string => {
  const nets = networkInterfaces();
  let localIP = "127.0.0.1";

  for (const name of Object.keys(nets)) {
    const interfaces = nets[name];
    if (!interfaces) continue;

    for (const net of interfaces) {
      if (!net.internal && net.family === "IPv4") {
        localIP = net.address;
        return localIP;
      }
    }
  }
  return localIP;
};

export const validatePort = (port: number | undefined) => {
  if (port && port < 1024) {
    logger.warning(
      `Port ${port} requires elevated privileges. We will use default port instead.`
    );
    return false;
  }
  return true;
};

export const getAvailableAddress = async ({
  preferredHost,
  preferredPort,
  alternativePorts,
}: {
  preferredHost?: string;
  preferredPort?: number;
  alternativePorts?: number[];
}) => {
  const ipAddress = getLocalIPAddress();
  const host = preferredHost || ipAddress;
  const port = await getPort({
    port: preferredPort || alternativePorts,
  });
  return { host, port };
};
