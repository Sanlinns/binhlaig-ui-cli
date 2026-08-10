import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  availableComponents,
  componentImports,
} from "../lib/components.js";

const expected = [
  "button",
  "card",
  "badge",
  "input",
  "textarea",
  "tabs",
  "popover",
  "form",
  "drawer",
  "dialog",
  "checkbox",
  "alert",
  "alert-dialog",
  "avatar",
  "breadcrumb",
  "calendar",
  "combobox",
  "command",
  "collapsible",
  "data-table",
  "label",
  "toast",
  "navbar",
  "pagination",
];

test("the public component manifest is complete and unique", () => {
  assert.deepEqual(
    availableComponents,
    expected,
    "availableComponents must exactly match the public component list",
  );

  assert.equal(
    new Set(availableComponents).size,
    availableComponents.length,
    "availableComponents must not contain duplicates",
  );
});

test("every public component has an import example", () => {
  for (const component of availableComponents) {
    assert.equal(
      typeof componentImports[component],
      "string",
      `${component} is missing an import example`,
    );

    assert.match(
      componentImports[component],
      new RegExp(`/ui/${component}[\\"']`),
      `${component} import example has an invalid path`,
    );
  }
});

test("the npm package declares all required runtime files", async () => {
  const packageJson = JSON.parse(
    await readFile(
      new URL("../package.json", import.meta.url),
      "utf8",
    ),
  );

  assert.equal(
    packageJson.bin["binhlaig-ui"],
    "bin/cli.js",
    "package.json must expose bin/cli.js as binhlaig-ui",
  );

  assert.deepEqual(
    packageJson.files,
    ["bin", "lib", "README.md", "LICENSE"],
    "package.json files must contain only the publishable runtime paths",
  );

  const requiredRuntimeFiles = [
    "../bin/cli.js",
    "../lib/add.js",
    "../lib/components.js",
    "../lib/config.js",
    "../lib/registry.js",
    "../lib/installers/native.js",
    "../lib/installers/shadcn.js",
  ];

  for (const file of requiredRuntimeFiles) {
    const content = await readFile(
      new URL(file, import.meta.url),
      "utf8",
    );

    assert.ok(
      content.trim().length > 0,
      `${file} is missing or empty`,
    );
  }
});
