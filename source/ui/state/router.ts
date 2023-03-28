import { Constructor, html, LitElement, property, TemplateResult } from "lit-element";

export interface RouteParams<T extends Router = any>{
  parent :T;
  params :{[key:string]:string};
  search :URLSearchParams;
}

export type RouteHandler<T extends Router = any> =  (props :RouteParams<T>)=> TemplateResult;

export interface Route{
  pattern :RegExp;
  content :RouteHandler<Router>;
}

export declare class Router{
  path :string;
  static routes :Route[];
  get route() :URL;
  isActive(pathname :string, strict?:boolean) :boolean;
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


    /** checks if the given pathname is currently active */
    public isActive(pathname :string, strict = false){
      let base = new URL(window.location.href);
      base.pathname = this.path;
      let u = new URL(pathname, base);
      return (strict?  this.route.pathname == u.pathname : this.route.pathname.indexOf(u.pathname) == 0);
    }

    /** checks if a pathname is contained in this router's base path */
    private inPath(pathname :string){
      return pathname.indexOf(this.path) == 0;
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
        return content({parent:this, params: m.groups, search: this.route.searchParams});
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

      const url = (ev.detail.href instanceof URL)? ev.detail.href: new URL(ev.detail.href, window.location.href);
      if(url.hostname != window.location.hostname) return window.location.href = url.toString();

      if(!this.inPath(url.pathname) && this.path != "/") return; //Return to bubble up the stack
      ev.stopPropagation(); //Handle the route change

      if(!url.pathname.endsWith("/")) url.pathname += "/";
      window.history.pushState({},"", url);
      this.requestUpdate();
      window.dispatchEvent(new CustomEvent("navigate", {
        detail: {href: url.toString()}
      }))
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
export function navigate(that :HTMLElement,href ?:string|URL, queries?:Record<string,string|true|false|null>){
  let url = href ?? (that as HTMLLinkElement)?.href ?? window.location.href;
  if(!url) return console.error("Bad navigate target :", href, that);
  if(!(url instanceof URL)) url = new URL(url, window.location.href);
  if(queries){
    for(let [key, value] of Object.entries(queries)){
      if(value === null || value === false) url.searchParams.delete(key);
      else url.searchParams.set(key, value.toString());
    }
  }
  console.debug("Navigate to :", url.toString(), "with queries : ", queries);
  (that ?? this).dispatchEvent(new CustomEvent("navigate", {
    detail: {href: url},
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

    onClick = (ev ?:MouseEvent)=>{
      navigate(this);
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