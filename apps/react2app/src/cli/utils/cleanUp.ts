import { logger } from "./logger.js";
import { PATHS } from "./path.js";
import { removeR2AConfig } from "./config.js";
import fs from "fs-extra";
import { removeAppLayout } from "./ux.js";

export const cleanupR2A = async (silent: boolean = false): Promise<void> => {
  try {
    // Remove config file
    removeR2AConfig();
    !silent && logger.info("Removed react2app.config.js");

    // Remove react2app folder if it exists
    if (fs.existsSync(PATHS.R2A.ROOT)) {
      await fs.remove(PATHS.R2A.ROOT);
      !silent && logger.info("Removed react2app folder");
    }

    removeAppLayout();

    !silent && logger.success("Clean completed successfully");
  } catch (error) {
    if (error instanceof Error) {
      logger.error(error.message);
    }
    throw error; // Re-throw to let the calling function handle it
  }
};
