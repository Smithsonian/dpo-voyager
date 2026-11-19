/**
 * Emulates the browser environment the client code expects.
 * Loaded before any test file.
 */
import { GlobalRegistrator } from "@happy-dom/global-registrator";

// Many modules (lit-element in particular) touch `window`, `document` or `customElements` on import
GlobalRegistrator.register({ url: "http://localhost:8000/" });

// Tests must not depend on the network: stub the code that fetches instead
globalThis.fetch = (input: RequestInfo | URL) => {
    const url = input instanceof Request ? input.url : String(input);
    return Promise.reject(new Error(`Unit tests can't make network requests (${url})`));
};

// Mocha re-emits unhandled rejections on `process`, where nothing listens, so they would pass silently.
// Throwing turns them into uncaught errors, which fail the running test as Node does by default.
process.on("unhandledRejection", reason => { throw reason; });

// Build-time constants normally injected by webpack's DefinePlugin
Object.assign(globalThis, {
    ENV_DEVELOPMENT: false,
    ENV_PRODUCTION: true,
    ENV_LOCAL: false,
    ENV_VERSION: "Voyager Test",
});
