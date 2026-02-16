# StreamLayer Web-OS SDK — Chrome 32 Integration Demo

Proof-of-concept and debugging environment for integrators who need to support legacy browsers — specifically **Chrome 32** (circa 2014). Demonstrates how to integrate the [`@streamlayer/web-os`](https://www.npmjs.com/package/@streamlayer/web-os) SDK into a Webpack 5 + React 17 application with minimal build-config changes while keeping the bundle compatible with ES5-only runtimes.

## Why This Exists

Some deployment targets (smart TVs, set-top boxes, embedded WebViews) ship browsers frozen at Chrome 32. The `@streamlayer/web-os` SDK publishes two builds:

| Condition | Path | Format |
|-----------|------|--------|
| `module` | `lib/es/index.js` | ESM — modern syntax (arrow functions, `import`/`export`, optional chaining, etc.) |
| `require` | `lib/cjs/index.js` | CJS — pre-transpiled to ES5 with bundled `core-js` polyfill requires |

Webpack 5 defaults to the `module` condition, pulling in the ESM build — which **breaks** on Chrome 32 because Babel excludes `node_modules` by default and the output contains untranspiled ES6+.

This demo shows the configuration needed to force the CJS build and polyfill missing browser APIs.

## Quick Start

```bash
pnpm install
cp .env.example .env   # add your SDK_KEY / EVENT_ID
pnpm dev               # http://localhost:3000
```

## Key Webpack Configuration

### 1. Force CJS resolution via `conditionNames`

The single most important change. By removing `module` and `import` from the resolve conditions, webpack picks the `require` entry from every package's `exports` map — giving you the pre-transpiled CJS build:

```js
// webpack.config.js
resolve: {
  conditionNames: ['webpack', 'require', 'browser', 'default'],
}
```

Without this, webpack resolves `@streamlayer/web-os` → `lib/es/index.js` (ESM, ES6+ syntax).
With this, it resolves → `lib/cjs/index.js` (CJS, ES5-safe).

### 2. Target ES5 output

```js
target: ['web', 'es5'],
output: {
  environment: {
    arrowFunction: false,
    const: false,
    destructuring: false,
    forOf: false,
    module: false,
    optionalChaining: false,
    templateLiteral: false,
  },
},
```

This ensures webpack's own runtime code (chunk loading, module wrappers) emits ES5 syntax only.

### 3. Babel configuration

```js
{
  test: /\.m?jsx?$/,
  exclude: [
    /node_modules[\\/]core-js/,          // already ES5; re-processing causes infinite loops
    /node_modules[\\/]@streamlayer[\\/]web-os/  // already transpiled to ES5 by Rollup
  ],
  use: {
    loader: 'babel-loader',
    options: {
      sourceType: 'unambiguous',
      presets: [
        ['@babel/preset-env', {
          targets: 'chrome 32',
          useBuiltIns: 'entry',
          corejs: 3,
        }],
        ['@babel/preset-react', { runtime: 'classic' }],
      ],
    },
  },
}
```

Key points:
- **`sourceType: "unambiguous"`** — lets Babel auto-detect CJS vs ESM per file, avoiding `require is not defined` errors in CJS files
- **Exclude `core-js`** — it's already ES5; re-processing with `useBuiltIns: "entry"` creates infinite polyfill-insertion loops
- **Exclude `@streamlayer/web-os`** — the CJS build is already transpiled to ES5 and includes its own `core-js` requires; running Babel's `"entry"` mode over it would strip those requires

## Polyfills

Chrome 32 is missing many APIs the SDK depends on. The `@streamlayer/web-os/polyfills` file provides all necessary shims and **must be imported before any SDK code**:

| Polyfill | Missing since | Package |
|----------|--------------|---------|
| `core-js/stable` + `regenerator-runtime` | ES6+ language features | `core-js`, `regenerator-runtime` |
| `TextEncoder` / `TextDecoder` | Chrome 38 | `text-encoding-utf-8` |
| `IntersectionObserver` | Chrome 51 | `intersection-observer` |
| `ResizeObserver` | Chrome 64 | `resize-observer-polyfill` |
| `ReadableStream` / `WritableStream` / `TransformStream` | Chrome 43–67 | `web-streams-polyfill` |
| `fetch` / `Response` / `Headers` / `Request` | Chrome 42 | `whatwg-fetch` |
| `AbortController` + fetch patch | Chrome 66 | `abortcontroller-polyfill` |
| `Response.body` (ReadableStream) | varies | inline wrapper over `arrayBuffer()` |
| `MediaQueryList.addEventListener` | Chrome 50 | inline (delegates to `addListener`) |

## Project Structure

```
├── src/
│   ├── index.html        # minimal shell with <div id="root">
│   └── index.jsx         # app entry — imports polyfills, SDK, renders demo
├── webpack.config.js     # build config (see sections above)
├── .env                  # SDK_KEY, EVENT_ID, PRODUCTION flag
└── package.json
```

## Troubleshooting

**`Unexpected token` errors in browser console**
Webpack is pulling the ESM build. Verify `resolve.conditionNames` does **not** include `module` or `import`.

**`require is not defined` at runtime**
A dependency is being parsed as ESM. Add `sourceType: "unambiguous"` to `babel-loader` options.

**Infinite loop / stack overflow during build**
Babel is processing `core-js` with `useBuiltIns: "entry"`, causing it to inject polyfill imports into `core-js` itself. Make sure `core-js` is excluded from the loader rule.

Use query parameters to pass the SDK_KEY and EVENT_ID.

`?sdk_key=YOUR_KEY&event_id=YOUR_EVENT`
