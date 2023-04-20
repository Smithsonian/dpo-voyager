import { LitElement, customElement, property, html, TemplateResult, css } from "lit-element";
import WebDAVProvider from "@ff/scene/assets/WebDAVProvider";
import i18n from "../state/translate";
import { AccessType, AccessTypes, Scene } from "../state/withScenes";





/**
 * Main UI view for the Voyager Explorer application.
 */
 @customElement("scene-card")
 export default class SceneCard extends i18n(LitElement)
 {
    static _assets = new WebDAVProvider();
    @property()
    thumb :string;

    @property()
    name :string;

    @property()
    time :string;

    @property({type :String})
    access :AccessType = "none";

    @property({type:String})
    cardStyle :"list"|"grid";

    @property({type: Function})
    onChange :(ev :Event)=>any;

    get path (){
      return `/scenes/${this.name}/`
    }

    can(a :AccessType) :boolean{
      return AccessTypes.indexOf(a ) <= AccessTypes.indexOf(this.access);
    }

    constructor()
    {
        super();
    }
 
    public connectedCallback(): void {
        super.connectedCallback();

        if(this.cardStyle == "list") this.classList.add("card-list");
        if(this.cardStyle == "grid") this.classList.add("card-grid");
        
        if(!this.thumb ){
          SceneCard._assets.get(this.path, false).then(p=>{
            let thumbProps = p.find(f=> f.name.endsWith(`-image-thumb.jpg`));
            if(!thumbProps) return console.log("No thumbnail for", this.name);
            this.thumb = thumbProps.url;
          }, (e)=>{
            console.warn("Failed to PROPFIND %s :", this.path, e);
          });
        }
    }

    public disconnectedCallback(): void {
    }

    protected render() :TemplateResult {
      let explorer = `/ui/scenes/${encodeURIComponent(this.name)}/view?lang=${this.language.toUpperCase()}`;
      let story = `/ui/scenes/${encodeURIComponent(this.name)}/edit?lang=${this.language.toUpperCase()}`;
      return html`
        <div class="scene-card-inner ${this.cardStyle == "list" ? "scene-card-inner-list": ""}" }>
            <div style="display:flex; flex:auto; align-items:center;">
              <a href="${explorer}">
                ${this.thumb? html`<img src="${this.thumb}"/>`: html`<img style="background:radial-gradient(circle, #103040 0, #0b0b0b 100%);" src="/images/defaultSprite.svg" />`}
              </a>
              <div class="infos">
                <h4 class="card-title">${this.name}</h4>
                <p class="card-ctime">${new Date(this.time).toLocaleString(this.language)}</p>
              </div>          
            </div>
            <div class="tools">
              <a href="${explorer}"><ff-icon name="eye"></ff-icon>${this.t("ui.view")}</a>
              ${this.can("write")? html`<a class="tool-link" href="${story}"><ff-icon name="edit"></ff-icon>${this.t("ui.edit")}</a>`:null}
              ${this.can("admin")? html`<a class="tool-properties" href="/ui/scenes/${this.name}/" title="propriétés de l'objet"><ff-icon name="admin"></ff-icon>${this.t("ui.admin")}</a>`:null}
            </div>
        </div>
        ${(this.onChange? html`<span class="pill">
            <input type="checkbox" name="${this.name}" @change=${this.onChange} name="isAdministrator" id="isAdministrator">
        </span>`:null)}`;
    }

    static styles = [css`
      :host {
        width: 100%;
        display: flex;
        align-items: center;
      }

      .scene-card-inner{
        background-color: #000a;
        box-sizing: border-box;
        padding: 1rem;
        width: 100%;
        height: 100%;
        border-radius: 4px;
        border: 1px solid #103040;
      }

      .scene-card-inner:hover{
        background-color: #071922;
      }

      @media (min-width: 664px){
        .scene-card-inner-list{
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
      }

      .scene-card-inner-list{
        padding: 0.5rem;
      }

      .scene-card-inner img {
        aspect-ratio: 1 / 1;
        width: 70px;
        height: fit-content;
        border-radius: 4px;
        border: #103040 solid 1px;
      }
      .scene-card-inner-list img{
        height: auto;
      }
      .infos{
        width: 70%;
      }
      .infos > *{
        padding: 0 0.75rem;
      }

      .tools{
        margin-top: 0.5rem;
        display:flex;
        justify-content: space-around;
      }

      .scene-card-inner-list .tools{
        margin: 0rem;
      }

      .tools a{
        font-size: smaller;
        width: 100%;
        margin: 2px;
        color: #eee;
        text-decoration: none;
        display: flex;
        justify-content: center;
        padding: 0 0.5rem;
      }
      .tools a:hover{
        color: rgb(0, 165, 232);
      }

      .card-title{
        margin:0;
        white-space: nowrap;
        text-overflow: ellipsis;
        overflow: hidden;
      }
      .card-ctime{
        color: #6c757d;
        font-size: smaller;
      }
      .tools svg{
        width: inherit;
        height: 1rem;
        fill: currentColor;
        margin-right: 4px;
      }
      .pill{
        padding: 6px;
      }
      .pill input{
        width: 20px;
        height: 20px;
      }
  `]
 
 }