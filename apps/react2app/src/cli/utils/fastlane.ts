import fs from "fs-extra";
import path from "path";
import { PATHS } from "./path.js";
import { runSpawn } from "./program.js";
import { Platform } from "../types/index.js";
import { ensurePrebuild } from "../commands/build/prebuild.js";

export const copyFastLaneConfig = async (
  destinationPath: string,
  onError?: (error: Error) => void
) => {
  fs.cp(
    path.join(PATHS.CLI.ROOT, "fastlane"),
    path.join(destinationPath, "fastlane"),
    { recursive: true },
    (error) => {
      if (error) {
        onError?.(error);
        throw error;
      }
    }
  );
};

export const runFastlaneBuild = async (
  platform: Platform,
  env: Record<string, string>
) => {
  try {
    const prebuildPath = await ensurePrebuild(platform);
    await runSpawn("fastlane", [platform, "build"], {
      cwd: prebuildPath,
      stdio: ["ignore", "pipe", "pipe"],
      env,
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw new Error(`Failed to run fastlane build: ${error.message}`);
    }
    throw new Error(`Failed to run fastlane build: ${error}`);
  }
};
