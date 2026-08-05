import assert from "node:assert/strict";
import http from "node:http";
import { chmod, mkdtemp, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { execa } from "execa";

const cliPath = path.resolve("bin/cli.js");
const dependencies = Object.fromEntries([
  "next", "@base-ui/react", "class-variance-authority", "clsx",
  "lucide-react", "tailwind-merge", "tw-animate-css",
].map((name) => [name, "1.0.0"]));

async function project() {
  const cwd = await mkdtemp(path.join(os.tmpdir(), "binhlaig-cli-"));
  await writeFile(path.join(cwd, "package.json"), JSON.stringify({ dependencies }), "utf8");
  return cwd;
}

async function run(cwd, args, env = {}) {
  return execa("node", [cliPath, ...args], {
    cwd,
    env: { ...process.env, ...env },
    reject: false,
  });
}

async function fakeNpx() {
  const directory = await mkdtemp(path.join(os.tmpdir(), "binhlaig-npx-"));
  const log = path.join(directory, "npx.log");
  if (process.platform === "win32") {
    await writeFile(path.join(directory, "npx.cmd"), `@echo %*>>"${log}"\r\n@exit /b 0\r\n`);
  } else {
    const executable = path.join(directory, "npx");
    await writeFile(executable, `#!/bin/sh\necho "$*" >> "${log}"\n`);
    await chmod(executable, 0o755);
  }
  return { directory, log };
}

test("real CLI persists and reuses both installer selections", async () => {
  const server = http.createServer((request, response) => {
    const name = path.basename(request.url, ".json");
    response.setHeader("content-type", "application/json");
    response.end(JSON.stringify({
      name,
      files: [{ path: `registry/${name}.tsx`, type: "registry:ui", content: `export const installed = ${JSON.stringify(name)};\n` }],
    }));
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  try {
    const nativeCwd = await project();
    const nativeInit = await run(nativeCwd, ["init", "--installer", "native", "--yes"]);
    assert.equal(nativeInit.failed, false, nativeInit.stderr || nativeInit.shortMessage);
    assert.equal(JSON.parse(await readFile(path.join(nativeCwd, "binhlaig.json"), "utf8")).installer, "native");
    const address = server.address();
    const nativeAdd = await run(nativeCwd, ["add", "alert", "avatar", "breadcrumb"], {
      BINHLAIG_REGISTRY_URL: `http://127.0.0.1:${address.port}/r`,
    });
    assert.equal(nativeAdd.failed, false, nativeAdd.stderr);
    assert.match(nativeAdd.stdout, /Installer: Binhlaig Native Beta/);
    for (const component of ["alert", "avatar", "breadcrumb"]) {
      assert.match(await readFile(path.join(nativeCwd, "components", "ui", `${component}.tsx`), "utf8"), new RegExp(component));
    }

    const shadcnCwd = await project();
    const fake = await fakeNpx();
    const env = { PATH: `${fake.directory}${path.delimiter}${process.env.PATH}` };
    assert.equal((await run(shadcnCwd, ["init", "--installer", "shadcn", "--base", "base", "--yes"], env)).failed, false);
    const shadcnConfig = JSON.parse(await readFile(path.join(shadcnCwd, "binhlaig.json"), "utf8"));
    assert.equal(shadcnConfig.installer, "shadcn");
    assert.equal(shadcnConfig.base, "base");
    const shadcnAdd = await run(shadcnCwd, ["add", "dialog", "checkbox", "--overwrite"], env);
    assert.equal(shadcnAdd.failed, false, shadcnAdd.stderr);
    assert.match(shadcnAdd.stdout, /Installer: Shadcn CLI Stable/);
    const shadcnCalls = await readFile(fake.log, "utf8");
    assert.match(shadcnCalls, /shadcn@latest.+add.+dialog\.json.+--yes.+--overwrite/);
    assert.match(shadcnCalls, /shadcn@latest.+add.+checkbox\.json.+--yes.+--overwrite/);

    const unknown = await run(nativeCwd, ["add", "not-a-component"]);
    assert.equal(unknown.failed, true);
    assert.match(unknown.stderr, /Unknown component\(s\): not-a-component/);
  } finally {
    server.close();
  }
});
