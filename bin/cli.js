#!/usr/bin/env node

import process from "node:process";
import { readFile } from "node:fs/promises";
import { Command } from "commander";
import chalk from "chalk";

import {
  initializeWithShadcn,
  installWithShadcn,
} from "../lib/installers/shadcn.js";

import {
  installWithNative,
} from "../lib/installers/native.js";

const program = new Command();

const packageJson = JSON.parse(
  await readFile(
    new URL("../package.json", import.meta.url),
    "utf8"
  )
);

const availableComponents = [
  "button",
  "card",
  "badge",
  "input",
  "tabs",
  "alert-dialog",
];

const componentImports = {
  button:
    'import { Button } from "@/components/ui/button";',

  card: `import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";`,

  badge:
    'import { Badge } from "@/components/ui/badge";',

  input:
    'import { Input } from "@/components/ui/input";',

  tabs: `import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";`,
};

program
  .name("binhlaig-ui")
  .description(
    "Initialize and install Binhlaig UI components"
  )
  .version(packageJson.version);

program
  .command("init")
  .description(
    "Initialize Binhlaig UI in the current project"
  )
  .option(
    "-b, --base <base>",
    "Component base: base, radix, or aria"
  )
  .option(
    "-i, --installer <installer>",
    "Installer: shadcn or native",
    "shadcn"
  )
  .option(
    "-y, --yes",
    "Skip confirmation prompts"
  )
  .action(async (options) => {
    const installer =
      normalizeInstaller(options.installer);

    if (!installer) {
      printInstallerError(options.installer);
      return;
    }

    const supportedBases = [
      "base",
      "radix",
      "aria",
    ];

    if (
      options.base &&
      !supportedBases.includes(
        options.base.toLowerCase()
      )
    ) {
      console.error(
        chalk.red(
          `\nUnsupported base: ${options.base}`
        )
      );

      console.log(
        chalk.gray(
          `Supported bases: ${supportedBases.join(
            ", "
          )}`
        )
      );

      process.exitCode = 1;
      return;
    }

    // Native init is not implemented yet.
    if (installer === "native") {
      console.log();
      console.log(
        chalk.yellow(
          "Binhlaig Native init is not available yet."
        )
      );
      console.log(
        chalk.gray(
          "Use Shadcn init, then install components with Native Beta."
        )
      );
      console.log();
      console.log(
        chalk.cyan(
          "npx binhlaig-ui@latest init --installer shadcn"
        )
      );

      process.exitCode = 1;
      return;
    }

    console.log();
    console.log(
      chalk.cyan(
        "Initializing Binhlaig UI with Shadcn CLI..."
      )
    );
    console.log();

    try {
      await initializeWithShadcn({
        cwd: process.cwd(),
        base: options.base?.toLowerCase(),
        yes: options.yes,
      });

      console.log();
      console.log(
        chalk.green(
          "Binhlaig UI initialized successfully."
        )
      );

      console.log();
      console.log(chalk.gray("Next command:"));
      console.log(
        chalk.cyan(
          "npx binhlaig-ui@latest add button"
        )
      );
    } catch (error) {
      printFailure(
        "Failed to initialize Binhlaig UI",
        error
      );
    }
  });

program
  .command("add")
  .description(
    "Add one or more Binhlaig UI components"
  )
  .argument(
    "<components...>",
    "Component names"
  )
  .option(
    "-i, --installer <installer>",
    "Installer: shadcn or native",
    "shadcn"
  )
  .option(
    "-o, --overwrite",
    "Overwrite existing files",
    false
  )
  .action(async (components, options) => {
    const installer =
      normalizeInstaller(options.installer);

    if (!installer) {
      printInstallerError(options.installer);
      return;
    }

    const normalizedComponents = [
      ...new Set(
        components.map((component) =>
          component.trim().toLowerCase()
        )
      ),
    ];

    const unknownComponents =
      normalizedComponents.filter(
        (component) =>
          !availableComponents.includes(component)
      );

    if (unknownComponents.length > 0) {
      console.error(
        chalk.red(
          `\nUnknown component(s): ${unknownComponents.join(
            ", "
          )}`
        )
      );

      console.log(
        chalk.gray(
          `Available components: ${availableComponents.join(
            ", "
          )}`
        )
      );

      process.exitCode = 1;
      return;
    }

    console.log();
    console.log(
      installer === "native"
        ? chalk.yellow(
            "Installer: Binhlaig Native Beta"
          )
        : chalk.green(
            "Installer: Shadcn CLI Stable"
          )
    );

    try {
      if (installer === "native") {
        await installWithNative({
          cwd: process.cwd(),
          components: normalizedComponents,
          overwrite: options.overwrite,
        });
      } else {
        for (const component of
          normalizedComponents) {
          console.log();
          console.log(
            chalk.cyan(
              `Installing ${component}...`
            )
          );

          await installWithShadcn({
            cwd: process.cwd(),
            component,
            overwrite: options.overwrite,
          });
        }
      }

      console.log();
      console.log(
        chalk.green(
          `${normalizedComponents.join(
            ", "
          )} installed successfully.`
        )
      );

      printImportExamples(
        normalizedComponents
      );
    } catch (error) {
      printFailure(
        `Failed to install ${normalizedComponents.join(
          ", "
        )}`,
        error
      );
    }
  });

program
  .command("list")
  .description("List available components")
  .action(() => {
    console.log(
      chalk.bold(
        "\nAvailable Binhlaig UI components:\n"
      )
    );

    for (const component of
      availableComponents) {
      console.log(`  - ${component}`);
    }

    console.log();
    console.log(
      chalk.gray(
        "Stable: --installer shadcn"
      )
    );
    console.log(
      chalk.gray(
        "Beta:   --installer native"
      )
    );
    console.log();
  });

function normalizeInstaller(installer) {
  const normalized = String(installer)
    .trim()
    .toLowerCase();

  if (
    normalized !== "native" &&
    normalized !== "shadcn"
  ) {
    return null;
  }

  return normalized;
}

function printInstallerError(installer) {
  console.error(
    chalk.red(
      `\nUnsupported installer: ${installer}`
    )
  );

  console.log(
    chalk.gray(
      "Supported installers: shadcn, native"
    )
  );

  process.exitCode = 1;
}

function printFailure(title, error) {
  const message =
    error instanceof Error
      ? error.message
      : String(error);

  console.error(
    chalk.red(`\n${title}:\n${message}`)
  );

  process.exitCode = 1;
}

function printImportExamples(components) {
  for (const component of components) {
    const importExample =
      componentImports[component];

    if (!importExample) {
      continue;
    }

    console.log();
    console.log(
      chalk.green(
        `Use ${component} with:`
      )
    );
    console.log(
      chalk.cyan(importExample)
    );
  }
}

await program.parseAsync(process.argv);