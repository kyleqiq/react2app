import { runSpawn } from "../utils/program.js";
import { spawn } from "child_process";

export const PROGRAM = {
  XCODE: "Xcode",
  FASTLANE: "Fastlane",
  BREW: "Brew",
  ANDROID_STUDIO: "Android Studio",
} as const;

export type Program = (typeof PROGRAM)[keyof typeof PROGRAM];

export function runSpawnSafe(
  command: string,
  args: string[]
): Promise<boolean> {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      stdio: ["pipe", "pipe", "pipe"],
      shell: true,
    });

    child.on("error", (err) => {
      resolve(false);
      throw err;
    });

    child.on("exit", (code) => {
      resolve(code === 0);
    });
  });
}

// Add a new function that returns stdout
export function runSpawnWithOutput(
  command: string,
  args: string[]
): Promise<{ success: boolean; stdout: string }> {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      stdio: ["pipe", "pipe", "pipe"],
      shell: true,
    });

    let stdout = "";

    child.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    child.on("error", () => {
      resolve({ success: false, stdout: "" });
    });

    child.on("exit", (code) => {
      resolve({ success: code === 0, stdout });
    });
  });
}

export const PROGRAM_COMMANDS: Record<
  Program,
  {
    version?: { command: string; args: string[] };
    install: () => Promise<void>;
    isInstalled: () => Promise<boolean>;
    docs?: string;
  }
> = {
  [PROGRAM.XCODE]: {
    install: async () => {
      await runSpawn("xcode-select", ["--install"]);
    },
    isInstalled: async () => {
      try {
        const { success, stdout } = await runSpawnWithOutput("xcode-select", [
          "-p",
        ]);
        if (success && stdout.includes("Xcode.app")) {
          return true;
        }
        return false;
      } catch (error) {
        console.log(error);
        return false;
      }
    },
    docs: "https://react2app.com/docs/guide/build-and-publish#step-2-build-ipa-file",
  },

  [PROGRAM.BREW]: {
    install: async () => {
      await runSpawnSafe("/bin/bash", [
        "-c",
        "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)",
      ]);
    },
    isInstalled: async () => {
      try {
        await runSpawnSafe("brew", ["-v"]);
        return true;
      } catch (error) {
        console.log(error);
        return false;
      }
    },
  },
  [PROGRAM.FASTLANE]: {
    install: async () => {
      await runSpawnSafe("brew", ["install", "fastlane"]);
    },
    isInstalled: async () => {
      try {
        const { success, stdout } = await runSpawnWithOutput("fastlane", [
          "-v",
        ]);
        return success;
      } catch (error) {
        console.error(error);
        return false;
      }
    },
    docs: "https://react2app.com/docs/guide/build-and-publish#step-2-build-ipa-file",
  },
  [PROGRAM.ANDROID_STUDIO]: {
    isInstalled: async () => {
      try {
        await runSpawnSafe(
          "/Applications/Android Studio.app/Contents/MacOS/studio",
          ["--help"]
        );
        return true;
      } catch (error) {
        console.log(error);
        return false;
      }
    },
    install: async () => {
      console.log(
        "Install Android Studio at: https://developer.android.com/studio and run 'react2app build android' again"
      );
      process.exit(1);
    },
  },
};

export const COMMON_REQUIRED_PROGRAMS = [PROGRAM.BREW, PROGRAM.FASTLANE];
export const IOS_REQUIRED_PROGRAMS = [PROGRAM.XCODE];
export const ANDROID_REQUIRED_PROGRAMS = [PROGRAM.ANDROID_STUDIO];
