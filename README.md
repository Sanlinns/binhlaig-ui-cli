# Binhlaig UI CLI

The Binhlaig UI CLI installs Binhlaig UI components through the
[shadcn CLI](https://ui.shadcn.com/docs/cli). It uses the Binhlaig component
registry at `https://ui.binhlaig.com/r` by default.

## Requirements

- Node.js 20 or newer
- A project configured to use shadcn

## Production usage

Run the latest published version without installing it globally:

```bash
npx binhlaig-ui@latest add button
```

You can also install the package globally:

```bash
npm install --global binhlaig-ui
binhlaig-ui add button
```

## Commands

Install the button component:

```bash
binhlaig-ui add button
```

List the available components:

```bash
binhlaig-ui list
```

Overwrite existing component files when supported by shadcn:

```bash
binhlaig-ui add button --overwrite
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
node bin/cli.js add button
```

Paths containing spaces are supported. The CLI invokes `npx` directly without
using a shell.

## Local registry testing

Set `BINHLAIG_REGISTRY_URL` to override the production registry.

PowerShell:

```powershell
$env:BINHLAIG_REGISTRY_URL="http://localhost:3000/r"
node bin/cli.js add button
Remove-Item Env:BINHLAIG_REGISTRY_URL
```

macOS or Linux:

```bash
BINHLAIG_REGISTRY_URL=http://localhost:3000/r node bin/cli.js add button
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
