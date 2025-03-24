import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { DIRECTORY_NAMES, FILE_NAMES } from "../config/constants.js";

const CLI_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../.."
);

export const getExpoAppNameFromDirectory = async (): Promise<string | null> => {
  // Get expo app names based on the directories in react2app
  const R2ADir = path.join(process.cwd(), DIRECTORY_NAMES.R2A);
  if (!fs.existsSync(R2ADir)) {
    // throw new Error("react2app directory not found");
    return null;
  }
  const dirs = fs.readdirSync(R2ADir);
  const expoDirs = dirs.filter((dir) => {
    const dirPath = path.join(R2ADir, dir);
    return (
      fs.statSync(dirPath).isDirectory() &&
      fs.existsSync(path.join(dirPath, "app.json"))
    ); // Check for expo project marker
  });
  if (expoDirs.length === 0) {
    // throw new Error("No expo project found");
    return null;
  }
  // Return the first expo directory
  return expoDirs[0];
};

export const getExpoAppNameFromConfig = async (): Promise<string> => {
  if (!fs.existsSync(PATHS.R2A.CONFIG_FILE)) {
    throw new Error("react2app.config.js not found in project root");
  }
  const { default: config } = await import(PATHS.R2A.CONFIG_FILE);
  if (!config.projectName) {
    throw new Error("Project name not set in react2app.config.js");
  }
  return config.projectName;
};

export const PATHS = {
  DEV_EXPO_TEMPLATE: path.join(
    CLI_ROOT,
    "../../..", // Go up to monorepo root
    "packages",
    "expo-template"
  ),
  CLI: {
    ROOT: CLI_ROOT,
    TEMPLATES: path.join(CLI_ROOT, DIRECTORY_NAMES.TEMPLATES),
    CONFIG_TEMPLATE: path.join(
      CLI_ROOT,
      DIRECTORY_NAMES.TEMPLATES,
      FILE_NAMES.R2A.CONFIG_TEMPLATE
    ),
  },
  PROJECT_ROOT: process.cwd(),
  R2A: {
    ROOT: path.join(process.cwd(), DIRECTORY_NAMES.R2A),
    CONFIG_FILE: path.join(process.cwd(), FILE_NAMES.R2A.CONFIG),
  },
  NEXTJS: {
    ROOT: process.cwd(),
    SRC: path.join(process.cwd(), "src"),
    ENV_FILE: path.join(process.cwd(), FILE_NAMES.NEXTJS.ENV),
    CONFIG_FILE: path.join(process.cwd(), FILE_NAMES.NEXTJS.CONFIG),
    LAYOUT_FILE: path.join(process.cwd(), "/app", FILE_NAMES.NEXTJS.LAYOUT),
  },
  ANDROID: {
    KEYSTORE: path.resolve(process.cwd(), FILE_NAMES.ANDROID.KEYSTORE),
  },
  getExpoPaths: async () => {
    const expoAppName = await getExpoAppNameFromConfig();
    return {
      ROOT: path.join(process.cwd(), DIRECTORY_NAMES.R2A, expoAppName),
      SRC: path.join(process.cwd(), DIRECTORY_NAMES.R2A, expoAppName, "src"),
      ENV_FILE: path.join(
        process.cwd(),
        DIRECTORY_NAMES.R2A,
        expoAppName,
        FILE_NAMES.EXPO.ENV
      ),
      ANDROID: {
        ROOT: path.join(
          process.cwd(),
          DIRECTORY_NAMES.R2A,
          expoAppName,
          "android"
        ),
      },
      IOS: {
        ROOT: path.join(process.cwd(), DIRECTORY_NAMES.R2A, expoAppName, "ios"),
      },
      APP_CONFIG: path.join(
        process.cwd(),
        DIRECTORY_NAMES.R2A,
        expoAppName,
        FILE_NAMES.EXPO.APP_CONFIG
      ),
      CONFIG_FILE: path.join(
        process.cwd(),
        DIRECTORY_NAMES.R2A,
        expoAppName,
        FILE_NAMES.EXPO.CONFIG
      ),
    };
  },
} as const;

export const ensureDirectoryExists = (dirPath: string): string => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
  return dirPath;
};

export const resolveProjectPath = (...paths: string[]): string => {
  validateProjectRoot();
  return path.join(PATHS.PROJECT_ROOT, ...paths);
};

export const validateProjectRoot = (): void => {
  const packageJsonPath = path.join(PATHS.PROJECT_ROOT, "package.json");
  if (!fs.existsSync(packageJsonPath)) {
    throw new Error(
      "This command must be run in the root directory of your project (where package.json is located)"
    );
  }
};
