import fs from "fs/promises";
import { PATHS } from "./path.js";

export const addAppLayout = async () => {
  const layoutPath = PATHS.NEXTJS.LAYOUT_FILE;
  const layoutContent = await fs.readFile(layoutPath, "utf8");

  if (layoutContent.includes("<AppLayout>")) {
    return;
  }

  const importStatement = "import { AppLayout } from 'next2app';\n";
  const newLayoutContent =
    importStatement +
    layoutContent.replace(
      /(<body[^>]*>)([\s\S]*?)(\{children\})([\s\S]*?)(<\/body>)/,
      "$1$2<AppLayout>{children}</AppLayout>$4$5"
    );

  await fs.writeFile(layoutPath, newLayoutContent);
};

export const removeAppLayout = async () => {
  const layoutPath = PATHS.NEXTJS.LAYOUT_FILE;
  const layoutContent = await fs.readFile(layoutPath, "utf8");

  const withoutImport = layoutContent.replace(
    /import\s*{\s*AppLayout\s*}\s*from\s*['"]next2app['"];\s*\n/,
    ""
  );

  const newLayoutContent = withoutImport.replace(
    /(<body[^>]*>)([\s\S]*?)<AppLayout>([\s\S]*?)<\/AppLayout>([\s\S]*?)(<\/body>)/,
    "$1$2$3$4$5"
  );

  await fs.writeFile(layoutPath, newLayoutContent);
};
