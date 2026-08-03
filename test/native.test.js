import assert from "node:assert/strict";
import { chmod, mkdtemp, mkdir, readFile, stat, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  initializeWithNative,
  installWithNative,
} from "../lib/installers/native.js";
import {
  initializeWithShadcn,
  installWithShadcn,
} from "../lib/installers/shadcn.js";
import { resolveRegistryPath } from "../lib/project.js";

async function createProject({ src = false } = {}) {
  const cwd = await mkdtemp(path.join(os.tmpdir(), "binhlaig-test-"));
  await writeFile(
    path.join(cwd, "package.json"),
    JSON.stringify({ dependencies: { next: "15.0.0" } }),
    "utf8"
  );
  if (src) await mkdir(path.join(cwd, "src"));
  return cwd;
}

function registryResponse(item) {
  return {
    ok: true,
    status: 200,
    statusText: "OK",
    async json() {
      return item;
    },
  };
}

async function withRegistry(items, callback) {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url) => {
    const name = path.basename(new URL(url).pathname, ".json");
    const item = items[name];
    if (!item) {
      return { ok: false, status: 404, statusText: "Not Found" };
    }
    return registryResponse({ name, ...item });
  };
  try {
    return await callback();
  } finally {
    globalThis.fetch = originalFetch;
  }
}

async function withFakeExecutable({ command = "npm", fail = false } = {}, callback) {
  const binDir = await mkdtemp(path.join(os.tmpdir(), "binhlaig-bin-"));
  const logPath = path.join(binDir, "calls.log");
  const originalPath = process.env.PATH;
  const originalLog = process.env.BINHLAIG_TEST_LOG;

  if (process.platform === "win32") {
    await writeFile(
      path.join(binDir, `${command}.cmd`),
      `@echo %*>>"%BINHLAIG_TEST_LOG%"\r\n@exit /b ${fail ? 1 : 0}\r\n`,
      "utf8"
    );
  } else {
    const executable = path.join(binDir, command);
    await writeFile(
      executable,
      `#!/bin/sh\necho "$*" >> "$BINHLAIG_TEST_LOG"\nexit ${fail ? 1 : 0}\n`,
      "utf8"
    );
    await chmod(executable, 0o755);
  }

  process.env.PATH = `${binDir}${path.delimiter}${originalPath}`;
  process.env.BINHLAIG_TEST_LOG = logPath;
  try {
    return await callback(logPath);
  } finally {
    process.env.PATH = originalPath;
    if (originalLog === undefined) delete process.env.BINHLAIG_TEST_LOG;
    else process.env.BINHLAIG_TEST_LOG = originalLog;
  }
}

for (const hasSrc of [false, true]) {
  test(`native initialization prepares Next.js with src=${hasSrc}`, async () => {
    const cwd = await createProject({ src: hasSrc });
    const sourceRoot = hasSrc ? path.join(cwd, "src") : cwd;
    const cssPath = path.join(sourceRoot, "app", "globals.css");
    await mkdir(path.dirname(cssPath), { recursive: true });
    await writeFile(cssPath, ".existing { color: red; }\n", "utf8");

    await withFakeExecutable({}, async (logPath) => {
      const first = await initializeWithNative({ cwd });
      assert.equal(first.created, true);
      assert.equal(first.framework, "next");
      assert.equal(first.packageManager, "npm");
      assert.equal(first.hasSrc, hasSrc);

      const configPath = path.join(cwd, "binhlaig.json");
      const originalConfig = await readFile(configPath, "utf8");
      const config = JSON.parse(originalConfig);
      assert.equal(config.installer, "native");
      assert.equal(config.framework, "next");
      assert.equal(config.srcDir, hasSrc);
      assert.equal(config.aliases.utils, "@/lib/utils");

      const utilsPath = path.join(sourceRoot, "lib", "utils.ts");
      const utils = await readFile(utilsPath, "utf8");
      assert.match(utils, /import \{ clsx, type ClassValue \} from "clsx"/);
      assert.match(utils, /return twMerge\(clsx\(inputs\)\)/);
      assert.equal(
        (await stat(path.join(sourceRoot, "components", "ui"))).isDirectory(),
        true
      );

      const css = await readFile(cssPath, "utf8");
      assert.match(css, /^@import "tailwindcss";/);
      assert.match(css, /\.existing \{ color: red; \}/);
      assert.match(css, /\/\* binhlaig-ui-theme \*\//);
      assert.match(css, /:root \{/);
      assert.match(css, /\.dark \{/);
      assert.match(css, /@theme inline/);
      assert.match(css, /@apply border-border outline-ring\/50/);
      assert.match(css, /@apply bg-background text-foreground/);

      const calls = await readFile(logPath, "utf8");
      for (const dependency of [
        "@base-ui/react",
        "class-variance-authority",
        "clsx",
        "lucide-react",
        "tailwind-merge",
        "tw-animate-css",
      ]) {
        assert.match(calls, new RegExp(dependency));
      }

      await writeFile(utilsPath, "// keep existing utils\n", "utf8");
      const second = await initializeWithNative({ cwd });
      assert.equal(second.created, false);
      assert.equal(await readFile(configPath, "utf8"), originalConfig);
      assert.equal(await readFile(utilsPath, "utf8"), "// keep existing utils\n");
      const repeatedCss = await readFile(cssPath, "utf8");
      assert.equal(repeatedCss.split("/* binhlaig-ui-theme */").length - 1, 1);
      assert.equal(repeatedCss.split('@import "tailwindcss";').length - 1, 1);
    });
  });
}

test("native initialization preserves a pre-existing config", async () => {
  const cwd = await createProject();
  const configPath = path.join(cwd, "binhlaig.json");
  const customConfig = '{"custom":true}\n';
  await writeFile(configPath, customConfig, "utf8");
  await withFakeExecutable({}, () => initializeWithNative({ cwd }));
  assert.equal(await readFile(configPath, "utf8"), customConfig);
});

for (const fallback of [
  "styles/globals.css",
  "src/styles/globals.css",
  "index.css",
  "src/index.css",
]) {
  test(`native initialization uses existing CSS fallback ${fallback}`, async () => {
    const cwd = await createProject();
    const cssPath = path.join(cwd, fallback);
    await mkdir(path.dirname(cssPath), { recursive: true });
    await writeFile(cssPath, "/* existing fallback */\n", "utf8");
    await withFakeExecutable({}, async () => {
      const result = await initializeWithNative({ cwd });
      assert.equal(result.cssPath, cssPath);
    });
    const css = await readFile(cssPath, "utf8");
    assert.match(css, /\/\* existing fallback \*\//);
    assert.match(css, /\/\* binhlaig-ui-theme \*\//);
  });
}

test("registry paths support projects with and without src and reject traversal", () => {
  const cwd = path.resolve(os.tmpdir(), "binhlaig-path-test");
  assert.equal(
    resolveRegistryPath({ cwd, registryPath: "registry/button.tsx", registryType: "registry:ui", hasSrc: false }),
    path.join(cwd, "components", "ui", "button.tsx")
  );
  assert.equal(
    resolveRegistryPath({ cwd, registryPath: "registry/utils.ts", target: "@/lib/utils.ts", hasSrc: true }),
    path.join(cwd, "src", "lib", "utils.ts")
  );
  assert.equal(
    resolveRegistryPath({ cwd, registryPath: "registry/button.tsx", registryType: "registry:ui", hasSrc: true }),
    path.join(cwd, "src", "components", "ui", "button.tsx")
  );
  assert.throws(
    () => resolveRegistryPath({ cwd, registryPath: "components/../../../escape.ts", hasSrc: false }),
    /Unsafe registry file path/
  );
});

test("native button installation succeeds after initialization", async () => {
  const cwd = await createProject({ src: true });
  const items = {
    button: {
      files: [{
        path: "registry/button.tsx",
        type: "registry:ui",
        content: 'import { cn } from "@/lib/utils";\nexport const buttonClass = cn("button");\n',
      }],
    },
  };

  await withFakeExecutable({}, async () => {
    await initializeWithNative({ cwd });
    await withRegistry(items, () => installWithNative({ cwd, components: ["button"] }));
  });
  const button = await readFile(path.join(cwd, "src", "components", "ui", "button.tsx"), "utf8");
  assert.match(button, /from "@\/lib\/utils"/);
  assert.match(await readFile(path.join(cwd, "src", "lib", "utils.ts"), "utf8"), /export function cn/);
});

test("native install resolves registry dependencies, files, and package dependencies", async () => {
  const cwd = await createProject({ src: true });
  const items = {
    button: {
      registryDependencies: ["utils"],
      dependencies: ["runtime-example@1.0.0"],
      devDependencies: ["dev-example@1.0.0"],
      files: [{ path: "registry/button.tsx", type: "registry:ui", content: "button" }],
    },
    utils: {
      files: [{ path: "registry/utils.ts", type: "registry:lib", content: "utils" }],
    },
  };

  await withFakeExecutable({}, async (logPath) => {
    await withRegistry(items, () => installWithNative({ cwd, components: ["button"] }));
    assert.equal(await readFile(path.join(cwd, "src/components/ui/button.tsx"), "utf8"), "button");
    assert.equal(await readFile(path.join(cwd, "src/lib/utils.ts"), "utf8"), "utils");
    const calls = await readFile(logPath, "utf8");
    assert.match(calls, /install.+runtime-example@1\.0\.0/);
    assert.match(calls, /install.+--save-dev.+dev-example@1\.0\.0/);
  });
});

test("native install skips existing files unless overwrite is enabled", async () => {
  const cwd = await createProject();
  const destination = path.join(cwd, "components/ui/button.tsx");
  await mkdir(path.dirname(destination), { recursive: true });
  await writeFile(destination, "existing", "utf8");
  const items = {
    button: { files: [{ path: "registry/button.tsx", type: "registry:ui", content: "new" }] },
  };

  await withRegistry(items, () => installWithNative({ cwd, components: ["button"] }));
  assert.equal(await readFile(destination, "utf8"), "existing");
  await withRegistry(items, () => installWithNative({ cwd, components: ["button"], overwrite: true }));
  assert.equal(await readFile(destination, "utf8"), "new");
});

test("native install rolls back new files when dependency installation fails", async () => {
  const cwd = await createProject();
  const destination = path.join(cwd, "components/ui/button.tsx");
  const items = {
    button: {
      dependencies: ["will-fail@1.0.0"],
      files: [{ path: "registry/button.tsx", type: "registry:ui", content: "button" }],
    },
  };

  await withFakeExecutable({ fail: true }, async () => {
    await assert.rejects(
      withRegistry(items, () => installWithNative({ cwd, components: ["button"] }))
    );
  });
  await assert.rejects(readFile(destination, "utf8"), { code: "ENOENT" });
});

test("native install detects circular registry dependencies", async () => {
  const cwd = await createProject();
  const items = {
    first: { registryDependencies: ["second"], files: [] },
    second: { registryDependencies: ["first"], files: [] },
  };
  await assert.rejects(
    withRegistry(items, () => installWithNative({ cwd, components: ["first"] })),
    /Circular registry dependency detected/
  );
});

test("shadcn initialization and installation invoke npx with expected arguments", async () => {
  const cwd = await createProject();
  const originalRegistry = process.env.BINHLAIG_REGISTRY_URL;
  process.env.BINHLAIG_REGISTRY_URL = "https://registry.example.test/r";
  try {
    await withFakeExecutable({ command: "npx" }, async (logPath) => {
      await initializeWithShadcn({ cwd, base: "radix", yes: true });
      await installWithShadcn({ cwd, component: "button", overwrite: true });
      const calls = await readFile(logPath, "utf8");
      assert.match(calls, /shadcn@latest.+init.+--base.+radix.+--yes/);
      assert.match(calls, /shadcn@latest.+add.+https:\/\/registry\.example\.test\/r\/button\.json.+--yes.+--overwrite/);
    });
  } finally {
    if (originalRegistry === undefined) delete process.env.BINHLAIG_REGISTRY_URL;
    else process.env.BINHLAIG_REGISTRY_URL = originalRegistry;
  }
});
