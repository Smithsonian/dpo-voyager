import { LitElement, html, customElement, property, TemplateResult } from 'lit-element';

import Notification from "@ff/ui/Notification";

import styles from '!lit-css-loader?{"specifier":"lit-element"}!sass-loader!./styles.scss';

import "./globals.scss";

import "./composants/UploadButton";
import "./composants/navbar/NavLink";
import "./composants/navbar/Navbar";
import "./composants/navbar/UserButton";
import "./composants/navbar/ChangeLocale";
import "./screens/List";
import "./screens/Users";
import "./screens/SceneHistory";
import "./screens/FileHistory";
import "./screens/ApiDoc";
import "./composants/Modal";

interface Route{
  pattern :RegExp;
  content :(parent :MainView, params :Record<string,string>)=> TemplateResult;
}

import { getLogin, offLogin, onLogin, updateLogin, UserSession } from './state/auth';
import Modal from './composants/Modal';
import i18n from './state/translate';

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
  return new RegExp(`^/${parts.join("/")}\/?$`,"i")
}


@customElement("ecorpus-main")
export default class MainView extends i18n(LitElement){
  @property({type: Object})
  route :URL = new URL(window.location as any);

  @property({attribute: false})
  user :UserSession|undefined;

  static readonly routes :Route[]=  [
    {pattern: "/ui/", content: (parent :MainView)=>{
      let list_mode = "anonymous";
      if(parent.user?.isAdministrator) list_mode = "administrator";
      else if(parent.user?.username) list_mode = "user";
      return html`<corpus-list .mode=${list_mode}></corpus-list>`;
    }},
    {pattern: "/ui/doc/", content: ()=>html`<api-doc></api-doc>`},
    {pattern: "/ui/users/", content: (parent :MainView) => html`<users-list></users-list>`},
    {pattern: "/ui/scenes/:id/", content: (parent, params) => html`<scene-history scene="${params.id}"></scene-history>`},
    {pattern: "/ui/scenes/:id/files/:type/:name", content: (parent, params) => html`<file-history scene="${params.id}" type="${params.type}" name="${params.name}"></file-history>`},
  ].map(r=>({...r, pattern: toRegex(r.pattern)}));
  
  onLoginCallback = (user :UserSession)=>{
    console.log("onLogin : ", user);
    this.user = user;
  }

  connectedCallback(): void {
    super.connectedCallback();
    Notification.shadowRootNode = this.shadowRoot;
    this.user = getLogin();
    updateLogin().catch(e => {
      Modal.show({header: "Error", body: e.message});
    })
    onLogin(this.onLoginCallback);

    window.addEventListener("navigate", (ev :CustomEvent)=>{
      const url = new URL(ev.detail.href, this.route);
      console.log("Navigate to :",url);
      window.history.pushState({},"", url);
      this.route = url;
    });
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    offLogin(this.onLoginCallback);
  }

  renderContent(){
    for(let route of MainView.routes){
      let m = route.pattern.exec(this.route.pathname);
      if(!m) continue;
      return route.content(this, m.groups);
    }
    return html`<div><h1>${this.t("errors.404")}</h1><div>${this.t("errors.404_text", {route: this.route.pathname})}</div></div>`;
  }

  render() {
    let list_mode = "anonymous";
    if(this.user?.isAdministrator) list_mode = "administrator";
    else if(this.user?.username) list_mode = "user";

    return html`
      <corpus-navbar>
        <nav-link href="/ui/doc" text="Documentation"></nav-link>
        ${(this.user?.isAdministrator)?html`<nav-link text="${this.t("ui.administration")}" href="/ui/users" ></nav-link>`:""}
        <div class="divider"></div>
        <user-button .username=${this.user?.username}></user-button>
      </corpus-navbar>
      <main>
        ${this.renderContent()}
      </main>
      <footer>
        <div style="margin:auto">Holusion © <a href="mailto:contact@holusion.com">${this.t("ui.reportBug")}</a></div>
        <change-locale style="flex:none"></change-locale>
      </footer>
      <modal-dialog></modal-dialog>
      <div id="ff-notification-stack"></div>
    `;
  }
  static styles = [styles];
}
