# TypeScript Project

A TypeScript environment targeting **ES2017**, with source maps and extended diagnostics enabled.

## Project Structure

```
ts-project/
├── source/          # TypeScript source files (rootDir)
│   └── index.ts
├── distrib/         # Compiled JS output (outDir, git-ignored)
├── tsconfig.json
├── package.json
└── README.md
```

## Setup

```bash
npm install
```

## Scripts

| Command             | Description                          |
|---------------------|--------------------------------------|
| `npm run build`     | Compile TypeScript → `distrib/`      |
| `npm run build:watch` | Watch mode — recompile on changes  |
| `npm run clean`     | Remove the `distrib/` output folder  |

## tsconfig Highlights

| Option                | Value      | Effect                                      |
|-----------------------|------------|---------------------------------------------|
| `target`              | `ES2017`   | Emits async/await natively (no downleveling) |
| `rootDir`             | `source`   | All `.ts` files live under `source/`        |
| `outDir`              | `distrib`  | Compiled output goes to `distrib/`          |
| `sourceMap`           | `true`     | Generates `.js.map` files for debugging     |
| `extendedDiagnostics` | `true`     | Prints detailed compiler timing/memory info |

## Adding Source Files

Place any `.ts` files inside `source/` (subdirectories are fine — the `include` glob is `source/**/*`).
