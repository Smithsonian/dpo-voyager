import { Constructor, html, LitElement, property, TemplateResult } from "lit-element";

export type RouteHandler<T extends Router = any> =  (parent :T, params :{[key:string]:string})=> TemplateResult;

export interface Route{
  pattern :RegExp;
  content :RouteHandler<Router>;
}

export declare class Router{
  path :string;
  static routes :Route[];
  get route() :URL;
  renderContent() :TemplateResult;
}

export function router<T extends Constructor<LitElement>>(baseClass:T) : T & Constructor<Router> {
  class Router extends baseClass{
    @property({type: String})
    path ="/";

    static routes = new Map<RegExp,RouteHandler>();
    get route(){
      return new URL(window.location.href);
    }

    inPath(href :string){
      return href.indexOf(this.path) == 0;
    }
    
    renderContent(){
      let current = this.route.pathname;
      if(!this.inPath(current)){
        return html`<h1>Error :</h1>
          <p>${current} is not in this router's base path.</p>
          <p>Router: <${this.tagName.toLowerCase()} path="${this.path}"></p>
        `
      }
      current = current.slice(this.path.length);
      for(let [pattern, content] of Router.routes.entries()){
        let m = pattern.exec(current);
        if(!m) continue;
        return content(this, m.groups);
      }
      return html`<h1>Error :</h1>
        <p>${current} Not Found in this router</p>
        <p>Router: <${this.tagName.toLowerCase()} path="${this.path}"></p>
      `
    }

    protected render() {
      return this.renderContent();
    }

    onPopState = () =>{
      this.requestUpdate();
    }

    onNavigate(ev :CustomEvent<HTMLLinkElement|{href:string|URL}>){
      let href = ev.detail.href.toString();
      if(!this.inPath(href)) return;
      //Not found
      ev.stopPropagation();
      const url = new URL(href, window.location.href);
      if(!url.pathname.endsWith("/")) url.pathname += "/";
      window.history.pushState({},"", url);
      console.error("No route found in base router matching ", href);
      this.requestUpdate();
    }


    connectedCallback(): void {
      super.connectedCallback();
      this.addEventListener("navigate", this.onNavigate);
      window.addEventListener("popstate", this.onPopState);
    }
  
    disconnectedCallback(): void {
      super.disconnectedCallback();
      this.removeEventListener("navigate", this.onNavigate);
      window.removeEventListener("popstate", this.onPopState);
    }
  }
  return Router;
}

export function route(pattern ?:string|RegExp){
  return function(R :any, key :string){
    (R.routes as Map<RegExp,RouteHandler>).set(toRegex(pattern ?? key), R[key]);
  }
}
/**
 * Internal navigation that changes window.location without refreshing the page
 */
export function navigate(that :HTMLElement,href ?:string|URL, ){
  href ??= (that as HTMLLinkElement)?.href;
  if(!href) return console.error("Bad navigate target :", href, that);
  (that ?? this).dispatchEvent(new CustomEvent("navigate", {
    detail: {href: href},
    bubbles: true,
    composed: true
  }));
}

export declare class Link{
  href :string;
  onClick :()=>void;
}

export function link<T extends Constructor<LitElement>>(baseClass:T) : T & Constructor<Link>{
  class Link extends baseClass{
    href :string;
    connectedCallback(){
      super.connectedCallback();
      this.addEventListener("click", this.onClick);
    }
    disconnectedCallback(): void {
      super.disconnectedCallback();
      this.removeEventListener("click", this.onClick);
    }
    onClick = ()=>{
      this.dispatchEvent(new CustomEvent("navigate", {
        detail: {href: this.href},
        bubbles: true,
        composed: true
      }));
    }
  }
  return Link;
}

/**
 * Simplified from path-to-regex for our simple use-case
 * @see https://github.com/pillarjs/path-to-regexp
 */
function toRegex(path:string|RegExp){
  if(path instanceof RegExp) return path;
  const matcher = `[^\/#\?]+`
  let parts = path.split("/")
  .filter(p=>p)
  .map( p =>{
    let param = /:(\w+)/.exec(p);
    if(!param) return p;
    return `(?<${param[1]}>${matcher})`;
  })
  return new RegExp(`^/?${parts.join("/")}/?$`,"i")
}