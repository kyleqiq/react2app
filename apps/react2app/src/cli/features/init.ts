import { createExpoEnvFile, createExpoProject } from "../utils/expo.js";
import { createR2AConfig } from "../utils/config.js";
import { updateEnvFile } from "../utils/env.js";
import { PATHS } from "../utils/path.js";
import Conf from "conf";
import { convertPackageNameToAppId } from "../utils/packageName.js";
import { convertPackageNameToDisplayName } from "../utils/packageName.js";
import { convertPackageNameToProjectName } from "../utils/packageName.js";
import fs from "fs-extra";
import { addAppLayout } from "../utils/ux.js";
import { FILE_NAMES } from "../config/constants.js";
import { syncExpoProject } from "./sync.js";

interface InitR2AOptions {
  isDevMode?: boolean;
}

export const initR2A = async (
  options: InitR2AOptions = {
    isDevMode: false,
  }
) => {
  try {
    // Setup R2A config file
    await createR2AConfig();
    // - Update config values based on package name in package.json
    const packageJson = new Conf({
      cwd: PATHS.PROJECT_ROOT,
      configName: "package",
      fileExtension: "json",
    });
    const packageName = packageJson.get("name") as string;
    const projectName = convertPackageNameToProjectName(packageName);
    const displayName = convertPackageNameToDisplayName(packageName);
    const appId = convertPackageNameToAppId(packageName);
    const { default: R2AConfig } = await import(PATHS.R2A.CONFIG_FILE);
    R2AConfig.projectName = projectName;
    R2AConfig.displayName = displayName;
    R2AConfig.appId = appId;
    const template = await fs.readFile(PATHS.CLI.CONFIG_TEMPLATE, "utf-8");
    const configContent = template
      .replace(/projectName:\s*null/, `projectName: "${projectName}"`)
      .replace(/displayName:\s*null/, `displayName: "${displayName}"`)
      .replace(/appId:\s*null/, `appId: "${appId}"`);
    await fs.writeFile(PATHS.R2A.CONFIG_FILE, configContent);

    // Setup Next.js .env.local file
    await fs.ensureFile(PATHS.NEXTJS.ENV_FILE);
    await updateEnvFile(PATHS.NEXTJS.ENV_FILE, {
      R2A_IOS_TEAM_ID: "PUT_YOUR_TEAM_ID_HERE",
      R2A_ANDROID_KEYSTORE_PASSWORD: "PUT_YOUR_KEYSTORE_PASSWORD_HERE",
      R2A_ANDROID_KEY_PASSWORD: "PUT_YOUR_KEY_PASSWORD_HERE",
    });

    // Setup Next.js UX related files
    await addAppLayout();

    // Setup Expo project
    await createExpoProject({
      projectName,
      template: options.isDevMode
        ? PATHS.DEV_EXPO_TEMPLATE
        : FILE_NAMES.EXPO.TEMPLATE,
    });
    await createExpoEnvFile();
    await syncExpoProject();
  } catch (error) {
    throw error;
  }
};
