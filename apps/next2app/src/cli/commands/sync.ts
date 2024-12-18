import { syncExpoProject } from "../features/sync.js";
import { doctor } from "./doctor.js";

export const sync = async () => {
  try {
    await doctor();
    await syncExpoProject();
  } catch (error) {
    console.error(error);
  }
};
