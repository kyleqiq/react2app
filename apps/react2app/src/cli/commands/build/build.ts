import ora from "ora";
import fs from "fs-extra";
import path from "path";
import { logger } from "../../utils/logger.js";
import { PLATFORM } from "../../constants/index.js";
import { ensureRequiredProgramInstalled } from "../../utils/program.js";
import { PATHS } from "../../utils/path.js";
import {
  ensureR2AKeyStore,
  setAndroidSDKLocation,
} from "../../utils/android.js";
import { ensureValidR2AConfig } from "../../utils/config.js";
import { BuildCommandOptions, Platform } from "../../types/index.js";
import { copyFastLaneConfig, runFastlaneBuild } from "../../utils/fastlane.js";
import { syncExpoConfigWithR2A } from "../../features/sync.js";
import { getPrebuildPath, prebuildExpoApp } from "./prebuild.js";
import {
  ensureBuildFile,
  ensurePlatform,
  getFastlanePlatformEnv,
} from "./utils.js";

export const build = async (
  initialPlatform: Platform | undefined,
  options: BuildCommandOptions
) => {
  const platform = await ensurePlatform(initialPlatform);
  const buildSpinner = ora(
    `📦 Building ${platform} app (Time for coffee... See you in 10 minutes!)`
  );

  try {
    // Ensure Required Programs Installed
    await ensureRequiredProgramInstalled(platform);

    // Sync Expo Config & Validate R2AConfig
    await syncExpoConfigWithR2A();
    const R2AConfig = await ensureValidR2AConfig(platform);

    // Ensure KeyStore exists for Android
    if (platform === PLATFORM.ANDROID) {
      await ensureR2AKeyStore();
    }

    buildSpinner.start();

    // Prebuild
    const prebuildPath = await getPrebuildPath(platform);
    await prebuildExpoApp(platform, { clean: true });
    await copyFastLaneConfig(prebuildPath);

    // Android setup
    if (platform === PLATFORM.ANDROID) {
      const {
        ANDROID: { ROOT: expoAndroidRoot },
      } = await PATHS.getExpoPaths();
      await setAndroidSDKLocation(expoAndroidRoot);
    }

    // iOS setup
    if (platform === PLATFORM.IOS) {
    }

    // Bulid
    const platformEnv = await getFastlanePlatformEnv(platform);
    await runFastlaneBuild(platform, {
      ...process.env,
      APP_NAME: R2AConfig.displayName,
      ...platformEnv,
    });

    // Copy build file to R2A root
    const { buildDir, buildFilename, buildFileFormat } =
      await ensureBuildFile(platform);
    fs.copy(
      path.join(buildDir, `${buildFilename}.${buildFileFormat}`),
      path.join(PATHS.R2A.ROOT, `${R2AConfig.displayName}.${buildFileFormat}`)
    );

    buildSpinner.succeed(
      "Build completed! You can now check the react2app folder."
    );
  } catch (error) {
    if (error instanceof Error) {
      logger.error(error.message);
    }
    buildSpinner.fail("Build failed.");
    process.exit(1);
  }
};
