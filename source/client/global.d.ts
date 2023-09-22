declare module '!raw-loader!*' {
    const contents: string;
    export = contents;
}

declare module "*.scss";
declare module "*.css";

// Webpack constant: build version
declare const ENV_VERSION: string;
// Webpack constant: true during development build
declare const ENV_DEVELOPMENT: boolean;
// Webpack constant: true during production build
declare const ENV_PRODUCTION: boolean;
// Webpack constant: true during local build
declare const ENV_LOCAL: boolean;

// Google Analytics global variable
declare const gtag: any;


declare interface Window {
    webkitAudioContext: typeof AudioContext
}
