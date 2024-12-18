import { doctor } from "../commands/doctor.js";
import { syncN2AConfigWithExpo } from "../utils/sync.js";

export const sync = async () => {
  await doctor();
  await syncN2AConfigWithExpo();
};
