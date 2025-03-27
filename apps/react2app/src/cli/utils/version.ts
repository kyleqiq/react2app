import { readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

export function getPackageVersion(): string {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const pkgPath = path.resolve(__dirname, "../../../../package.json");
  const raw = readFileSync(pkgPath, "utf-8");
  const pkg = JSON.parse(raw);
  return pkg.version;
}
