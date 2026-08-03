import path from "node:path";
import {
  mkdir,
  readFile,
  unlink,
  writeFile,
} from "node:fs/promises";
import chalk from "chalk";

import {
  fetchRegistryItem,
} from "../registry.js";

import {
  detectProject,
  pathExists,
  resolveRegistryPath,
} from "../project.js";

import {
  detectPackageManager,
  installPackages,
} from "../packages.js";

const NATIVE_DEPENDENCIES = [
  "@base-ui/react",
  "class-variance-authority",
  "clsx",
  "lucide-react",
  "tailwind-merge",
  "tw-animate-css",
];

const UTILS_CONTENT = `import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
`;

const THEME_MARKER = "/* binhlaig-ui-theme */";

const NATIVE_THEME = `${THEME_MARKER}

:root {
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.145 0 0);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.145 0 0);
  --primary: oklch(0.205 0 0);
  --primary-foreground: oklch(0.985 0 0);
  --secondary: oklch(0.97 0 0);
  --secondary-foreground: oklch(0.205 0 0);
  --muted: oklch(0.97 0 0);
  --muted-foreground: oklch(0.556 0 0);
  --accent: oklch(0.97 0 0);
  --accent-foreground: oklch(0.205 0 0);
  --destructive: oklch(0.577 0.245 27.325);
  --border: oklch(0.922 0 0);
  --input: oklch(0.922 0 0);
  --ring: oklch(0.708 0 0);
  --radius: 0.625rem;
}

.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  --card: oklch(0.205 0 0);
  --card-foreground: oklch(0.985 0 0);
  --popover: oklch(0.205 0 0);
  --popover-foreground: oklch(0.985 0 0);
  --primary: oklch(0.922 0 0);
  --primary-foreground: oklch(0.205 0 0);
  --secondary: oklch(0.269 0 0);
  --secondary-foreground: oklch(0.985 0 0);
  --muted: oklch(0.269 0 0);
  --muted-foreground: oklch(0.708 0 0);
  --accent: oklch(0.269 0 0);
  --accent-foreground: oklch(0.985 0 0);
  --destructive: oklch(0.704 0.191 22.216);
  --border: oklch(1 0 0 / 10%);
  --input: oklch(1 0 0 / 15%);
  --ring: oklch(0.556 0 0);
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
}

@layer base {
  * {
    @apply border-border outline-ring/50;
  }

  body {
    @apply bg-background text-foreground;
  }
}
`;

export async function ensureBinhlaigFoundation({
  cwd,
}) {
  const project = await detectProject(cwd);
  const packageManager =
    await detectPackageManager(cwd);

  const sourceRoot = project.hasSrc
    ? path.join(cwd, "src")
    : cwd;
  const uiDirectory = path.join(
    sourceRoot,
    "components",
    "ui"
  );
  const utilsPath = path.join(
    sourceRoot,
    "lib",
    "utils.ts"
  );

  await mkdir(uiDirectory, { recursive: true });
  console.log(
    chalk.green(
      `Ready ${path.relative(cwd, uiDirectory)}`
    )
  );

  if (await pathExists(utilsPath)) {
    console.log(
      chalk.yellow(
        `${path.relative(cwd, utilsPath)} already exists.`
      )
    );
  } else {
    await mkdir(path.dirname(utilsPath), {
      recursive: true,
    });
    await writeFile(utilsPath, UTILS_CONTENT, "utf8");
    console.log(
      chalk.green(
        `Created ${path.relative(cwd, utilsPath)}`
      )
    );
  }

  const cssPath = await findOrCreateGlobalCss({
    cwd,
    framework: project.framework,
    hasSrc: project.hasSrc,
  });
  const themeAdded = await ensureNativeTheme(cssPath);

  console.log(
    themeAdded
      ? chalk.green(
          `Added Binhlaig theme to ${path.relative(cwd, cssPath)}`
        )
      : chalk.yellow(
          `Binhlaig theme already exists in ${path.relative(cwd, cssPath)}.`
        )
  );

  const declaredPackages = {
    ...(project.packageJson.dependencies || {}),
    ...(project.packageJson.devDependencies || {}),
  };
  const missingDependencies =
    NATIVE_DEPENDENCIES.filter(
      (dependency) => !declaredPackages[dependency]
    );

  if (missingDependencies.length > 0) {
    console.log();
    console.log(
      chalk.cyan(
        "Installing Native runtime dependencies..."
      )
    );
    await installPackages({
      cwd,
      packageManager,
      packages: missingDependencies,
    });
  }

  console.log(
    chalk.gray(
      `Framework: ${project.framework}`
    )
  );

  console.log(
    chalk.gray(
      `Package manager: ${packageManager}`
    )
  );

  console.log(
    chalk.gray(
      `Source directory: ${
        project.hasSrc ? "src" : "disabled"
      }`
    )
  );

  return {
    framework: project.framework,
    packageManager,
    hasSrc: project.hasSrc,
    uiDirectory,
    utilsPath,
    cssPath,
    themeAdded,
    installedDependencies: missingDependencies,
  };
}

export async function initializeWithNative({
  cwd,
}) {
  const foundation =
    await ensureBinhlaigFoundation({ cwd });
  const configPath = path.join(
    cwd,
    "binhlaig.json"
  );
  const configExists = await pathExists(configPath);

  if (configExists) {
    console.log(
      chalk.yellow(
        "binhlaig.json already exists."
      )
    );
  } else {
    const config = {
      $schema:
        "https://ui.binhlaig.com/schema.json",
      installer: "native",
      framework: foundation.framework,
      srcDir: foundation.hasSrc,
      aliases: {
        components: "@/components",
        ui: "@/components/ui",
        lib: "@/lib",
        utils: "@/lib/utils",
        hooks: "@/hooks",
      },
      registry:
        "https://ui.binhlaig.com/r",
    };

    await writeFile(
      configPath,
      `${JSON.stringify(config, null, 2)}\n`,
      "utf8"
    );
    console.log(
      chalk.green("Created binhlaig.json")
    );
  }

  return {
    ...foundation,
    created: !configExists,
    configPath,
  };
}

async function findOrCreateGlobalCss({
  cwd,
  framework,
  hasSrc,
}) {
  const candidates = framework === "next"
    ? hasSrc
      ? [
          "src/app/globals.css",
          "app/globals.css",
          "src/styles/globals.css",
          "styles/globals.css",
          "src/index.css",
          "index.css",
        ]
      : [
          "app/globals.css",
          "src/app/globals.css",
          "styles/globals.css",
          "src/styles/globals.css",
          "index.css",
          "src/index.css",
        ]
    : hasSrc
      ? [
          "src/index.css",
          "src/styles/globals.css",
          "index.css",
          "styles/globals.css",
        ]
      : [
          "index.css",
          "styles/globals.css",
          "src/index.css",
          "src/styles/globals.css",
        ];

  for (const candidate of candidates) {
    const candidatePath = path.join(cwd, candidate);
    if (await pathExists(candidatePath)) {
      return candidatePath;
    }
  }

  const relativePath = framework === "next"
    ? hasSrc
      ? "src/app/globals.css"
      : "app/globals.css"
    : hasSrc
      ? "src/index.css"
      : "index.css";
  const cssPath = path.join(cwd, relativePath);

  await mkdir(path.dirname(cssPath), {
    recursive: true,
  });
  await writeFile(cssPath, "", "utf8");
  return cssPath;
}

async function ensureNativeTheme(cssPath) {
  const existingCss = await readFile(cssPath, "utf8");
  const hasTheme = existingCss.includes(THEME_MARKER);
  const hasTailwindImport =
    /@import\s+["']tailwindcss["']\s*;/.test(
      existingCss
    );

  if (hasTheme && hasTailwindImport) {
    return false;
  }

  const importStatement = hasTailwindImport
    ? ""
    : `@import "tailwindcss";\n\n`;
  const preservedCss = existingCss.trimEnd();
  const theme = hasTheme ? "" : NATIVE_THEME;
  const separator = preservedCss && theme
    ? "\n\n"
    : "";

  await writeFile(
    cssPath,
    `${importStatement}${preservedCss}${separator}${theme}`,
    "utf8"
  );
  return !hasTheme;
}

export async function installWithNative({
  cwd,
  components,
  overwrite = false,
}) {
  const project = await detectProject(cwd);
  const packageManager =
    await detectPackageManager(cwd);

  console.log(
    chalk.gray(`Framework: ${project.framework}`)
  );
  console.log(
    chalk.gray(
      `Package manager: ${packageManager}`
    )
  );

  const completedItems = new Set();
  const activeItems = new Set();

  const runtimeDependencies = new Set();
  const developmentDependencies = new Set();

  const createdFiles = [];
  const replacedFiles = [];
  const skippedFiles = [];

  try {
    for (const component of components) {
      await installRegistryItem(component);
    }

    if (runtimeDependencies.size > 0) {
      console.log();
      console.log(
        chalk.cyan(
          "Installing component dependencies..."
        )
      );

      await installPackages({
        cwd,
        packageManager,
        packages: [...runtimeDependencies],
      });
    }

    if (developmentDependencies.size > 0) {
      console.log();
      console.log(
        chalk.cyan(
          "Installing development dependencies..."
        )
      );

      await installPackages({
        cwd,
        packageManager,
        packages: [
          ...developmentDependencies,
        ],
        dev: true,
      });
    }

    return {
      framework: project.framework,
      packageManager,
      installedItems: [...completedItems],
      createdFiles,
      replacedFiles,
      skippedFiles,
    };
  } catch (error) {
    // Only newly created files are rolled back.
    // Existing overwritten files are not deleted.
    await rollbackCreatedFiles(createdFiles);

    throw error;
  }

  async function installRegistryItem(name) {
    const normalizedName = name
      .trim()
      .toLowerCase();

    if (completedItems.has(normalizedName)) {
      return;
    }

    if (activeItems.has(normalizedName)) {
      throw new Error(
        `Circular registry dependency detected: ${normalizedName}`
      );
    }

    activeItems.add(normalizedName);

    console.log();
    console.log(
      chalk.cyan(
        `Fetching ${normalizedName}...`
      )
    );

    const item =
      await fetchRegistryItem(normalizedName);

    const registryDependencies =
      normalizeRegistryDependencies(
        item.registryDependencies
      );

    for (const dependency of registryDependencies) {
      await installRegistryItem(dependency);
    }

    for (const dependency of
      item.dependencies || []) {
      runtimeDependencies.add(dependency);
    }

    for (const dependency of
      item.devDependencies || []) {
      developmentDependencies.add(dependency);
    }

    await writeRegistryFiles(item);

    activeItems.delete(normalizedName);
    completedItems.add(normalizedName);
  }

  async function writeRegistryFiles(item) {
    for (const file of item.files) {
      const destination =
        resolveRegistryPath({
          cwd,
          registryPath: file.path,
          registryType: file.type,
          target: file.target,
          framework: project.framework,
          hasSrc: project.hasSrc,
        });

      const relativePath = path.relative(
        cwd,
        destination
      );

      const exists =
        await pathExists(destination);

      if (exists && !overwrite) {
        skippedFiles.push(relativePath);

        console.log(
          chalk.yellow(
            `Skipped ${relativePath} (already exists)`
          )
        );

        continue;
      }

      let previousContent = null;

      if (exists) {
        previousContent = await readFile(
          destination,
          "utf8"
        );
      }

      await mkdir(path.dirname(destination), {
        recursive: true,
      });

      try {
        await writeFile(
          destination,
          file.content,
          "utf8"
        );
      } catch (error) {
        // Restore overwritten file when write fails.
        if (
          exists &&
          previousContent !== null
        ) {
          await writeFile(
            destination,
            previousContent,
            "utf8"
          );
        }

        throw error;
      }

      if (exists) {
        replacedFiles.push(relativePath);

        console.log(
          chalk.green(
            `Updated ${relativePath}`
          )
        );
      } else {
        createdFiles.push(destination);

        console.log(
          chalk.green(
            `Created ${relativePath}`
          )
        );
      }
    }
  }
}

function normalizeRegistryDependencies(
  dependencies
) {
  if (!Array.isArray(dependencies)) {
    return [];
  }

  return dependencies
    .map((dependency) => {
      if (typeof dependency !== "string") {
        return null;
      }

      // Supports:
      // "utils"
      // "https://domain/r/utils.json"
      if (
        dependency.startsWith("http://") ||
        dependency.startsWith("https://")
      ) {
        try {
          const url = new URL(dependency);
          return path.basename(
            url.pathname,
            ".json"
          );
        } catch {
          return null;
        }
      }

      return dependency
        .replace(/\.json$/, "")
        .trim()
        .toLowerCase();
    })
    .filter(Boolean);
}

async function rollbackCreatedFiles(files) {
  if (files.length === 0) {
    return;
  }

  console.log();
  console.log(
    chalk.yellow(
      "Installation failed. Rolling back newly created files..."
    )
  );

  for (const file of [...files].reverse()) {
    try {
      await unlink(file);
    } catch {
      // Ignore rollback errors.
    }
  }
}
