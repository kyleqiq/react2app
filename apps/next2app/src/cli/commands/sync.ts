import { syncExpoProject } from "../features/sync.js";

export const sync = async () => {
  try {
    await syncExpoProject();
  } catch (error) {
    console.error(error);
  }
};
