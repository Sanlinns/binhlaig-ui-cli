import { resolveInstaller } from "./config.js";
import { installWithNative } from "./installers/native.js";
import { installWithShadcn } from "./installers/shadcn.js";

export async function addComponents({
  cwd = process.cwd(),
  components,
  explicitInstaller,
  overwrite = false,
  nativeInstaller = installWithNative,
  shadcnInstaller = installWithShadcn,
}) {
  const installer = await resolveInstaller({ cwd, explicitInstaller });
  if (installer === "native") {
    await nativeInstaller({ cwd, components, overwrite });
  } else {
    for (const component of components) {
      await shadcnInstaller({ cwd, component, overwrite });
    }
  }
  return installer;
}
