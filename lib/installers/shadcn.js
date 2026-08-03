import path from "node:path";
import { execa } from "execa";
import { getComponentUrl } from "../registry.js";
import { pathExists } from "../project.js";
import {
  ensureBinhlaigFoundation,
} from "./native.js";

function getNpxExecutable() {
  return process.platform === "win32"
    ? "npx.cmd"
    : "npx";
}

export async function initializeWithShadcn({
  cwd,
  base,
  yes,
}) {
  const args = [
    "init",
    "--base",
    base || "base",
    "--preset",
    "nova",
  ];

  if (yes) {
    args.push("--yes");
  }

  const configExists = await pathExists(
    path.join(cwd, "components.json")
  );

  if (!configExists) {
    await execa(
      getNpxExecutable(),
      ["shadcn@latest", ...args],
      {
        cwd,
        stdio: "inherit",
        shell: false,
      }
    );
  }

  const foundation =
    await ensureBinhlaigFoundation({ cwd });

  return {
    ...foundation,
    shadcnInitialized: !configExists,
  };
}

export async function installWithShadcn({
  cwd,
  component,
  overwrite = false,
}) {
  const componentUrl = getComponentUrl(component);

  const args = [
    "shadcn@latest",
    "add",
    componentUrl,
    "--yes",
  ];

  if (overwrite) {
    args.push("--overwrite");
  }

  await execa(getNpxExecutable(), args, {
    cwd,
    stdio: "inherit",
    shell: false,
  });

  return {
    componentUrl,
  };
}
