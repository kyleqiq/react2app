import Conf from "conf";

export const saveToSystemFile = async (data: Record<string, unknown>) => {
  const config = new Conf({
    projectName: "next2app",
  });
  config.set(data);
};
