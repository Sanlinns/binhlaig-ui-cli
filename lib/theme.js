export const THEME_START_MARKER =
  "/* binhlaig-ui-theme:start */";
export const THEME_END_MARKER =
  "/* binhlaig-ui-theme:end */";
export const LEGACY_THEME_MARKER =
  "/* binhlaig-ui-theme */";

export const BINHLAIG_THEME_BLOCK = `${THEME_START_MARKER}
@custom-variant dark (&:where(.dark, .dark *));

:root {
  --ink: #081227;
  --muted: oklch(0.97 0 0);
  --line: #e7eaf0;
  --surface: #ffffff;
  --soft: #f6f8fc;
  --blue: #2563eb;
  --blue-dark: #1748c7;
  --violet: #7950f2;
  --cyan: #0ea5e9;
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.145 0 0);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.145 0 0);
  --primary: oklch(0.205 0 0);
  --primary-foreground: oklch(0.985 0 0);
  --secondary: oklch(0.97 0 0);
  --secondary-foreground: oklch(0.205 0 0);
  --muted-foreground: oklch(0.556 0 0);
  --accent: oklch(0.97 0 0);
  --accent-foreground: oklch(0.205 0 0);
  --destructive: oklch(0.577 0.245 27.325);
  --border: oklch(0.922 0 0);
  --input: oklch(0.922 0 0);
  --ring: oklch(0.708 0 0);
  --chart-1: oklch(0.87 0 0);
  --chart-2: oklch(0.556 0 0);
  --chart-3: oklch(0.439 0 0);
  --chart-4: oklch(0.371 0 0);
  --chart-5: oklch(0.269 0 0);
  --radius: 0.625rem;
  --sidebar: oklch(0.985 0 0);
  --sidebar-foreground: oklch(0.145 0 0);
  --sidebar-primary: oklch(0.205 0 0);
  --sidebar-primary-foreground: oklch(0.985 0 0);
  --sidebar-accent: oklch(0.97 0 0);
  --sidebar-accent-foreground: oklch(0.205 0 0);
  --sidebar-border: oklch(0.922 0 0);
  --sidebar-ring: oklch(0.708 0 0);
}

.dark {
  --ink: #f8fafc;
  --muted: oklch(0.269 0 0);
  --line: #1e293b;
  --surface: #020617;
  --soft: #0f172a;
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  --card: oklch(0.205 0 0);
  --card-foreground: oklch(0.985 0 0);
  --popover: oklch(0.205 0 0);
  --popover-foreground: oklch(0.985 0 0);
  --primary: oklch(0.922 0 0);
  --primary-foreground: oklch(0.205 0 0);
  --secondary: oklch(0.269 0 0);
  --secondary-foreground: oklch(0.985 0 0);
  --muted-foreground: oklch(0.708 0 0);
  --accent: oklch(0.269 0 0);
  --accent-foreground: oklch(0.985 0 0);
  --destructive: oklch(0.704 0.191 22.216);
  --border: oklch(1 0 0 / 10%);
  --input: oklch(1 0 0 / 15%);
  --ring: oklch(0.556 0 0);
  --chart-1: oklch(0.87 0 0);
  --chart-2: oklch(0.556 0 0);
  --chart-3: oklch(0.439 0 0);
  --chart-4: oklch(0.371 0 0);
  --chart-5: oklch(0.269 0 0);
  --sidebar: oklch(0.205 0 0);
  --sidebar-foreground: oklch(0.985 0 0);
  --sidebar-primary: oklch(0.488 0.243 264.376);
  --sidebar-primary-foreground: oklch(0.985 0 0);
  --sidebar-accent: oklch(0.269 0 0);
  --sidebar-accent-foreground: oklch(0.985 0 0);
  --sidebar-border: oklch(1 0 0 / 10%);
  --sidebar-ring: oklch(0.556 0 0);
}

@theme inline {
  --color-sidebar-ring: var(--sidebar-ring);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar: var(--sidebar);
  --color-chart-5: var(--chart-5);
  --color-chart-4: var(--chart-4);
  --color-chart-3: var(--chart-3);
  --color-chart-2: var(--chart-2);
  --color-chart-1: var(--chart-1);
  --color-ring: var(--ring);
  --color-input: var(--input);
  --color-border: var(--border);
  --color-destructive: var(--destructive);
  --color-accent-foreground: var(--accent-foreground);
  --color-accent: var(--accent);
  --color-muted-foreground: var(--muted-foreground);
  --color-muted: var(--muted);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-secondary: var(--secondary);
  --color-primary-foreground: var(--primary-foreground);
  --color-primary: var(--primary);
  --color-popover-foreground: var(--popover-foreground);
  --color-popover: var(--popover);
  --color-card-foreground: var(--card-foreground);
  --color-card: var(--card);
  --color-foreground: var(--foreground);
  --color-background: var(--background);
  --radius-sm: calc(var(--radius) * 0.6);
  --radius-md: calc(var(--radius) * 0.8);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) * 1.4);
  --radius-2xl: calc(var(--radius) * 1.8);
  --radius-3xl: calc(var(--radius) * 2.2);
  --radius-4xl: calc(var(--radius) * 2.6);
}

@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground;
  }
}
${THEME_END_MARKER}`;

const MANAGED_THEME_PATTERN =
  /\/\* binhlaig-ui-theme:start \*\/[\s\S]*?\/\* binhlaig-ui-theme:end \*\//g;

export function updateBinhlaigThemeCss(input) {
  const original = String(input);
  let css = removeManagedThemes(original);
  css = removeLegacyTheme(css);
  css = normalizeImport(css, "tw-animate-css");
  css = normalizeImport(css, "tailwindcss");

  const preserved = css.trimEnd();
  const separator = preserved ? "\n\n" : "";
  const output = `${preserved}${separator}${BINHLAIG_THEME_BLOCK}\n`;

  return {
    css: output,
    changed: output !== original,
  };
}

function normalizeImport(css, packageName) {
  const pattern = new RegExp(
    `@import\\s+["']${escapeRegExp(packageName)}["']\\s*;\\s*`,
    "g"
  );
  const withoutImport = css.replace(pattern, "").trimStart();
  return `@import "${packageName}";\n${withoutImport}`;
}

function removeManagedThemes(css) {
  return css.replace(MANAGED_THEME_PATTERN, "").trimEnd();
}

function removeLegacyTheme(css) {
  const markerIndex = css.indexOf(LEGACY_THEME_MARKER);
  if (markerIndex === -1) return css;

  const endIndex = findLegacyThemeEnd(css, markerIndex);
  if (endIndex === -1) {
    return css.replace(LEGACY_THEME_MARKER, "");
  }

  return `${css.slice(0, markerIndex)}${css.slice(endIndex)}`.trimEnd();
}

function findLegacyThemeEnd(css, startIndex) {
  let depth = 0;
  let blocks = 0;
  let opened = false;

  for (let index = startIndex; index < css.length; index += 1) {
    if (css[index] === "{") {
      depth += 1;
      opened = true;
    } else if (css[index] === "}") {
      depth -= 1;
      if (opened && depth === 0) {
        blocks += 1;
        if (blocks === 4) return index + 1;
      }
    }
  }

  return -1;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
