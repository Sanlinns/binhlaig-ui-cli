import { execa } from "execa";
import { getComponentUrl } from "../registry.js";

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
  const args = ["init"];

  if (base) {
    args.push("--base", base);
  }

  if (yes) {
    args.push("--yes");
  }

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