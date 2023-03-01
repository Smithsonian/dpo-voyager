import DocumentView, { property, customElement, html } from "client/ui/explorer/DocumentView";
import { System } from "@ff/scene/ui/SystemView";
import CVViewer from "client/components/CVViewer";

@customElement("settings-view")
export default class SettingsView extends DocumentView 
{
  private files : Array<string>;
  
  @property({type: Boolean })
  isOpen: boolean = false;

  @property({type: Boolean })
  isLogin: boolean = false;

  protected get viewer()
  {
      return this.system.getComponent(CVViewer, true);
  }
  
  constructor(system :System)
  {
      super(system);
  }

  protected firstConnected(): void 
  {
      this.classList.add("settings-view");
  }

  connectedCallback() {
    super.connectedCallback()

    fetch("/files/list").then(async (res)=>{
      if(!res.ok) throw new Error(`[${res.status}]: ${res.statusText}`);
      this.files = await res.json();
    })
  }


  protected render()
  {

    const filesList = this.files?
      html`${this.files.map(file=> html`<ff-button icon="file" text=${file}></ff-button>`)}`:
      html`Aucun fichier trouvé`;

    const updateFiles = html`<div>
      <h2>Synchroniser mes données</h2>
      <ff-button class="btn-primary" text="Mettre à jour les scènes"></ff-button>
    </div>`

    const loginForm = html`<div class= "login-form">
        <h2>Me connecter</h2>
        <form id="userlogin" class="form-control form-modal" @submit=${this.onLoginSubmit}>
          <div class="form-group">
            <div class="form-item">
              <input type="text" autocomplete="username" name="username" id="username" placeholder="username" required>
              <label for="username">Nom d'utilisateur</label>
            </div>
          </div>
          <div class="form-group">
            <div class="form-item">
              <input type="password" autocomplete="current-password" name="password" id="password" placeholder="mot de passe" required>
              <label for="password">Mot de passe</label>
            </div>
          </div>
          <div class="form-group">
            <div class="form-item">
              <input class="ff-button ff-control btn-primary" type="submit" value="Me connecter" >
            </div>
          </div>
        </form>
      </div>`

    const logout = html`<div>
        <h2>Me déconnecter</h2>
        <ff-button text="Me déconnecter" @click=${this.onLogout}></ff-button>
      </div>`

    if(!this.isOpen){
      return html`<ff-button class="open-btn" @click=${this.onOpen} icon="cog"></ff-button>`
    }
    return html`<div class="settings">
      <ff-button class="open-btn" style="position:absolute; right:0; top:0" @click=${this.onClose} icon="close"></ff-button>
      <h1>Paramètres</h1>
      ${!this.isLogin? loginForm : updateFiles}
      <h2>Télécharger mes scènes locales</h2>
      <div class="files-list">
        ${filesList}
      </div>
      ${this.isLogin? logout : ""}

    </div>`;
  }

  onClose = ()=>{
    this.isOpen = false;
    this.classList.remove("visible")
  }
  onOpen = ()=>{
    this.isOpen = true;
    this.classList.add("visible")
  }

  onLoginSubmit = ()=>{
    this.isLogin = true;
  }

  onLogout = ()=>{
    this.isLogin = false;
  }
}