import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { availableComponents, componentImports } from "../lib/components.js";

const expected = [
  "button", "card", "badge", "input", "textarea", "tabs", "popover",
  "form", "drawer", "dialog", "checkbox", "alert", "alert-dialog",
  "avatar", "breadcrumb",
];

test("the public component manifest is complete and unique", () => {
  assert.deepEqual(availableComponents, expected);
  assert.equal(new Set(availableComponents).size, availableComponents.length);
});

test("every public component has an import example", () => {
  for (const component of availableComponents) {
    assert.match(componentImports[component], new RegExp(`/ui/${component}\\"`));
  }
});

test("the npm package declares all required runtime files", async () => {
  const packageJson = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));
  assert.equal(packageJson.bin["binhlaig-ui"], "bin/cli.js");
  assert.deepEqual(packageJson.files, ["bin", "lib", "README.md", "LICENSE"]);
  for (const file of [
    "../bin/cli.js", "../lib/add.js", "../lib/config.js", "../lib/registry.js",
    "../lib/installers/native.js", "../lib/installers/shadcn.js",
  ]) {
    assert.ok((await readFile(new URL(file, import.meta.url), "utf8")).length > 0);
  }
});
