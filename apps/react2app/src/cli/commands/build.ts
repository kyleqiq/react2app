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
import pkg from "@next/env";
import { syncExpoConfigWithR2A } from "../features/sync.js";
import ora from "ora";

const { loadEnvConfig } = pkg;
loadEnvConfig(PATHS.NEXTJS.ROOT);

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
  const appName = R2AConfig.displayName.replace(/\s/g, "");
  const teamId = R2AConfig.ios.teamId;

  await runFastlaneBuild(PLATFORM.IOS, expoPaths.IOS.ROOT, {
    ...process.env,
    APP_NAME: appName,
    TEAM_ID: teamId,
  });

  // Copy build file to R2A root
  await runSpawn("cp", [
    `${expoPaths.IOS.IPA_DIR}/${appName}.ipa`,
    `${PATHS.R2A.ROOT}`,
  ]);
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

const removeIOSBuild = async () => {
  const { IOS } = await PATHS.getExpoPaths();
  await runSpawn("rm", ["-rf", IOS.ROOT]);
};

const removeAndroidBuild = async () => {
  const { ANDROID } = await PATHS.getExpoPaths();
  await runSpawn("rm", ["-rf", ANDROID.ROOT]);
};

export const build = async (
  userSelectedPlatform: Platform | undefined,
  options: BuildCommandOptions
) => {
  if (options.verbose) {
    console.log("Debug mode(verbose mode is enabled)");
  }

  let platform = userSelectedPlatform;
  if (!platform) {
    const { platform: selectedPlatform } = await inquirer.prompt([
      {
        type: "list",
        name: "platform",
        message: "Select the platform you want to build",
        choices: [PLATFORM.IOS, PLATFORM.ANDROID],
      },
    ]);
    platform = selectedPlatform as Platform;
  }

  const buildSpinner = ora(
    `📦 Building ${platform?.toUpperCase()} app (Time for coffee... See you in 10 minutes!)`
  );
  try {
    // Install required program
    let requiredPrograms: Program[] = [...COMMON_REQUIRED_PROGRAMS];
    if (platform === PLATFORM.IOS) {
      requiredPrograms.push(...IOS_REQUIRED_PROGRAMS);
    } else if (platform === PLATFORM.ANDROID) {
      requiredPrograms.push(...ANDROID_REQUIRED_PROGRAMS);
    }
    await ensureRequiredProgramInstalled(requiredPrograms);

    buildSpinner.start();
    // Sync expo config with R2A config
    await syncExpoConfigWithR2A();
    // Build app
    if (platform === PLATFORM.IOS) {
      await removeIOSBuild();
      await buildIOS();
    }
    if (platform === PLATFORM.ANDROID) {
      await removeAndroidBuild();
      await buildAndroid();
    }

    if (!options.verbose) {
      buildSpinner.succeed(
        "Build completed! You can now check the react2app folder."
      );
    }
  } catch (error) {
    if (error instanceof Error) {
      logger.error(error.message);
    }
    buildSpinner.fail("Build failed.");
    process.exit(1);
  }
};
