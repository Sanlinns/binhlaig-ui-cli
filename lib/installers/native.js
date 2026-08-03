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

export async function initializeWithNative({
  cwd,
}) {
  const project = await detectProject(cwd);

  const configPath = path.join(
    cwd,
    "binhlaig.json"
  );

  if (await pathExists(configPath)) {
    console.log(
      chalk.yellow(
        "binhlaig.json already exists."
      )
    );

    return {
      created: false,
      configPath,
      framework: project.framework,
    };
  }

  const config = {
    $schema:
      "https://ui.binhlaig.com/schema.json",
    installer: "native",
    framework: project.framework,
    srcDir: project.hasSrc,
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

  console.log(
    chalk.gray(
      `Framework: ${project.framework}`
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
    created: true,
    configPath,
    framework: project.framework,
  };
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
