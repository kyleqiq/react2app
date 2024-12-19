import { FRAMEWORK, PLATFORM } from "../constants/index.js";

export interface CommandOptions {}

export interface DevCommandOptions {
  packageManager?: PackageManager;
  port?: number; // web server port
  host?: string; // web server host
  verbose?: boolean;
  dev?: boolean;
}

export interface BuildCommandOptions {}

export interface N2AConfig {
  name: string;
  ios: boolean;
  android: boolean;
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
