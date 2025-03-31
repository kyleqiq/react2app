import fs from "fs-extra";
import { PLATFORM } from "../../constants/index.js";
import { Platform } from "../../types/index.js";
import { PATHS } from "../../utils/path.js";
import { runSpawn } from "../../utils/program.js";

export const prebuildExpoApp = async (
  platform: Platform,
  options: { clean?: boolean } = { clean: false }
) => {
  if (options.clean) {
    await removePrebuild(platform);
  }
  const expoPaths = await PATHS.getExpoPaths();
  await runSpawn("npx", ["expo", "prebuild", "--platform", platform], {
    cwd: expoPaths.ROOT,
    stdio: "pipe",
  });
};

export const removePrebuild = async (platform: Platform) => {
  // get prebuild path
  const { ANDROID, IOS } = await PATHS.getExpoPaths();
  let prebuildPath;
  if (platform === PLATFORM.IOS) {
    prebuildPath = IOS.ROOT;
  }
  if (platform === PLATFORM.ANDROID) {
    prebuildPath = ANDROID.ROOT;
  }
  // remove prebuild
  await runSpawn("rm", ["-rf", prebuildPath]);
};

export const ensurePrebuild = async (platform: Platform) => {
  const prebuildPath = await getPrebuildPath(platform);
  if (!fs.existsSync(prebuildPath)) {
    throw new Error(`Prebuild path does not exist: ${prebuildPath}`);
  }
  return prebuildPath;
};

export const getPrebuildPath = async (platform: Platform) => {
  const expoPaths = await PATHS.getExpoPaths();
  if (platform === PLATFORM.IOS) {
    return expoPaths.IOS.ROOT;
  }
  if (platform === PLATFORM.ANDROID) {
    return expoPaths.ANDROID.ROOT;
  }
  throw new Error("Invalid platform");
};
