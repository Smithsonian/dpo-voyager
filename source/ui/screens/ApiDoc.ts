
import { customElement, property, html, TemplateResult, LitElement, css } from "lit-element";

import "@ff/ui/Button";

import "client/ui/Spinner";


/**
 * Main UI view for the Voyager Explorer application.
 */
 @customElement("api-doc")
 export default class UsersList extends LitElement
 {

    @property({attribute: false, type: Boolean})
    loading =true;

    @property({attribute: false, type: Object})
    error :Error;

    scripts :Array<HTMLScriptElement|HTMLLinkElement> = [];
    constructor()
    {
        super();
    }
      
    public connectedCallback(): void {
        super.connectedCallback();
        let script = document.createElement("SCRIPT") as HTMLScriptElement;
        script.src = "https://unpkg.com/@stoplight/elements/web-components.min.js";
        let styles = document.createElement("LINK") as HTMLLinkElement;
        styles.rel = "stylesheet";
        styles.href = "https://unpkg.com/@stoplight/elements/styles.min.css";

        this.scripts.push(script, styles);
        Promise.all(this.scripts.map((s)=>new Promise((resolve, reject)=>{
          s.onload = resolve;
          s.onerror = reject;
        }))).then(()=>{
          this.loading = false;
        }, (e)=>this.error = e);
    }
    protected render() :TemplateResult {
        if(this.error){
            return html`${this.scripts}<h1>Error</h1><div>${this.error.message}</div>`;
        }else if(this.loading){
            return html`${this.scripts}<div style="margin-top:10vh"><sv-spinner visible/></div>`
        }
        return html`${this.scripts}
        <elements-api
          apiDescriptionUrl="/definitions.yml"
          router="hash"
        ></elements-api>`
        
    }
 }