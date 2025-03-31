import type { Platform, R2AConfig } from "../types/index.js";
import fs from "fs-extra";
import { PATHS } from "./path.js";
import { ConfigError } from "../errors/index.js";
import { ERROR_MESSAGES } from "../errors/index.js";
import { ERROR_CODE } from "../errors/index.js";
import { PLATFORM } from "../constants/index.js";
import { FILE_NAMES } from "../config/constants.js";
import path from "path";

export async function checkR2AConfigExist() {
  const configPath = PATHS.R2A.CONFIG_FILE;
  return fs.existsSync(configPath);
}

/**
 * Loads the react2app configuration from file
 * @returns {Promise<R2AConfig | null>} The loaded configuration or null if not found
 */
export async function loadR2AConfig(): Promise<R2AConfig | null> {
  try {
    const configPath = PATHS.R2A.CONFIG_FILE;
    if (!fs.existsSync(configPath)) {
      return null;
    }
    const { default: loadedConfig } = await import(configPath);
    return loadedConfig;
  } catch (error) {
    throw new ConfigError(
      ERROR_MESSAGES.CONFIG.LOAD_FAILED,
      ERROR_CODE.CONFIG.LOAD_FAILED
    );
  }
}

export async function ensureR2AConfig(): Promise<R2AConfig> {
  const config = await loadR2AConfig();
  if (!config) {
    throw new ConfigError(
      ERROR_MESSAGES.CONFIG.NOT_FOUND,
      ERROR_CODE.CONFIG.NOT_FOUND
    );
  }
  return config;
}

interface CreateR2AConfigOptions {
  destinationPath: string;
  templatePath: string;
}
/**
 * Creates a new react2app configuration file
 * @returns {Promise<R2AConfig>} The created configuration
 */
export const createR2AConfig = async (
  { templatePath, destinationPath }: CreateR2AConfigOptions = {
    templatePath: PATHS.CLI.CONFIG_TEMPLATE,
    destinationPath: PATHS.R2A.CONFIG_FILE,
  }
): Promise<R2AConfig> => {
  try {
    if (await fs.pathExists(destinationPath)) {
      throw new Error(`Config file already exists at: ${destinationPath}`);
    }
    await fs.ensureFile(destinationPath);
    await fs.copyFile(templatePath, destinationPath);
    const { default: createdConfig } = await import(destinationPath);
    return createdConfig;
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw new Error(`Failed to create config file: ${error.message}`);
    }
    throw new Error(`Unknown error occurred while creating config file`);
  }
};

/**
 * Initializes the react2app configuration
 * @throws {Error} If config creation fails
 * @returns {Promise<R2AConfig>} The loaded or created configuration
 */
export async function initializeR2AConfig() {
  try {
    // Load existing config if exists
    const R2AConfig = await loadR2AConfig();
    if (R2AConfig) {
      return R2AConfig;
    }
    // Create new config if not exists
    const newConfig = await createR2AConfig();
    return newConfig;
  } catch (error) {
    throw error;
  }
}

export function removeR2AConfig() {
  if (fs.existsSync(PATHS.R2A.CONFIG_FILE)) {
    fs.unlinkSync(PATHS.R2A.CONFIG_FILE);
  }
}

/**
 * Normalize the config
 * 1. Default values: Set to default values if not provided
 * 2. Validate and normalize values to ensure they are valid
 * @param config The configuration to normalize
 * @param platform The target platform (iOS, Android, or undefined for both)
 * @returns Normalized configuration
 */
const normalizeR2AConfig = async (config: R2AConfig, platform?: Platform) => {
  // Common
  // - projectName: set default value
  config.projectName = config.projectName || "my_app";
  // - displayName: remove spaces
  config.displayName =
    config.displayName?.replace(/\s/g, "") || config.projectName;
  // - appId: set default value
  config.appId = config.appId || `com.${config.projectName.toLowerCase()}.app`;
  // - productionUrl: set default value
  config.productionUrl = config.productionUrl || `https://example.com`;
  // - version: set default value
  config.version = config.version || "1.0.0";
  // - scheme: set default value
  config.scheme = config.scheme || `yourscheme`;

  // iOS
  if (platform === PLATFORM.IOS || typeof platform === "undefined") {
    // Common
    config.ios = config.ios || {};
    // Team ID
    if (!config.ios.teamId && process.env.R2A_IOS_TEAM_ID) {
      config.ios.teamId = process.env.R2A_IOS_TEAM_ID;
    }
  }
  // Android
  if (platform === PLATFORM.ANDROID || typeof platform === "undefined") {
    // Common
    config.android = config.android || {};

    // KeyStore
    config.android.keyStore = config.android.keyStore || {};
    if (!config.android.keyStore.keystorePath) {
      config.android.keyStore.keystorePath = path.join(
        PATHS.R2A.ROOT,
        FILE_NAMES.ANDROID.KEYSTORE
      );
    }
    if (!config.android.keyStore.keyAlias) {
      config.android.keyStore.keyAlias = FILE_NAMES.ANDROID.KEY_ALIAS;
    }

    if (
      !config.android.keyStore.keystorePassword &&
      process.env.R2A_ANDROID_KEYSTORE_PASSWORD
    ) {
      config.android.keyStore.keystorePassword =
        process.env.R2A_ANDROID_KEYSTORE_PASSWORD;
    }
    if (
      !config.android.keyStore.keyPassword &&
      process.env.R2A_ANDROID_KEY_PASSWORD
    ) {
      config.android.keyStore.keyPassword =
        process.env.R2A_ANDROID_KEY_PASSWORD;
    }
  }

  // Design
  // - common
  config.design = config.design || {};
  // - splash: set default values
  config.design.splash = config.design.splash || {};
  if (!config.design.splash.backgroundColor) {
    config.design.splash.backgroundColor = "#ffffff";
  }
  if (!config.design.splash.imageWidth) {
    config.design.splash.imageWidth = 200;
  }

  return config;
};

const validateR2AConfig = async (config: R2AConfig, platform?: Platform) => {
  // Validate common required fields
  if (!config.projectName) {
    throw new ConfigError(
      `Project name is required in the configuration`,
      ERROR_CODE.CONFIG.VALIDATION_FAILED
    );
  }

  if (!config.displayName) {
    throw new ConfigError(
      `Display name is required in the configuration`,
      ERROR_CODE.CONFIG.VALIDATION_FAILED
    );
  }

  if (!config.appId) {
    throw new ConfigError(
      `App ID is required in the configuration`,
      ERROR_CODE.CONFIG.VALIDATION_FAILED
    );
  }

  if (!config.productionUrl) {
    throw new ConfigError(
      `Production URL is required in the configuration`,
      ERROR_CODE.CONFIG.VALIDATION_FAILED
    );
  }

  if (!config.version) {
    throw new ConfigError(
      `Version is required in the configuration`,
      ERROR_CODE.CONFIG.VALIDATION_FAILED
    );
  }

  if (!config.scheme) {
    throw new ConfigError(
      `URL scheme is required in the configuration`,
      ERROR_CODE.CONFIG.VALIDATION_FAILED
    );
  }

  // Validate design configuration
  if (!config.design?.icon) {
    throw new ConfigError(
      `App icon path is required in the design configuration`,
      ERROR_CODE.CONFIG.VALIDATION_FAILED
    );
  }

  if (!config.design?.splash?.backgroundColor) {
    throw new ConfigError(
      `Splash screen background color is required in the design configuration`,
      ERROR_CODE.CONFIG.VALIDATION_FAILED
    );
  }

  if (!config.design?.splash?.image) {
    throw new ConfigError(
      `Splash screen image path is required in the design configuration`,
      ERROR_CODE.CONFIG.VALIDATION_FAILED
    );
  }

  // Validate platform-specific configurations
  if (platform === PLATFORM.IOS || typeof platform === "undefined") {
    if (!config.ios?.teamId) {
      throw new ConfigError(
        `Team ID is required for iOS configuration`,
        ERROR_CODE.CONFIG.VALIDATION_FAILED
      );
    }
  }

  if (platform === PLATFORM.ANDROID || typeof platform === "undefined") {
    if (!config.android?.keyStore?.keystorePath) {
      throw new ConfigError(
        `Keystore path is required for Android configuration`,
        ERROR_CODE.CONFIG.VALIDATION_FAILED
      );
    }

    if (!config.android?.keyStore?.keystorePassword) {
      throw new ConfigError(
        `Keystore password is required for Android configuration`,
        ERROR_CODE.CONFIG.VALIDATION_FAILED
      );
    }

    if (!config.android?.keyStore?.keyAlias) {
      throw new ConfigError(
        `Key alias is required for Android configuration`,
        ERROR_CODE.CONFIG.VALIDATION_FAILED
      );
    }

    if (!config.android?.keyStore?.keyPassword) {
      throw new ConfigError(
        `Key password is required for Android configuration`,
        ERROR_CODE.CONFIG.VALIDATION_FAILED
      );
    }
  }
};

export const ensureValidR2AConfig = async (platform: Platform) => {
  const config = await ensureR2AConfig();
  const normalizedConfig = await normalizeR2AConfig(config, platform);
  await validateR2AConfig(normalizedConfig, platform);
  return normalizedConfig;
};
