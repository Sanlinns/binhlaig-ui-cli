#!/usr/bin/env node

import process from "node:process";
import { readFile } from "node:fs/promises";
import { Command } from "commander";
import { select } from "@inquirer/prompts";
import chalk from "chalk";

import {
  initializeWithShadcn,
  installWithShadcn,
} from "../lib/installers/shadcn.js";

import {
  initializeWithNative,
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
  "textarea",
  "tabs",
  "popover",
  "form",
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

  textarea:
    'import { Textarea } from "@/components/ui/textarea";',

  popover: `import {
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";`,

  form: `import {
  Form,
  FormActions,
  FormControl,
  FormDescription,
  FormField,
  FormLabel,
  FormMessage,
  FormSection,
  FormSectionDescription,
  FormSectionHeader,
  FormSectionTitle,
} from "@/components/ui/form";`,

  tabs: `import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";`,

  "alert-dialog": `import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";`,
};

program
  .name("binhlaig-ui")
  .description(
    "Initialize and install Binhlaig UI components"
  )
  .version(packageJson.version);

/**
 * INIT COMMAND
 *
 * Examples:
 *   binhlaig-ui init
 *   binhlaig-ui init --installer native
 *   binhlaig-ui init --installer shadcn
 *   binhlaig-ui init --installer shadcn --base base
 */
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
    "Installer: native or shadcn"
  )
  .option(
    "-y, --yes",
    "Skip confirmation prompts"
  )
  .action(async (options) => {
    try {
      let installer;

      // An explicit installer bypasses the selection prompt.
      if (options.installer) {
        installer = normalizeInstaller(
          options.installer
        );

        if (!installer) {
          printInstallerError(options.installer);
          return;
        }
      } else {
        // Without an option, let the user choose interactively.
        installer = await select({
          message: "Choose an installer",
          choices: [
            {
              name: "Binhlaig Native Beta",
              value: "native",
              description:
                "Binhlaig's own component installer",
            },
            {
              name: "Shadcn CLI Stable",
              value: "shadcn",
              description:
                "Stable compatibility installer",
            },
          ],
          default: "native",
        });
      }

      console.log();

      /*
       * Native initialization
       */
      if (installer === "native") {
        console.log(
          chalk.yellow(
            "Installer: Binhlaig Native Beta"
          )
        );

        console.log();
        console.log(
          chalk.cyan(
            "Initializing Binhlaig UI with Native Installer..."
          )
        );
        console.log();

        await initializeWithNative({
          cwd: process.cwd(),
          yes: options.yes,
        });

        console.log();
        console.log(
          chalk.green(
            "Binhlaig UI Native initialization completed."
          )
        );

        console.log();
        console.log(chalk.gray("Next command:"));
        console.log(
          chalk.cyan(
            "npx binhlaig-ui@latest add button --installer native"
          )
        );

        return;
      }

      /*
       * Shadcn initialization
       */
      const supportedBases = [
        "base",
        "radix",
        "aria",
      ];

      const selectedBase =
        options.base?.trim().toLowerCase();

      if (
        selectedBase &&
        !supportedBases.includes(selectedBase)
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

      console.log(
        chalk.green(
          "Installer: Shadcn CLI Stable"
        )
      );

      console.log();
      console.log(
        chalk.cyan(
          "Initializing Binhlaig UI with Shadcn CLI..."
        )
      );
      console.log();

      await initializeWithShadcn({
        cwd: process.cwd(),
        base: selectedBase,
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
      // Inquirer uses ExitPromptError for Ctrl+C cancellation.
      if (error?.name === "ExitPromptError") {
        console.log();
        console.log(
          chalk.yellow(
            "Binhlaig UI initialization cancelled."
          )
        );

        process.exitCode = 130;
        return;
      }

      printFailure(
        "Failed to initialize Binhlaig UI",
        error
      );
    }
  });

/**
 * ADD COMMAND
 *
 * Examples:
 *   binhlaig-ui add button
 *   binhlaig-ui add button --installer native
 *   binhlaig-ui add button card input
 */
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
    "Installer: native or shadcn",
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
        components
          .map((component) =>
            component.trim().toLowerCase()
          )
          .filter(Boolean)
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

/**
 * LIST COMMAND
 */
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
  if (!installer) {
    return null;
  }

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
      "Supported installers: native, shadcn"
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