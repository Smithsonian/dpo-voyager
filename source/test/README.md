# Unit tests

```sh
npm test                                   # everything
npx mocha source/test/components/CVLanguageManager.test.ts   # a single file
```

Tests run in Node with [mocha](https://mochajs.org) and [chai](https://www.chaijs.com).
TypeScript sources are loaded on the fly by [tsx](https://tsx.is) (no build step, no type checking).
Configuration is in `/.mocharc.cjs` and `./tsconfig.json` (which provides the `client/*` and `@ff/*` aliases).

## Writing tests

Add `*.test.ts` files anywhere under `source/test/`, using `describe`/`it`.
The legacy suites in `libs/*/test/` use mocha's TDD interface (`suite`/`test`) and are wired through each lib's `test/test.ts`.

## Environment

`setup/globals.ts` registers a [happy-dom](https://github.com/capricorn86/happy-dom) `window`/`document` and the `ENV_*` constants webpack normally defines.
That is enough to import any client module and to exercise logic, schemas, and component graphs (`System`, `Node`, `Component`).

There is no WebGL, canvas, or layout engine: `CRenderer`, render passes, picking, or anything measuring the DOM can't be tested here.
Those will need a real browser (e.g. mocha in headless Chromium through `@web/test-runner` or vitest's browser mode), added as a separate test command.

Client components have circular imports that only resolve in the order the app loads them.
`setup/client.ts` preloads `client/applications/coreTypes` so that a test can import a single component directly.
