#!/usr/bin/env node

import process from "node:process";
import { readFile } from "node:fs/promises";
import { Command } from "commander";
import { execa } from "execa";
import chalk from "chalk";

const program = new Command();

const packageJson = JSON.parse(
  await readFile(new URL("../package.json", import.meta.url), "utf8"),
);

const REGISTRY_URL =
  process.env.BINHLAIG_REGISTRY_URL ||
  "https://ui.binhlaig.com/r";

const availableComponents = ["button"];

function getComponentUrl(component) {
  let registryUrl;

  try {
    registryUrl = new URL(`${REGISTRY_URL.replace(/\/+$/, "")}/`);
  } catch {
    throw new Error(
      `Invalid registry URL: ${REGISTRY_URL}. ` +
        "Set BINHLAIG_REGISTRY_URL to a valid HTTP(S) URL.",
    );
  }

  if (!["http:", "https:"].includes(registryUrl.protocol)) {
    throw new Error(
      `Unsupported registry protocol: ${registryUrl.protocol}`,
    );
  }

  return new URL(`${component}.json`, registryUrl).href;
}

program
  .name("binhlaig-ui")
  .description("Install Binhlaig UI components")
  .version(packageJson.version);

program
  .command("add")
  .description("Add a Binhlaig UI component")
  .argument("<component>", "Component name")
  .option("-o, --overwrite", "Overwrite existing files")
  .action(async (component, options) => {
    const normalizedComponent = component.trim().toLowerCase();

    if (!availableComponents.includes(normalizedComponent)) {
      console.error(
        chalk.red(`\nUnknown component: ${normalizedComponent}`),
      );
      console.log(
        chalk.gray(
          `Available components: ${availableComponents.join(", ")}`,
        ),
      );
      process.exitCode = 1;
      return;
    }

    try {
      const componentUrl = getComponentUrl(normalizedComponent);
      const args = [
        "shadcn@latest",
        "add",
        componentUrl,
        "--yes",
      ];

      if (options.overwrite) {
        args.push("--overwrite");
      }

      const npxExecutable =
        process.platform === "win32" ? "npx.cmd" : "npx";

      console.log(
        chalk.cyan(
          `Installing ${normalizedComponent} from ${componentUrl}`,
        ),
      );

      await execa(npxExecutable, args, {
        cwd: process.cwd(),
        stdio: "inherit",
        shell: false,
      });

      console.log(
        chalk.green(
          `\n${normalizedComponent} installed successfully`,
        ),
      );
      console.log();
      console.log(chalk.green("Use it with:"));
      console.log(
        chalk.cyan(
          'import { Button } from "@/components/ui/button";',
        ),
      );
    } catch (error) {
      console.error(
        chalk.red(
          `\nFailed to install ${normalizedComponent}: ${
            error instanceof Error
              ? error.message
              : String(error)
          }`,
        ),
      );
      process.exitCode = 1;
    }
  });

program
  .command("list")
  .description("List available components")
  .action(() => {
    console.log(
      chalk.bold("\nAvailable Binhlaig UI components:\n"),
    );

    for (const component of availableComponents) {
      console.log(`  - ${component}`);
    }

    console.log();
  });

await program.parseAsync(process.argv);
