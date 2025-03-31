import { PATHS } from "../../utils/path.js";
import { Platform } from "../../types/index.js";
import { PLATFORM } from "../../constants/index.js";
import inquirer from "inquirer";
import fs from "fs-extra";
import { ensureR2AConfig } from "../../utils/config.js";
import path from "path";

export const getBuildFileDir = async (platform: Platform) => {
  const expoPaths = await PATHS.getExpoPaths();
  if (platform === PLATFORM.IOS) {
    return expoPaths.IOS.BUILD_DIR;
  }
  if (platform === PLATFORM.ANDROID) {
    return expoPaths.ANDROID.BUILD_DIR;
  }
  throw new Error("Invalid platform");
};

export const getBuildFileInfo = async (platform: Platform) => {
  const buildDir = await getBuildFileDir(platform);
  const R2AConfig = await ensureR2AConfig();
  if (platform === PLATFORM.IOS) {
    return {
      buildDir,
      buildFilename: R2AConfig.displayName,
      buildFileFormat: "ipa",
    };
  }
  if (platform === PLATFORM.ANDROID) {
    return {
      buildDir,
      buildFilename: `app-release`,
      buildFileFormat: "aab",
    };
  }
  throw new Error("Invalid platform");
};

export const ensureBuildFile = async (platform: Platform) => {
  const { buildDir, buildFilename, buildFileFormat } =
    await getBuildFileInfo(platform);
  const buildFilePath = path.join(
    buildDir,
    `${buildFilename}.${buildFileFormat}`
  );
  if (!fs.existsSync(buildFilePath)) {
    throw new Error(`Build file does not exist: ${buildFilePath}`);
  }
  return { buildDir, buildFilename, buildFileFormat };
};

export const ensurePlatform = async (
  initialPlatform?: Platform
): Promise<Platform> => {
  if (initialPlatform) return initialPlatform;
  const { platform: selectedPlatform } = await inquirer.prompt([
    {
      type: "list",
      name: "platform",
      message: "Select the platform you want to build",
      choices: [PLATFORM.IOS, PLATFORM.ANDROID],
    },
  ]);
  return selectedPlatform as Platform;
};

/**
 * Get required fastlane environment variables for the platform
 * @param platform - IOS or ANDROID
 * @returns {Record<string, string>} - The fastlane environment variables
 */
export const getFastlanePlatformEnv = async (
  platform: Platform
): Promise<Record<string, string>> => {
  const R2AConfig = await ensureR2AConfig();
  if (platform === PLATFORM.IOS) {
    return {
      TEAM_ID: R2AConfig.ios.teamId,
    };
  }
  if (platform === PLATFORM.ANDROID) {
    return {
      KEYSTORE_PATH: path.resolve(R2AConfig.android.keyStore.keystorePath),
      KEYSTORE_PASSWORD: R2AConfig.android.keyStore.keystorePassword,
      KEY_ALIAS: R2AConfig.android.keyStore.keyAlias,
      KEY_PASSWORD: R2AConfig.android.keyStore.keyPassword,
    };
  }
  throw new Error("Invalid platform");
};
