# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project overview

This is a Vue 3 single-page application scaffolded with Vite. The app is currently the default Vue + Vite starter, using `script setup` single-file components (SFCs) and minimal project-specific logic.

## Tooling and environment

- Runtime/build: Vite (see `vite.config.js`).
- Framework: Vue 3.
- Node version: `^20.19.0 || >=22.12.0` (see `package.json` `engines`).
- Module resolution: `@` is aliased to the `src` directory via `vite.config.js`.
- Styles: global styles are under `src/assets` (e.g. `main.css`, `base.css`).

For IDE and browser devtools recommendations, refer to `README.md` (VS Code + Vue Official extension, Vue Devtools, and enabling custom object formatters).

## Common commands

All commands are intended to be run from the repository root.

### Install dependencies

```sh
npm install
```

### Development server (hot reload)

```sh
npm run dev
```

This runs the Vite dev server.

### Production build

```sh
npm run build
```

### Preview built app locally

```sh
npm run preview
```

This serves the built assets from `dist` using Vite's preview server.

### Tests

There is currently no test runner or test script configured in `package.json` (no `test` script or testing dependencies). If you add one (e.g., Vitest), update this section with the appropriate commands, including how to run a single test file.

## Code architecture and structure

### Entry point and app bootstrap

- `src/main.js` is the single entry point. It:
  - Imports global styles from `src/assets/main.css`.
  - Creates the Vue app with `createApp(App)` and mounts it to the `#app` element in `index.html`.

### Root component

- `src/App.vue` is the root component:
  - Imports `HelloWorld` and `TheWelcome` from `src/components`.
  - Renders a header with the Vue logo and the `HelloWorld` component, and a `main` section containing `TheWelcome`.
  - Contains only presentational layout and no app-wide state.

### Components

- `src/components/HelloWorld.vue`
  - A simple presentational component receiving a `msg` prop and rendering introductory text. Good place to start when wiring new UI or experimenting with component props.

- `src/components/TheWelcome.vue`
  - A container component that imports:
    - `WelcomeItem.vue` (a layout wrapper component).
    - Icon components from `src/components/icons/`.
  - Renders several `WelcomeItem` instances, each describing documentation, tooling, ecosystem, community, and support links.
  - Defines `openReadmeInEditor`, which performs a `fetch('/__open-in-editor?file=README.md')` used by a link in the template to open `README.md` in the local editor (relies on dev tooling integration provided by Vite/Vue tooling).

- `src/components/WelcomeItem.vue`
  - A layout component that uses slots for an `icon`, a `heading`, and default content.
  - Used exclusively by `TheWelcome.vue` to keep the welcome list markup consistent.

- `src/components/icons/*.vue`
  - Small presentational SVG/icon components consumed by `TheWelcome.vue`. They do not contain business logic.

### Assets and styling

- `src/assets/main.css` and `src/assets/base.css` define global styles and CSS variables used across components.
- `src/assets/logo.svg` is the Vue logo referenced in `App.vue`.

## Notes for future agents

- Prefer using the `@` alias when importing from `src` in new code (e.g., `@/components/YourComponent.vue`) to keep imports consistent with `vite.config.js`.
- The current codebase is minimal starter code; when introducing routing, state management, or tests, make corresponding updates here (especially to the Commands and Architecture sections) so future agents have an accurate overview.
