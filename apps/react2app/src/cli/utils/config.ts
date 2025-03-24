import type { R2AConfig } from "../types/index.js";
import fs from "fs-extra";
import { PATHS } from "./path.js";
import { ConfigError } from "../errors/index.js";
import { ERROR_MESSAGES } from "../errors/index.js";
import { ERROR_CODE } from "../errors/index.js";

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
