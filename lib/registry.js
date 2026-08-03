const DEFAULT_REGISTRY_URL = "https://ui.binhlaig.com/r";

export function getRegistryUrl() {
  return (
    process.env.BINHLAIG_REGISTRY_URL ||
    DEFAULT_REGISTRY_URL
  ).replace(/\/+$/, "");
}

export function getComponentUrl(component) {
  const registryUrl = getRegistryUrl();

  let baseUrl;

  try {
    baseUrl = new URL(`${registryUrl}/`);
  } catch {
    throw new Error(
      `Invalid registry URL: ${registryUrl}`
    );
  }

  if (!["http:", "https:"].includes(baseUrl.protocol)) {
    throw new Error(
      `Unsupported registry protocol: ${baseUrl.protocol}`
    );
  }

  return new URL(`${component}.json`, baseUrl).href;
}

export async function fetchRegistryItem(component) {
  const url = getComponentUrl(component);

  let response;

  try {
    response = await fetch(url, {
      headers: {
        accept: "application/json",
        "user-agent": "binhlaig-ui-cli",
      },
    });
  } catch (error) {
    throw new Error(
      `Unable to connect to Binhlaig Registry.\n` +
        `URL: ${url}\n` +
        `${
          error instanceof Error
            ? error.message
            : String(error)
        }`
    );
  }

  if (response.status === 404) {
    throw new Error(
      `Component "${component}" was not found in the registry.`
    );
  }

  if (!response.ok) {
    throw new Error(
      `Registry request failed: ${response.status} ${response.statusText}`
    );
  }

  let item;

  try {
    item = await response.json();
  } catch {
    throw new Error(
      `Registry returned invalid JSON for "${component}".`
    );
  }

  validateRegistryItem(item, component);

  return {
    ...item,
    registryUrl: url,
  };
}

function validateRegistryItem(item, component) {
  if (!item || typeof item !== "object") {
    throw new Error(
      `Invalid registry item for "${component}".`
    );
  }

  if (!item.name || typeof item.name !== "string") {
    throw new Error(
      `Registry item "${component}" has no valid name.`
    );
  }

  if (!Array.isArray(item.files)) {
    throw new Error(
      `Registry item "${component}" has no files array.`
    );
  }

  for (const file of item.files) {
    if (!file || typeof file !== "object") {
      throw new Error(
        `Registry item "${component}" contains an invalid file.`
      );
    }

    if (!file.path || typeof file.path !== "string") {
      throw new Error(
        `A file in "${component}" has no valid path.`
      );
    }

    if (typeof file.content !== "string") {
      throw new Error(
        `Registry file "${file.path}" has no content.`
      );
    }
  }
}