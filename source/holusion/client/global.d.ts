declare module '!raw-loader!*' {
    const contents: string;
    export = contents;
}

declare module '!lit-css-loader*.scss' {
    import {CSSResult} from 'lit-element';
    const css: CSSResult;
    export default css;
}
declare module '!lit-css-loader*.css' {
    import {CSSResult} from 'lit-element';
    const css: CSSResult;
    export default css;
}

declare module "*.scss" {
    import {CSSResult} from 'lit-element';
    const css: CSSResult;
    export default css.cssText;
}
declare module "*.css"{
    import {CSSResult} from 'lit-element';
    const css: CSSResult;
    export default css.cssText;
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