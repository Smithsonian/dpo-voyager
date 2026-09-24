/**
 * Emulates the browser environment the client code expects.
 * Loaded before any test file.
 */
import { GlobalRegistrator } from "@happy-dom/global-registrator";

// Many modules (lit-element in particular) touch `window`, `document` or `customElements` on import
GlobalRegistrator.register({ url: "http://localhost:8000/" });

// Build-time constants normally injected by webpack's DefinePlugin
Object.assign(globalThis, {
    ENV_DEVELOPMENT: false,
    ENV_PRODUCTION: true,
    ENV_LOCAL: false,
    ENV_VERSION: "Voyager Test",
});
