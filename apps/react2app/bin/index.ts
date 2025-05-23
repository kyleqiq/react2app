#!/usr/bin/env node
import { Command } from "commander";
import { dev } from "../src/cli/commands/dev.js";
import build from "../src/cli/commands/build/index.js";
import { deploy } from "../src/cli/commands/deploy.js";
import { clean } from "../src/cli/commands/clean.js";
import { doctor } from "../src/cli/commands/doctor.js";
import {
  BuildCommandOptions,
  DevCommandOptions,
} from "../src/cli/types/index.js";
import { init } from "../src/cli/commands/init.js";
import { Platform } from "../src/cli/types/index.js";
import { getPackageVersion } from "../src/cli/utils/version.js";
import { PATHS } from "../src/cli/utils/path.js";
import pkg from "@next/env";
import inquirer from "inquirer";
import inquirerAutocomplete from "inquirer-autocomplete-prompt";

// Load Next.js env variables
const { loadEnvConfig } = pkg;
loadEnvConfig(PATHS.NEXTJS.ROOT);

// inquirer setup
inquirer.registerPrompt("autocomplete", inquirerAutocomplete);

const VERSION = getPackageVersion();

const program = new Command();

program.version(VERSION, "-V, --version", "output the current version");

program
  .command("dev [platform]")
  .description("Transform into app and start development server")
  .option("-v, --verbose", "Show detailed dev server logs for debugging")
  .option("-H, --host <host>", "Web server host")
  .option("-p, --port <port>", "Web server port")
  .option("-D, --dev", "Use local development template (For contributors)")
  .action(async (platform: Platform, options: DevCommandOptions) => {
    dev(platform, options);
  });

program
  .command("build [platform]")
  .description("Build for production")
  .option("-v, --verbose", "Show detailed build logs for debugging")
  .action(async (platform: Platform, options: BuildCommandOptions) => {
    build(platform, options);
  });
program.command("deploy").description("Deploy application").action(deploy);
program.command("doctor").description("Check for issues").action(doctor);
program.command("clean").description("Clean up").action(clean);
program.command("init").description("Initialize project").action(init);

program.parse();
