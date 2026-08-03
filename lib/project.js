import path from "node:path";
import {
  access,
  readFile,
} from "node:fs/promises";

export async function pathExists(targetPath) {
  try {
    await access(targetPath);
    return true;
  } catch {
    return false;
  }
}

export async function detectProject(cwd) {
  const packageJsonPath = path.join(
    cwd,
    "package.json"
  );

  if (!(await pathExists(packageJsonPath))) {
    throw new Error(
      "package.json was not found. Run this command from your project root."
    );
  }

  let packageJson;

  try {
    packageJson = JSON.parse(
      await readFile(packageJsonPath, "utf8")
    );
  } catch {
    throw new Error("Unable to read package.json.");
  }

  const packages = {
    ...(packageJson.dependencies || {}),
    ...(packageJson.devDependencies || {}),
  };

  let framework = "unknown";

  if (packages.next) {
    framework = "next";
  } else if (packages.vite) {
    framework = "vite";
  } else if (packages.react) {
    framework = "react";
  }

  if (framework === "unknown") {
    throw new Error(
      "Binhlaig UI currently supports Next.js, Vite React, and React projects."
    );
  }

  const hasSrc = await pathExists(
    path.join(cwd, "src")
  );

  return {
    framework,
    hasSrc,
    packageJson,
  };
}

export function resolveRegistryPath({
  cwd,
  registryPath,
  registryType,
  target,
  hasSrc,
}) {
  const fileName = path.posix.basename(
    String(registryPath).replaceAll("\\", "/")
  );

  /*
   * Registry target aliases:
   *
   * @ui/button.tsx
   * @/components/ui/button.tsx
   * @components/button.tsx
   */
  if (
    typeof target === "string" &&
    target.trim()
  ) {
    const resolvedTarget =
      normalizeRegistryTarget(target);

    if (resolvedTarget) {
      return resolveSafeProjectPath({
        cwd,
        filePath: resolvedTarget,
        hasSrc,
      });
    }
  }

  const typeDestinations = {
    "registry:ui": `components/ui/${fileName}`,
    "registry:component":
      `components/${fileName}`,
    "registry:lib": `lib/${fileName}`,
    "registry:hook": `hooks/${fileName}`,
    "registry:page": `app/${fileName}`,
  };

  const mappedPath =
    typeDestinations[registryType];

  if (mappedPath) {
    return resolveSafeProjectPath({
      cwd,
      filePath: mappedPath,
      hasSrc,
    });
  }

  const normalizedRegistryPath =
    String(registryPath)
      .replaceAll("\\", "/")
      .replace(/^\.?\//, "");

  if (
    normalizedRegistryPath.startsWith(
      "registry/"
    )
  ) {
    return resolveSafeProjectPath({
      cwd,
      filePath: `components/ui/${fileName}`,
      hasSrc,
    });
  }

  return resolveSafeProjectPath({
    cwd,
    filePath: normalizedRegistryPath,
    hasSrc,
  });
}

function normalizeRegistryTarget(target) {
  let normalized = target
    .trim()
    .replaceAll("\\", "/");

  /*
   * @ui/button.tsx
   * → components/ui/button.tsx
   */
  if (
    normalized === "@ui" ||
    normalized.startsWith("@ui/")
  ) {
    normalized = normalized.replace(
      /^@ui\/?/,
      "components/ui/"
    );

    return normalized;
  }

  /*
   * @components/button.tsx
   * → components/button.tsx
   */
  if (
    normalized === "@components" ||
    normalized.startsWith("@components/")
  ) {
    normalized = normalized.replace(
      /^@components\/?/,
      "components/"
    );

    return normalized;
  }

  /*
   * @lib/utils.ts
   * → lib/utils.ts
   */
  if (
    normalized === "@lib" ||
    normalized.startsWith("@lib/")
  ) {
    normalized = normalized.replace(
      /^@lib\/?/,
      "lib/"
    );

    return normalized;
  }

  /*
   * @hooks/use-example.ts
   * → hooks/use-example.ts
   */
  if (
    normalized === "@hooks" ||
    normalized.startsWith("@hooks/")
  ) {
    normalized = normalized.replace(
      /^@hooks\/?/,
      "hooks/"
    );

    return normalized;
  }

  /*
   * "@/components/ui/button.tsx"
   * → components/ui/button.tsx
   */
  if (normalized.startsWith("@/")) {
    normalized = normalized.slice(2);
    return normalized;
  }

  /*
   * Plain valid paths:
   * components/ui/button.tsx
   */
  if (!normalized.startsWith("@")) {
    return normalized;
  }

  /*
   * Unknown aliases should not create
   * folders such as @ui or @unknown.
   */
  return null;
}

function resolveSafeProjectPath({
  cwd,
  filePath,
  hasSrc,
}) {
  const normalizedPath = filePath
    .replaceAll("\\", "/")
    .replace(/^\.?\//, "");

  if (path.isAbsolute(normalizedPath)) {
    throw new Error(
      `Unsafe registry file path: ${filePath}`
    );
  }

  if (normalizedPath.startsWith("@")) {
    throw new Error(
      `Unresolved registry alias: ${filePath}`
    );
  }

  let relativeDestination;

  if (
    normalizedPath === "src" ||
    normalizedPath.startsWith("src/")
  ) {
    relativeDestination = normalizedPath;
  } else if (hasSrc) {
    relativeDestination = path.join(
      "src",
      normalizedPath
    );
  } else {
    relativeDestination = normalizedPath;
  }

  const projectRoot = path.resolve(cwd);
  const destination = path.resolve(
    projectRoot,
    relativeDestination
  );
  const relativeToRoot = path.relative(
    projectRoot,
    destination
  );

  if (
    relativeToRoot === ".." ||
    relativeToRoot.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relativeToRoot)
  ) {
    throw new Error(
      `Unsafe registry file path: ${filePath}`
    );
  }

  return destination;
}
