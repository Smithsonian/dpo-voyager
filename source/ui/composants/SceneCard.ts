
import { LitElement, customElement, property, html, TemplateResult, css } from "lit-element";
import WebDAVProvider from "@ff/scene/assets/WebDAVProvider";
import i18n from "../state/translate";



export interface SceneProps{
  name  :string;
  uid   :number;
  ctime :string;
  mtime :string;
}


const settingsIcon = html`<svg xmlns="http://www.w3.org/2000/svg" height="24" width="24"><path d="M12 20q-.825 0-1.412-.587Q10 18.825 10 18q0-.825.588-1.413Q11.175 16 12 16t1.413.587Q14 17.175 14 18q0 .825-.587 1.413Q12.825 20 12 20Zm0-6q-.825 0-1.412-.588Q10 12.825 10 12t.588-1.413Q11.175 10 12 10t1.413.587Q14 11.175 14 12q0 .825-.587 1.412Q12.825 14 12 14Zm0-6q-.825 0-1.412-.588Q10 6.825 10 6t.588-1.412Q11.175 4 12 4t1.413.588Q14 5.175 14 6t-.587 1.412Q12.825 8 12 8Z"/></svg>`


/**
 * Main UI view for the Voyager Explorer application.
 */
 @customElement("scene-card")
 export default class SceneCard extends i18n(LitElement)
 {
    static _assets = new WebDAVProvider();
    @property({attribute: false})
    thumb :string;

    @property()
    name :string;

    get path (){
      return `/scenes/${this.name}/`
    }
    @property()
    url :string;


    @property({type :String})
    mode :"anonymous"|"user"|"administrator";

    constructor()
    {
        super();
    }
    public connectedCallback(): void {
        super.connectedCallback();
        if(this.thumb ) return;
        SceneCard._assets.get(this.path, false).then(p=>{
          let thumbProps = p.find(f=> f.name == `${this.name}-image-thumb.jpg`);
          if(!thumbProps) return console.log("No thumbnail for", this.name);
          this.thumb = thumbProps.url;
        });
    }
    public disconnectedCallback(): void {
    }

    protected render() :TemplateResult {
      let params = `resourceRoot=/&root=${this.path}&referrer=/`
      let explorer = `/voyager-explorer.html?${params}`;
      let story = `/voyager-story.html?${params}&lang=${this.language.toUpperCase()}&mode=Edit`;
      return html`<div class="scene-card-inner">
        <a href="${explorer}">
          ${this.thumb? html`<img src="${this.thumb}"/>`: html`<img style="object-fit:contain; background:var(--color-dark);" src="/images/defaultSprite.svg"/>`}
          <h4 class="card-title">${this.name}</h4>
        </a>
        <div class="tools">
          ${this.mode !=="anonymous"? html`
            <a class="btn" href="/ui/scenes/${this.name}/" title="propriétés de l'objet">${settingsIcon}</ff-icon></a>
            <a class="btn" href="${story}"> story ➝</a>
          `:""}
        </div>
      </div>`;
    }

    static styles = [css`
      :host {
        display: block;
        width: 100%;
        flex: 0 0 auto;
        padding: 1rem .5rem;
      }

      @media (min-width: 576px){
        :host{
          width: calc(100% / 2);
        }
      }
      @media (min-width: 992px){
        :host{
          width: calc(100% / 3);
        }
      }
      @media (min-width: 1200px){
        :host{
          width: calc(100% / 4);
        }
      }

      a, button{
        color: var(--color-primary);
        text-decoration: none;
      }
      .scene-card-inner{
        box-sizing: border-box;
        padding-bottom: 1rem;
        background: var(--color-dark);
        transition: background-color 0.2s ease 0s;
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        text-align: center;
        border-radius: 4px;
      }

      .scene-card-inner:hover{
        filter: brightness(1.3);
      }

      .scene-card-inner img {
          object-fit: cover;
          aspect-ratio: 16 / 9;
          width: 100%;
          height: auto;
          border-radius: 4px 4px 0 0;
          transition: filter 0.2s ease 0s;
      }

      .tools, .card-title{
        padding: 0 1rem;
      }

      .tools{
        display: flex;
        justify-content: space-between;
      }

      .tools .btn{
        color: white;
        border-radius: 4px;
      }
      .tools .btn:hover{
        filter: brightness(1.2);
      }

      .tools a:hover{
        text-decoration: underline;
      }
      
      .tools svg{
        width: inherit;
        height: inherit;
        fill: currentColor;
      }
  `]
 
 }