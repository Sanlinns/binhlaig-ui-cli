import path from "node:path";
import { randomUUID } from "node:crypto";
import { readFile, rename, unlink, writeFile } from "node:fs/promises";

export const BINHLAIG_SCHEMA = "https://ui.binhlaig.com/schema.json";
export const SUPPORTED_INSTALLERS = ["native", "shadcn"];

export function normalizeInstaller(value) {
  if (value === undefined || value === null) return null;
  const normalized = String(value).trim().toLowerCase();
  return SUPPORTED_INSTALLERS.includes(normalized) ? normalized : null;
}

export async function readBinhlaigConfig(cwd = process.cwd()) {
  const configPath = path.join(cwd, "binhlaig.json");
  let source;
  try {
    source = await readFile(configPath, "utf8");
  } catch (error) {
    if (error?.code === "ENOENT") return null;
    throw error;
  }

  try {
    const config = JSON.parse(source);
    if (!config || Array.isArray(config) || typeof config !== "object") {
      throw new Error("the root value must be a JSON object");
    }
    return config;
  } catch (error) {
    throw new Error(`Invalid JSON in ${configPath}: ${error.message}`, { cause: error });
  }
}

export async function updateBinhlaigConfig(cwd, updates) {
  const configPath = path.join(cwd, "binhlaig.json");
  const existing = (await readBinhlaigConfig(cwd)) ?? {};
  const config = { $schema: BINHLAIG_SCHEMA, ...existing, ...updates };
  const temporaryPath = `${configPath}.${randomUUID()}.tmp`;

  try {
    await writeFile(temporaryPath, `${JSON.stringify(config, null, 2)}\n`, {
      encoding: "utf8",
      flag: "wx",
    });
    await rename(temporaryPath, configPath);
  } catch (error) {
    await unlink(temporaryPath).catch(() => {});
    throw error;
  }

  return config;
}

export async function resolveInstaller({ cwd = process.cwd(), explicitInstaller }) {
  if (explicitInstaller !== undefined) {
    const installer = normalizeInstaller(explicitInstaller);
    if (!installer) {
      throw new Error(
        `Unsupported installer: ${explicitInstaller}\nSupported installers: ${SUPPORTED_INSTALLERS.join(", ")}`
      );
    }
    return installer;
  }

  const config = await readBinhlaigConfig(cwd);
  if (!config || config.installer === undefined) {
    throw new Error(
      "Binhlaig UI has not been initialized.\nRun:\nnpx binhlaig-ui@latest init"
    );
  }

  const installer = normalizeInstaller(config.installer);
  if (!installer) {
    throw new Error(
      `Invalid installer in binhlaig.json: ${JSON.stringify(config.installer)}\nSupported installers: ${SUPPORTED_INSTALLERS.join(", ")}`
    );
  }
  return installer;
}
