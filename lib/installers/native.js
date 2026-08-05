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
import {
  updateBinhlaigThemeCss,
} from "../theme.js";
import { updateBinhlaigConfig } from "../config.js";

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
  const themeAdded = await ensureBinhlaigTheme(cssPath);

  console.log(
    themeAdded
      ? chalk.green(
          `Updated Binhlaig theme in ${path.relative(cwd, cssPath)}`
        )
      : chalk.yellow(
          `Binhlaig theme is current in ${path.relative(cwd, cssPath)}.`
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
  const defaults = configExists ? {} : {
    framework: foundation.framework,
    srcDir: foundation.hasSrc,
    aliases: {
      components: "@/components",
      ui: "@/components/ui",
      lib: "@/lib",
      utils: "@/lib/utils",
      hooks: "@/hooks",
    },
    registry: "https://ui.binhlaig.com/r",
  };
  await updateBinhlaigConfig(cwd, { ...defaults, installer: "native" });
  console.log(chalk.green(configExists ? "Updated binhlaig.json" : "Created binhlaig.json"));

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

async function ensureBinhlaigTheme(cssPath) {
  const existingCss = await readFile(cssPath, "utf8");
  const result = updateBinhlaigThemeCss(existingCss);

  if (result.changed) {
    await writeFile(cssPath, result.css, "utf8");
  }

  return result.changed;
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
