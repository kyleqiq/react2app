import { ConfigError, ERROR_CODE, ERROR_MESSAGES } from "../errors/index.js";
import { syncN2AConfigWithExpo } from "../utils/sync.js";
import { loadN2AConfig } from "../utils/config.js";
import { sync } from "../features/sync.js";

export const sync = async () => {
  try {
    await sync();
  } catch (error) {
    console.error(error);
  }
};
