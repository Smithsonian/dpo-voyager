import { LitElement, property, customElement, html } from "lit-element";
import Notification from "@ff/ui/Notification";


interface User {
  username :string;
}

@customElement("settings-view")
export default class SettingsView extends LitElement 
{
  #c = new AbortController();
  private files : Array<string>;
  
  @property({type: Boolean })
  isOpen: boolean = false;

  @property({type: Object })
  user :User|null|undefined;

  @property({type: Boolean, attribute: false})
  isLoading :boolean = false;

  @property({type: Boolean, attribute: false})
  online :boolean;

  protected createRenderRoot(): Element | ShadowRoot {
    return this;
  }
  
  connectedCallback() {
    super.connectedCallback();
    this.classList.add("settings-view");

    this.updateOnlineStatus();
    window.addEventListener("online", this.updateOnlineStatus);
    window.addEventListener("offline", this.updateOnlineStatus);
  }

  disconnectedCallback(){
    super.disconnectedCallback();
    window.removeEventListener("online", this.updateOnlineStatus);
    window.removeEventListener("offline", this.updateOnlineStatus);
  }

  async getLoginState(){
    if(!this.online) return this.user = null;
    let r = await fetch("/login")
    if(r.status !== 200 ) return this.user = null;
    return this.user = await r.json();
  }

  async refresh(){
    this.#c.abort();
    if(!this.isOpen) return;
    this.isLoading = true;
    this.#c = new AbortController();
    await Promise.all([
      this.getLoginState(),
      fetch("/files/list", {signal: this.#c.signal}).then(async (res)=>{
        if(!res.ok) throw new Error(`[${res.status}]: ${res.statusText}`);
        this.files = await res.json();
      })
    ])
    .catch(e=>{
      console.error(e);
      Notification.show("Refresh error : "+e.message, "error");
    })
    .finally(()=>this.isLoading = false);
  }


  protected update(_changedProperties: Map<string | number | symbol, unknown>): void {
    if(_changedProperties.has("isOpen")){
      this.refresh();
    }
    return super.update(_changedProperties);
  }

  protected render()
  {
    if(!this.isOpen){
      return html`<ff-button class="open-btn" @click=${this.onOpen} icon="cog"></ff-button>`
    }else if(this.isLoading){
      return html`<div class="settings">
        <ff-button class="open-btn" style="position:absolute; right:0; top:0" @click=${this.onClose} icon="close"></ff-button>
        <sv-spinner visible></sv-spinner>
      </div>`;
    }

    const filesList = ((this.files?.length)?
      html`${this.files.map(file=> html`<ff-button icon="file" name=${file} text=${file} @click=${this.onCopyFile}></ff-button>`)}`:
      html`<div style="text-align:center;font-size:150%;padding: 2rem;">Aucun fichier trouvé</div>`);

    const updateFiles = html`<div>
      <h2>Synchroniser mes données</h2>
      <ff-button class="btn-primary" @click=${this.onSynchronize} text="Mettre à jour les scènes"></ff-button>
    </div>`

    const loginForm = (this.online? html`<div class= "login-form">
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
      </div>`: null);

    const logout = html`<div>
        <h2>Me déconnecter</h2>
        <ff-button text="Me déconnecter" @click=${this.onLogout}></ff-button>
      </div>`

    return html`<div class="settings">
      <ff-button class="open-btn" style="position:absolute; right:0; top:0" @click=${this.onClose} icon="close"></ff-button>
      <h1>Paramètres</h1>
      ${this.user? updateFiles:loginForm}
      <h2>Copier un fichier local</h2>
      <div class="files-list">
        ${filesList}
      </div>
      ${this.user? logout : null}
      <div style="padding-top: 3rem;">
        <a class="ff-button ff-control" href="/">Recharger la page</a>
      </div>

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

  onLoginSubmit = (ev :MouseEvent)=>{
    ev.preventDefault();
    let target = ev.target as HTMLFormElement;
    let username = target.username.value;
    let password = target.password.value;
    console.log("Log in", username, password);
    this.isLoading = true;
    let u = new URL("/login", window.location.href);
    u.searchParams.set("username", username);
    u.searchParams.set("password", password);
    fetch(u, {
      method: "POST",
      headers:{
        "Content-Type":"application/json",
        "Accept": "application/json",
      }
    }).then(async (r)=>{
      let body = await r.json();
      if(!r.ok) throw new Error(`[${r.status}] ${body.message ?? body}`);
      this.user = body;
      console.log("Content : ", await r.text());
    }).catch((e)=>{
      console.error(e);
      Notification.show(`Failed to log in: ${e.message}`, "error");
    }).finally(()=> this.isLoading = false);
  }

  onLogout = ()=>{
    Notification.show("Unsupported", "error");
  }

  onCopyFile = (ev :MouseEvent)=>{
    let name = (ev.target as HTMLButtonElement).name;
    this.isLoading = true;
    fetch(`/files/copy/${name}`, {method: "POST"}).then(async r=>{
      if(!r.ok) throw new Error(`[${r.status}] ${await r.text()}`);
      console.log("Copy done");
      this.dispatchEvent(new CustomEvent("change"));
      this.onClose();
    }).catch( e =>{
      Notification.show(`impossible de copier ${name}: ${e.message}`, "error" );
    }).then(()=>this.isLoading = false);
  }

  onSynchronize = ()=>{
    fetch("/files/fetch" );
  }

  updateOnlineStatus = ()=>{
    this.online = false /*navigator.onLine; */
  }
}