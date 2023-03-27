import { LitElement, html, customElement } from 'lit-element';

import Notification from "@ff/ui/Notification";

import styles from '!lit-css-loader?{"specifier":"lit-element"}!sass-loader!./styles.scss';

import "./globals.scss";

import "./composants/UploadButton";
import "./composants/navbar/NavLink";
import "./composants/navbar/Navbar";
import "./composants/navbar/UserButton";
import "./composants/navbar/ChangeLocale";
import "./screens/List";
import "./screens/Admin";
import "./screens/SceneHistory";
import "./screens/FileHistory";
import "./screens/UserSettings";
import "./composants/Modal";

import { updateLogin, withUser } from './state/auth';
import Modal from './composants/Modal';
import i18n from './state/translate';
import { route, router } from './state/router';

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
export default class MainView extends router(i18n(withUser(LitElement))){
  @route()
  static "/ui/" =({search})=> html`<corpus-list .compact=${(search as URLSearchParams).has("compact")}></corpus-list>`;
  @route()
  static "/ui/scenes/" =({search})=> html`<corpus-list .compact=${(search as URLSearchParams).has("compact")}></corpus-list>`;
  @route()
  static "/ui/user/" = ()=> html`<user-settings></user-settings>`
  @route()
  static "/ui/users/" = ()=> html`<users-list></users-list>`;
  @route()
  static "/ui/scenes/:id/" = ({parent, params}) => html`<scene-history scene="${params.id}"></scene-history>`;

  connectedCallback(): void {
    super.connectedCallback();
    Notification.shadowRootNode = this.shadowRoot;
    updateLogin().catch(e => {
      Modal.show({header: "Error", body: e.message});
    });
  }

  render() {
    return html`
      <corpus-navbar>
        <nav-link href="https://ethesaurus.holusion.com" text="Documentation" transparent></nav-link>
        ${(this.user?.isAdministrator)?html`<nav-link text="${this.t("ui.administration")}" href="/ui/users" transparent></nav-link>`:""}
        <div class="divider"></div>
        <user-button .user=${this.user}></user-button>
      </corpus-navbar>
      <main>
        ${this.renderContent()}
      </main>
      <footer>
        <div style="margin:auto">Holusion © <a href="https://github.com/Holusion/e-thesaurus/blob/main/LICENSE.md">Apache License</a> | <a href="mailto:contact@holusion.com">${this.t("ui.reportBug")}</a></div>
        <change-locale style="flex:none"></change-locale>
      </footer>
      <modal-dialog></modal-dialog>
      <div id="ff-notification-stack"></div>
    `;
  }
  static styles = [styles];
}
