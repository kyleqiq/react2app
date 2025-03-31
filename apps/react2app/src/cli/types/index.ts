import { FRAMEWORK, PLATFORM } from "../constants/index.js";

export interface CommandOptions {}

export interface DevCommandOptions {
  packageManager?: PackageManager;
  port?: number; // web server port
  host?: string; // web server host
  verbose?: boolean;
  dev?: boolean;
}

export interface BuildCommandOptions {
  verbose?: boolean;
}

export interface R2AConfig {
  projectName: string;
  displayName: string;
  appId: string;
  productionUrl: string;
  version: string;
  scheme: string;
  ios: {
    teamId: string;
  };
  android: {
    keyStore: {
      keystorePath: string;
      keystorePassword: string;
      keyAlias: string;
      keyPassword: string;
      test?: string;
    };
  };
  design: {
    icon: string;
    splash: {
      backgroundColor: string;
      image: string;
      imageWidth: number;
    };
  };
}

export interface CommandConfig {
  command: string;
  args: string[];
  env?: Record<string, string>;
  cwd?: string;
}

export type PackageManager = "npm" | "yarn" | "pnpm" | "auto";

export type Framework = (typeof FRAMEWORK)[keyof typeof FRAMEWORK];

export type Platform = (typeof PLATFORM)[keyof typeof PLATFORM];

export type KeyStore = {
  keyStorePath: string;
  keyStorePassword: string;
  keyAlias: string;
  keyPassword: string;
};
