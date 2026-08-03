# Binhlaig UI CLI

The Binhlaig UI CLI initializes projects and installs components using either
the Binhlaig Native Beta installer or the
[shadcn CLI](https://ui.shadcn.com/docs/cli). The native installer uses the
Binhlaig component registry at `https://ui.binhlaig.com/r` by default.

## Requirements

- Node.js 20 or newer
- A Next.js, Vite React, or React project
- A project configured for shadcn when using the Shadcn CLI installer

## Production usage

Run the latest published version without installing it globally:

```bash
npx binhlaig-ui@latest init
```

Choose:

```text
Binhlaig Native Beta
```

Then install a component:

```bash
npx binhlaig-ui@latest add button --installer native
```

You can also install the package globally:

```bash
npm install --global binhlaig-ui
binhlaig-ui add button
```

## Commands

Initialize a project and choose an installer interactively:

```bash
binhlaig-ui init
```

Initialize directly with one installer:

```bash
binhlaig-ui init --installer native
binhlaig-ui init --installer shadcn
```

Native initialization detects the framework, package manager, and `src`
layout; creates `binhlaig.json`, `components/ui`, and `lib/utils.ts`; adds the
idempotent Tailwind CSS v4 theme to the global stylesheet; and installs the
Native runtime dependencies. It does not overwrite an existing configuration
or utility file.

Install the button component with either installer:

```bash
binhlaig-ui add button --installer native
binhlaig-ui add button --installer shadcn
```

List the available components:

```bash
binhlaig-ui list
```

Overwrite existing component files:

```bash
binhlaig-ui add button --installer native --overwrite
```

## Local CLI development

Install dependencies and link the command:

```bash
npm install
npm link
binhlaig-ui --help
```

Alternatively, run the entry point directly:

```bash
node bin/cli.js list
node bin/cli.js add button --installer native
```

Paths containing spaces are supported. The CLI invokes `npx` directly without
using a shell.

## Local registry testing

Set `BINHLAIG_REGISTRY_URL` to override the production registry.

PowerShell:

```powershell
$env:BINHLAIG_REGISTRY_URL="http://localhost:3000/r"
node bin/cli.js add button --installer native
Remove-Item Env:BINHLAIG_REGISTRY_URL
```

macOS or Linux:

```bash
BINHLAIG_REGISTRY_URL=http://localhost:3000/r node bin/cli.js add button --installer native
```

The local registry must serve the component at
`http://localhost:3000/r/button.json`.

## Troubleshooting

### Unknown component

Run `binhlaig-ui list` and use one of the displayed component names.

### Registry or network errors

Check that the registry URL is reachable and that
`BINHLAIG_REGISTRY_URL` is unset for production usage. The override must be a
valid HTTP or HTTPS URL.

### `npx` or `binhlaig-ui` is not recognized

Install a supported Node.js version. For local development, run `npm link`
again and ensure npm's global executable directory is on your `PATH`.

### shadcn installation errors

Run the command inside the application that should receive the component and
confirm that the application is configured for shadcn. Output from shadcn is
shown directly so its original error remains visible.
