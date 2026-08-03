import path from "node:path";
import { execa } from "execa";
import { pathExists } from "./project.js";

export async function detectPackageManager(cwd) {
  if (
    await pathExists(
      path.join(cwd, "pnpm-lock.yaml")
    )
  ) {
    return "pnpm";
  }

  if (
    await pathExists(path.join(cwd, "yarn.lock"))
  ) {
    return "yarn";
  }

  if (
    (await pathExists(path.join(cwd, "bun.lock"))) ||
    (await pathExists(path.join(cwd, "bun.lockb")))
  ) {
    return "bun";
  }

  return "npm";
}

export async function installPackages({
  cwd,
  packageManager,
  packages,
  dev = false,
}) {
  const uniquePackages = [
    ...new Set(packages.filter(Boolean)),
  ];

  if (uniquePackages.length === 0) {
    return;
  }

  let command;
  let args;

  switch (packageManager) {
    case "pnpm":
      command = getExecutable("pnpm");
      args = [
        "add",
        ...(dev ? ["--save-dev"] : []),
        ...uniquePackages,
      ];
      break;

    case "yarn":
      command = getExecutable("yarn");
      args = [
        "add",
        ...(dev ? ["--dev"] : []),
        ...uniquePackages,
      ];
      break;

    case "bun":
      command = getExecutable("bun");
      args = [
        "add",
        ...(dev ? ["--dev"] : []),
        ...uniquePackages,
      ];
      break;

    default:
      command = getExecutable("npm");
      args = [
        "install",
        ...(dev ? ["--save-dev"] : []),
        ...uniquePackages,
      ];
  }

  await execa(command, args, {
    cwd,
    stdio: "inherit",
    shell: false,
  });
}

function getExecutable(command) {
  return process.platform === "win32"
    ? `${command}.cmd`
    : command;
}