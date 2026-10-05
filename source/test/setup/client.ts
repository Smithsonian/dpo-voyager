/**
 * Components in client/ have circular imports that only resolve when modules
 * are loaded in the same order as in the application bundle.
 * Loading the core component types first makes it possible to import any component on its own in tests.
 */
import "client/applications/coreTypes";
