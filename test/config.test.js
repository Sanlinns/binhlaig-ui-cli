import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { addComponents } from "../lib/add.js";
import {
  readBinhlaigConfig,
  resolveInstaller,
  updateBinhlaigConfig,
} from "../lib/config.js";

async function fixture(config) {
  const cwd = await mkdtemp(path.join(os.tmpdir(), "binhlaig-config-"));
  if (config !== undefined) {
    await writeFile(path.join(cwd, "binhlaig.json"), config, "utf8");
  }
  return cwd;
}

test("config reads missing files as null and rejects malformed JSON", async () => {
  assert.equal(await readBinhlaigConfig(await fixture()), null);
  await assert.rejects(
    readBinhlaigConfig(await fixture("{broken\n")),
    /Invalid JSON in .*binhlaig\.json/
  );
});

test("config writes preserve fields, normalize saved choices, and end in a newline", async () => {
  const cwd = await fixture(JSON.stringify({ aliases: { ui: "@/custom/ui" }, tsx: true }));
  await updateBinhlaigConfig(cwd, { installer: "native" });
  const source = await readFile(path.join(cwd, "binhlaig.json"), "utf8");
  const config = JSON.parse(source);
  assert.deepEqual(config.aliases, { ui: "@/custom/ui" });
  assert.equal(config.tsx, true);
  assert.equal(config.installer, "native");
  assert.ok(source.endsWith("\n"));
  assert.equal(await resolveInstaller({ cwd }), "native");

  await writeFile(path.join(cwd, "binhlaig.json"), '{"installer":" SHADCN "}\n');
  assert.equal(await resolveInstaller({ cwd }), "shadcn");
});

test("installer resolution rejects missing and invalid config and validates overrides", async () => {
  await assert.rejects(resolveInstaller({ cwd: await fixture() }), /has not been initialized.*npx binhlaig-ui@latest init/s);
  await assert.rejects(resolveInstaller({ cwd: await fixture('{"installer":"other"}') }), /Invalid installer in binhlaig\.json/);
  await assert.rejects(resolveInstaller({ cwd: await fixture('{"installer":"native"}'), explicitInstaller: "other" }), /Unsupported installer/);
});

test("add uses saved Native and forwards multiple components and overwrite", async () => {
  const cwd = await fixture('{"installer":"Native"}\n');
  const calls = [];
  const installer = await addComponents({
    cwd,
    components: ["button", "card"],
    overwrite: true,
    nativeInstaller: async (options) => calls.push(options),
  });
  assert.equal(installer, "native");
  assert.deepEqual(calls, [{ cwd, components: ["button", "card"], overwrite: true }]);
});

test("add uses saved Shadcn for every component and forwards overwrite", async () => {
  const cwd = await fixture('{"installer":"shadcn"}\n');
  const calls = [];
  const installer = await addComponents({
    cwd,
    components: ["button", "drawer"],
    overwrite: true,
    shadcnInstaller: async (options) => calls.push(options),
  });
  assert.equal(installer, "shadcn");
  assert.deepEqual(calls.map(({ component }) => component), ["button", "drawer"]);
  assert.ok(calls.every((call) => call.overwrite));
});

test("explicit installer overrides the saved installer", async () => {
  const cwd = await fixture('{"installer":"native"}\n');
  let selected;
  await addComponents({
    cwd,
    components: ["button"],
    explicitInstaller: " SHADCN ",
    nativeInstaller: async () => { selected = "native"; },
    shadcnInstaller: async () => { selected = "shadcn"; },
  });
  assert.equal(selected, "shadcn");
});
