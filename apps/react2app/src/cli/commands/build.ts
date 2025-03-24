import inquirer from "inquirer";
import inquirerAutocomplete from "inquirer-autocomplete-prompt";
import { logger } from "../utils/logger.js";
import { PLATFORM } from "../constants/index.js";
import { Platform } from "../types/index.js";
import { ensureRequiredProgramInstalled, runSpawn } from "../utils/program.js";
import { PATHS } from "../utils/path.js";
import { BuildCommandOptions } from "../types/index.js";
import {
  ANDROID_REQUIRED_PROGRAMS,
  COMMON_REQUIRED_PROGRAMS,
  IOS_REQUIRED_PROGRAMS,
  Program,
} from "../config/programs.js";
import { ensureR2AKeyStore, setSDKLocation } from "../utils/android.js";
import { copyFastLaneConfig, runFastlaneBuild } from "../utils/fastlane.js";
import { updateExpoEnvFile } from "../utils/expo.js";

// Register the autocomplete prompt
inquirer.registerPrompt("autocomplete", inquirerAutocomplete);

// Prebuild
const prebuildExpoApp = async (platform: Platform, cwd: string) => {
  await runSpawn("npx", ["expo", "prebuild", "--platform", platform], {
    cwd,
    stdio: "pipe",
  });
};

// Build
const buildIOS = async () => {
  const expoPaths = await PATHS.getExpoPaths();
  const R2AConfigPath = PATHS.R2A.CONFIG_FILE;

  await prebuildExpoApp(PLATFORM.IOS, expoPaths.ROOT);
  await copyFastLaneConfig(expoPaths.IOS.ROOT);

  const { default: R2AConfig } = await import(R2AConfigPath);
  await runFastlaneBuild(PLATFORM.IOS, expoPaths.IOS.ROOT, {
    ...process.env,
    APP_NAME: R2AConfig.displayName.replace(/\s/g, ""),
    TEAM_ID: R2AConfig.ios.teamId,
  });
};

const buildAndroid = async () => {
  const expoPaths = await PATHS.getExpoPaths();
  const { default: R2AConfig } = await import(PATHS.R2A.CONFIG_FILE);

  await prebuildExpoApp(PLATFORM.ANDROID, expoPaths.ROOT);
  await setSDKLocation(expoPaths.ANDROID.ROOT);
  await copyFastLaneConfig(expoPaths.ANDROID.ROOT);

  const keyStore = await ensureR2AKeyStore();
  await runFastlaneBuild(PLATFORM.ANDROID, expoPaths.ANDROID.ROOT, {
    ...process.env,
    KEYSTORE_PATH: keyStore.keyStorePath,
    KEYSTORE_PASSWORD: keyStore.keyStorePassword,
    KEY_ALIAS: keyStore.keyAlias,
    KEY_PASSWORD: keyStore.keyPassword,
    APP_NAME: R2AConfig.displayName.replace(/\s/g, ""),
  });
};

export const build = async (
  platform: Platform,
  options: BuildCommandOptions
) => {
  try {
    // Install required program
    let requiredPrograms: Program[] = [...COMMON_REQUIRED_PROGRAMS];
    if (platform === PLATFORM.IOS) {
      requiredPrograms.push(...IOS_REQUIRED_PROGRAMS);
    } else if (platform === PLATFORM.ANDROID) {
      requiredPrograms.push(...ANDROID_REQUIRED_PROGRAMS);
    }
    await ensureRequiredProgramInstalled(requiredPrograms);

    // set production url
    const { default: R2AConfig } = await import(PATHS.R2A.CONFIG_FILE);
    await updateExpoEnvFile({
      EXPO_PUBLIC_WEBVIEW_URL: R2AConfig.productionUrl,
    });

    // Build app
    if (platform === PLATFORM.IOS) {
      await buildIOS();
    }
    if (platform === PLATFORM.ANDROID) {
      await buildAndroid();
    }
  } catch (error) {
    if (error instanceof Error) {
      logger.error(error.message);
    }
    process.exit(1);
  }
};
