import { loadN2AConfig } from "../utils/config.js";
import { validateExpoProject } from "../utils/expo.js";
import { validateN2AConfig } from "../utils/validation.js";
import { ConfigError, ERROR_CODE, ERROR_MESSAGES } from "../errors/index.js";
import ora from "ora";
import chalk from "chalk";

const N2A_CONFIG_VALIDATIONS = [
  {
    name: "Loading N2A Config",
    validate: async () => {
      const config = await loadN2AConfig();
      if (!config) {
        throw new ConfigError(
          ERROR_MESSAGES.CONFIG.NOT_FOUND,
          ERROR_CODE.CONFIG.NOT_FOUND
        );
      }
      return config;
    },
  },
  {
    name: "Validating N2A Config",
    validate: (config: any) => validateN2AConfig(config),
  },
];
const EXPO_PROJECT_VALIDATIONS = [
  {
    name: "Validating Expo Project",
    validate: (config: any) => validateExpoProject(config),
  },
];

export const doctor = async (
  validations = [...N2A_CONFIG_VALIDATIONS, ...EXPO_PROJECT_VALIDATIONS]
) => {
  let lastConfig;
  for (const validation of validations) {
    const spinner = ora(validation.name).start();
    try {
      lastConfig = await validation.validate(lastConfig);
      spinner.succeed(chalk.white(validation.name));
    } catch (error) {
      spinner.fail(chalk.red(validation.name));

      if (error instanceof ConfigError) {
        console.log("\n" + chalk.red("Error: ") + chalk.yellow(error.message));
        if (error.details) {
          console.log(chalk.dim("\nDetails:"));
          console.log(chalk.dim(error.details));
        }
        console.log("\n" + chalk.dim(`Error Code: ${error.code}`));
      } else {
        console.log("\n" + chalk.red("Error: ") + error);
      }

      process.exit(1);
    }
  }

  return;
};
