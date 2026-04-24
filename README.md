# Plinko Game

A browser-based Plinko game built with **Vue 3**, **Pinia**, and **PixiJS v8**. Drop balls through a triangular peg grid and watch them bounce into multiplier slots at the bottom — collect winnings or lose your bet depending on where they land.

## Features

- **Adjustable board** — choose between 8 and 16 rows of pegs; more rows means more bounces and more extreme multipliers
- **Bet controls** — set your bet amount and drop 1–10 balls per round; the total cost is deducted before any ball is released
- **Per-slot multipliers** — each row has its own multiplier table; the centre slots pay less but land more often, while the edge slots carry higher risk and reward
- **Animated ball trails** — each ball leaves a ghost trail as it travels down through the pegs
- **Peg hit feedback** — pegs light up and cycle through colour states when struck
- **Procedural sound effects** — peg hits, bucket landings, balance updates, and big-win cues generated entirely via the Web Audio API (no audio files required); globally mutable
- **Round history** — the last 20 results are displayed so you can track your run
- **Pending row changes** — adjusting the row count while balls are in flight queues the change and applies it once all balls have landed

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Vue 3 (Composition API, `<script setup>`, TypeScript) |
| State | Pinia |
| Renderer | PixiJS v8 (WebGL) |
| Build | Vite |
| Testing | Vitest |
| Linting | ESLint + Oxlint |

## Project Setup

```sh
pnpm install
```

### Compile and Hot-Reload for Development

```sh
pnpm dev
```

### Type-Check, Compile and Minify for Production

```sh
pnpm build
```

### Run Unit Tests with [Vitest](https://vitest.dev/)

```sh
pnpm test:unit
```

### Lint with [ESLint](https://eslint.org/)

```sh
pnpm lint
```

### Deploy to GitHub Pages

```sh
pnpm deploy
```

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

### Browser DevTools

- Chromium (Chrome, Edge, Brave): [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd) — also [enable Custom Object Formatters](http://bit.ly/object-formatters)
- Firefox: [Vue.js devtools](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/) — also [enable Custom Object Formatters](https://fxdx.dev/firefox-devtools-custom-object-formatters/)

## Type Support for `.vue` Imports in TS

TypeScript cannot handle type information for `.vue` imports by default, so we replace the `tsc` CLI with `vue-tsc` for type checking. In editors, [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) makes the TypeScript language service aware of `.vue` types.

See the [Vite Configuration Reference](https://vite.dev/config/) for build customisation.
