import fs from "fs-extra";
import path from "path";
import { PATHS } from "./path.js";
import { FILE_NAMES } from "../config/constants.js";

export const syncN2AConfigWithExpo = async () => {
  // read N2A config
  const { default: N2AConfig } = await import(PATHS.N2A.CONFIG_FILE);
  const { projectName, appId, displayName, design, scheme } = N2AConfig;

  // read Expo config
  const { ROOT: EXPO_ROOT } = await PATHS.getExpoPaths();
  const appConfigPath = path.join(EXPO_ROOT, FILE_NAMES.EXPO.APP_CONFIG);
  const existingConfig = await fs.readJson(appConfigPath).catch(() => ({}));

  // copy design assets to Expo
  const iconPath = path.join(PATHS.NEXTJS.ROOT, design.icon);
  const splashPath = path.join(PATHS.NEXTJS.ROOT, design.splash.image);
  await fs.copy(iconPath, path.join(EXPO_ROOT, "assets", "images", "icon.png"));
  await fs.copy(
    splashPath,
    path.join(EXPO_ROOT, "assets", "images", "splash.png")
  );

  // Update
  const expoConfig = {
    ...existingConfig,
    expo: {
      ...existingConfig.expo,
      name: displayName,
      slug: projectName,
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
