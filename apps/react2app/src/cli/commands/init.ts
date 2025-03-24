import { initR2A } from "../features/init.js";

export const init = async () => {
  try {
    await initR2A();
  } catch (error) {
    throw error;
  }
};
