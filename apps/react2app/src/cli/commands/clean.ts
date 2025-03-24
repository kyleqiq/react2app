import { CommandOptions } from "../types/index.js";
import { logger } from "../utils/logger.js";
import { cleanupR2A as cleanUpR2A } from "../utils/cleanUp.js";

export const clean = async (options: CommandOptions): Promise<void> => {
  try {
    await cleanUpR2A();
  } catch (error) {
    if (error instanceof Error) {
      logger.error(error.message);
    }
  }
};
