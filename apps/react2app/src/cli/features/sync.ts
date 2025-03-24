import { doctor } from "../commands/doctor.js";

import fs from "fs-extra";
import path from "path";
import { PATHS } from "../utils/path.js";
import { FILE_NAMES } from "../config/constants.js";

export const syncExpoProject = async () => {
  await syncExpoConfigWithR2A();
  await copyAssetsToExpo();
};

// Sync Expo config with R2A config
export const syncExpoConfigWithR2A = async () => {
  // read R2A config
  const config = await import(PATHS.R2A.CONFIG_FILE);
  const { projectName, displayName, appId, design, scheme, version } =
    config.default;

  // read Expo config
  const { ROOT: EXPO_ROOT } = await PATHS.getExpoPaths();
  const appConfigPath = path.join(EXPO_ROOT, FILE_NAMES.EXPO.APP_CONFIG);
  const existingConfig = await fs.readJson(appConfigPath).catch(() => ({}));

  // Update
  const expoConfig = {
    ...existingConfig,
    expo: {
      ...existingConfig.expo,
      name: displayName,
      slug: projectName,
      version,
      scheme,
      ios: {
        ...existingConfig.expo?.ios,
        bundleIdentifier: appId,
      },
      android: {
        ...existingConfig.expo?.android,
        package: appId,
      },
      icon: "./assets/images/icon.png",
      plugins: [
        [
          "expo-splash-screen",
          {
            backgroundColor: design.splash.backgroundColor,
            image: "./assets/images/splash.png",
            imageWidth: design.splash.imageWidth,
          },
        ],
      ],
    },
  };
  await fs.writeJson(appConfigPath, expoConfig, { spaces: 2 });
};

export const copyAssetsToExpo = async () => {
  const {
    default: { design },
  } = await import(PATHS.R2A.CONFIG_FILE);
  const { ROOT: EXPO_ROOT } = await PATHS.getExpoPaths();

  // copy design assets to Expo
  const iconPath = path.join(PATHS.NEXTJS.ROOT, design.icon);
  const splashPath = path.join(PATHS.NEXTJS.ROOT, design.splash.image);
  if (fs.existsSync(iconPath)) {
    await fs.copy(
      iconPath,
      path.join(EXPO_ROOT, "assets", "images", "icon.png")
    );
  }
  if (fs.existsSync(splashPath)) {
    await fs.copy(
      splashPath,
      path.join(EXPO_ROOT, "assets", "images", "splash.png")
    );
  }
};
