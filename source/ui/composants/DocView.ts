
import { customElement, property, html, TemplateResult, LitElement, css } from "lit-element";
import {unsafeHTML} from 'lit-html/directives/unsafe-html.js';

import "@ff/ui/Button";

import "client/ui/Spinner";
import i18n from "../state/translate";
import { Language } from "../state/strings";

import styles from '!lit-css-loader?{"specifier":"lit-element"}!sass-loader!../styles.scss';

/**
 * Main UI view for the Voyager Explorer application.
 */
 @customElement("doc-view")
 export default class DocView extends i18n(LitElement)
 {

    static _converter :Promise<showdown.Converter>;
    async getConverter(){
      return await (DocView._converter ??= import("showdown").then(({default: showdown})=>{
        return new showdown.Converter({
          // see https://github.com/showdownjs/showdown/blob/master/README.md#valid-options
          simplifiedAutoLink: true,
        });
      }));
    }

    #c = new AbortController();

    @property({attribute: false, type: Object})
    error :Error;

    @property({attribute:false})
    content :string;

    @property({type: String})
    path :string ="/";

    constructor()
    {
        super();
    }
      
    public connectedCallback(): void {
        super.connectedCallback();
    }
    public disconnectedCallback(): void {
      this.#c.abort();
    }

    protected update(changedProperties: Map<string | number | symbol, unknown>): void {
      console.log("Update : ", changedProperties);
      if((!this.content || changedProperties.has("language") || changedProperties.has("doc")) && this.language){
        Promise.all([
          this.getConverter(),
          this.getDocument(),
        ]).then(([converter, doc])=>{
          this.content = converter.makeHtml(doc);
        }).catch((e)=> {
          this.error = e
        });
      }
      super.update(changedProperties);
    }

    private async getDocument(lang :Language = this.language){
      this.#c.abort();
      this.#c = new AbortController();
      let file = (this.path.indexOf("/") == 0)? this.path.slice(1): this.path;
      this.content = "loading...";
      let r = await fetch(`/doc/${lang}/${file}`, {
        headers: {
        'Accept': "text/plain",
        },
        signal: this.#c.signal,
      });
      if(r.ok) return await r.text();
      else if(r.status == 404 && lang != "en"){
        try{
          return await this.getDocument("en");
        }catch(e){
          console.warn("Failed to fetch fallback document : ", e);
        }
      }
      throw new Error(`${await r.text()}`);
    }

    protected render() :TemplateResult {
      if(this.error){
        return html`<h1>Error</h1><div>${this.error.message}</div>`;
      }else if(!this.content || this.content =="loading..."){
        return html`<div style="margin-top:10vh">Loading...<sv-spinner visible/></div>`
      }
      return html`${unsafeHTML(this.content)}`;
    }

    static styles = [styles, css`
      :host{
        color: white;
      }
    `]
 }