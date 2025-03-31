import inquirer from "inquirer";
import { spawn } from "node:child_process";
import {
  ANDROID_REQUIRED_PROGRAMS,
  COMMON_REQUIRED_PROGRAMS,
  IOS_REQUIRED_PROGRAMS,
  Program,
  PROGRAM_COMMANDS,
} from "../config/programs.js";
import { logger } from "./logger.js";
import { PLATFORM } from "../constants/index.js";
import { Platform } from "../types/index.js";

export const runSpawn = (
  command: string,
  args: string[] = [],
  options = {}
) => {
  return new Promise((resolve, reject) => {
    const childProcess = spawn(command, args, options);

    let stdout = "";
    let stderr = "";

    // Capture stdout and stderr if they exist
    if (childProcess.stdout) {
      childProcess.stdout.on("data", (data) => {
        stdout += data.toString();
      });
    }

    if (childProcess.stderr) {
      childProcess.stderr.on("data", (data) => {
        stderr += data.toString();
      });
    }

    childProcess.on("error", (error) => {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        reject(new Error(`${command} is not installed`));
      } else {
        reject(error);
      }
    });

    childProcess.on("exit", (code) => {
      if (code === 0) {
        resolve(stdout);
      } else {
        reject(new Error(`${command} exited with code ${code}: ${stderr}`));
      }
    });
  });
};

export const promptRequiredProgramsInstall = async () => {
  const { shouldInstall } = await inquirer.prompt([
    {
      type: "confirm",
      name: "shouldInstall",
      message: "Install required programs?",
    },
  ]);
  return shouldInstall;
};

export async function findMissingPrograms(requiredPrograms: Program[]) {
  const programInstallCheckResults = await Promise.all(
    requiredPrograms.map(async (program) => {
      try {
        const isInstalled = await PROGRAM_COMMANDS[program].isInstalled();
        return { program, isInstalled, docs: PROGRAM_COMMANDS[program].docs };
      } catch (error) {
        console.error(`error occurred while checking ${program} `, error);
        return {
          program,
          isInstalled: false,
          docs: PROGRAM_COMMANDS[program].docs,
        };
      }
    })
  );

  const missingPrograms = programInstallCheckResults
    .filter(({ isInstalled }) => !isInstalled)
    .map(({ program }) => program);

  return missingPrograms;
}

export const ensureRequiredProgramInstalled = async (platform: Platform) => {
  // Get required programs
  let requiredPrograms: Program[] = [...COMMON_REQUIRED_PROGRAMS];
  if (platform === PLATFORM.IOS) {
    requiredPrograms.push(...IOS_REQUIRED_PROGRAMS);
  } else if (platform === PLATFORM.ANDROID) {
    requiredPrograms.push(...ANDROID_REQUIRED_PROGRAMS);
  }

  // Find missing programs
  const missingPrograms = await findMissingPrograms(requiredPrograms);

  if (missingPrograms.length > 0) {
    // Execute install command
    // const isInstallAllowed = await promptRequiredProgramsInstall();
    // if (isInstallAllowed) {
    //   for (const missingProgram of missingPrograms) {
    //     await PROGRAM_COMMANDS[missingProgram].install();
    //   }
    //   return;
    // }
    const errorMessages = missingPrograms.map((missingProgram) => {
      return `'${missingProgram}' is not installed. Please install the required programs to build.\nFor more information: ${PROGRAM_COMMANDS[missingProgram].docs}`;
    });
    throw new Error(errorMessages.join("\n"));
  }
};
