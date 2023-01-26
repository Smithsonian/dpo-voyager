declare module '!raw-loader!*' {
    const contents: string;
    export = contents;
}

declare module '*.scss' {
    import {CSSResult} from 'lit-element';
    const css: CSSResult;
    export default css;
}
declare module '*.css' {
    import {CSSResult} from 'lit-element';
    const css: CSSResult;
    export default css;
}
declare module '*.svg' {
    const content: any;
    export default content;
}
declare module '*.png' {
    const content: any;
    export default content;
}
declare module '*.jpg' {
    const content: any;
    export default content;
}

// Webpack constant: build version
declare const ENV_VERSION: string;
// Webpack constant: true during development build
declare const ENV_DEVELOPMENT: boolean;
// Webpack constant: true during production build
declare const ENV_PRODUCTION: boolean;
// Webpack constant: true during local build
declare const ENV_LOCAL: boolean;

// Google Analytics global variable
declare const ga: any;