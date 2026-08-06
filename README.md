# Binhlaig UI CLI

The Binhlaig UI CLI initializes projects and installs components using either
the Binhlaig Native Beta installer or the
[shadcn CLI](https://ui.shadcn.com/docs/cli). The native installer uses the
Binhlaig component registry at `https://ui.binhlaig.com/r` by default.

- **Binhlaig Native Beta** uses the native installation engine and installs
  Binhlaig registry components directly.
- **Shadcn CLI Stable** uses the Shadcn CLI installation engine, but still
  installs the same Binhlaig registry components rather than the standard
  Shadcn component implementations.

Both installers apply the same Binhlaig foundation and produce the same
component API and design.

## Requirements

- Node.js 20 or newer
- A Next.js, Vite React, or React project
- A project configured for shadcn when using the Shadcn CLI installer

## Production usage

Run the latest published version without installing it globally:

```bash
npx binhlaig-ui@latest init
```

Choose either installer. The selection is saved in `binhlaig.json`, so later
commands automatically use it:

```bash
npx binhlaig-ui@latest add button
npx binhlaig-ui@latest add alert avatar breadcrumb
npx binhlaig-ui@latest add calendar
npx binhlaig-ui@latest add combobox
npx binhlaig-ui@latest add command
npx binhlaig-ui@latest add collapsible
npx binhlaig-ui@latest add data-table
npx binhlaig-ui@latest add calendar combobox command collapsible data-table
```

Use `--installer native` or `--installer shadcn` only when you want a
one-command override of the saved choice.

If an older or standard Shadcn Button already exists, add `--overwrite` to
replace it with the Binhlaig registry implementation. Otherwise, both
installers preserve existing component files.

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
layout; creates or updates `binhlaig.json`, creates `components/ui` and
`lib/utils.ts`; adds the idempotent Tailwind CSS v4 theme to the global
stylesheet; and installs the Native runtime dependencies. Existing
configuration fields and utility files are preserved. Shadcn initialization
also records its installer and base in `binhlaig.json`.

Both initialization paths manage the same theme between
`/* binhlaig-ui-theme:start */` and `/* binhlaig-ui-theme:end */`. Re-running
init updates that managed block while preserving CSS outside it and migrates
themes created by older CLI versions.

Install one or more components using the installer selected during init:

```bash
binhlaig-ui add button
binhlaig-ui add alert avatar breadcrumb
```

The optional explicit installer is a one-command override:

```bash
binhlaig-ui add dialog --installer native
```

List the available components:

```bash
binhlaig-ui list
```

Overwrite existing component files:

```bash
binhlaig-ui add dialog --overwrite
```

## Available components

`button`, `card`, `badge`, `input`, `textarea`, `tabs`, `popover`, `form`,
`drawer`, `dialog`, `checkbox`, `alert`, `alert-dialog`, `avatar`, `breadcrumb`,
`calendar`, `combobox`, `command`, `collapsible`, and `data-table`.

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
node bin/cli.js add button
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
