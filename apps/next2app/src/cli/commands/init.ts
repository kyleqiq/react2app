import { initN2A } from "../features/init.js";

export const init = async () => {
  try {
    await initN2A();
  } catch (error) {
    throw error;
  }
};
