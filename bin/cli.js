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

const availableComponents = [
  "button",
  "card",
  "badge",
  "input",
  "tabs",
];

const componentImports = {
  button: 'import { Button } from "@/components/ui/button";',
  card: `import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";`,
  badge: 'import { Badge } from "@/components/ui/badge";',
  input: 'import { Input } from "@/components/ui/input";',
  tabs: `import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";`,
};

function getNpxExecutable() {
  return process.platform === "win32" ? "npx.cmd" : "npx";
}

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

async function runShadcn(args) {
  await execa(getNpxExecutable(), ["shadcn@latest", ...args], {
    cwd: process.cwd(),
    stdio: "inherit",
    shell: false,
  });
}

program
  .name("binhlaig-ui")
  .description("Initialize and install Binhlaig UI components")
  .version(packageJson.version);

/**
 * Initialize Binhlaig UI
 *
 * Examples:
 *   binhlaig-ui init
 *   binhlaig-ui init --yes
 *   binhlaig-ui init --base radix
 *   binhlaig-ui init --base base
 */
program
  .command("init")
  .description("Initialize Binhlaig UI in the current project")
  .option(
    "-b, --base <base>",
    "Component base: base, radix, or aria",
  )
  .option("-y, --yes", "Skip confirmation prompts")
  .action(async (options) => {
    const supportedBases = ["base", "radix", "aria"];

    if (
      options.base &&
      !supportedBases.includes(options.base.toLowerCase())
    ) {
      console.error(
        chalk.red(
          `\nUnsupported base: ${options.base}`,
        ),
      );

      console.log(
        chalk.gray(
          `Supported bases: ${supportedBases.join(", ")}`,
        ),
      );

      process.exitCode = 1;
      return;
    }

    const args = ["init"];

    if (options.base) {
      args.push("--base", options.base.toLowerCase());
    }

    if (options.yes) {
      args.push("--yes");
    }

    console.log();
    console.log(
      chalk.cyan("Initializing Binhlaig UI..."),
    );
    console.log();

    try {
      await runShadcn(args);

      console.log();
      console.log(
        chalk.green(
          "Binhlaig UI initialized successfully.",
        ),
      );

      console.log();
      console.log(chalk.gray("Next command:"));
      console.log(
        chalk.cyan(
          "npx binhlaig-ui@latest add button",
        ),
      );
    } catch (error) {
      console.error(
        chalk.red(
          `\nFailed to initialize Binhlaig UI: ${
            error instanceof Error
              ? error.message
              : String(error)
          }`,
        ),
      );

      process.exitCode = 1;
    }
  });

/**
 * Add component
 *
 * Examples:
 *   binhlaig-ui add button
 *   binhlaig-ui add card
 *   binhlaig-ui add button --overwrite
 */
program
  .command("add")
  .description("Add a Binhlaig UI component")
  .argument("<component>", "Component name")
  .option("-o, --overwrite", "Overwrite existing files")
  .action(async (component, options) => {
    const normalizedComponent = component
      .trim()
      .toLowerCase();

    if (!availableComponents.includes(normalizedComponent)) {
      console.error(
        chalk.red(
          `\nUnknown component: ${normalizedComponent}`,
        ),
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
      const componentUrl = getComponentUrl(
        normalizedComponent,
      );

      const args = [
        "add",
        componentUrl,
        "--yes",
      ];

      if (options.overwrite) {
        args.push("--overwrite");
      }

      console.log();
      console.log(
        chalk.cyan(
          `Installing ${normalizedComponent} from ${componentUrl}`,
        ),
      );
      console.log();

      await runShadcn(args);

      console.log();
      console.log(
        chalk.green(
          `${normalizedComponent} installed successfully`,
        ),
      );

      const importExample =
        componentImports[normalizedComponent];

      if (importExample) {
        console.log();
        console.log(chalk.green("Use it with:"));
        console.log(chalk.cyan(importExample));
      }
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

/**
 * List components
 */
program
  .command("list")
  .description("List available components")
  .action(() => {
    console.log(
      chalk.bold(
        "\nAvailable Binhlaig UI components:\n",
      ),
    );

    for (const component of availableComponents) {
      console.log(`  - ${component}`);
    }

    console.log();
  });

await program.parseAsync(process.argv);