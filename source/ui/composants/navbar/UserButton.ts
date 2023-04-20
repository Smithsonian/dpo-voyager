
import { customElement, property, html, PropertyValues, css } from "lit-element";

import "../Modal";
import Modal from "../Modal";
import "../UserLogin"
import { UserSession } from "../../state/auth";
import i18n from "../../state/translate";
import { navigate } from "../../state/router";
import NavLink from "./NavLink";

/**
 * Main UI view for the Voyager Explorer application.
 */
@customElement("user-button")
export default class UserMenu extends i18n(NavLink){
  @property()
  href = "/ui/user/";

  @property({type: Object})
  user :UserSession;
  
  constructor()
  {
      super();
  }

  connectedCallback(): void {
    super.connectedCallback();
    this.innerHTML = this.user?.username || this.t("ui.login");
  }

  override onClick = (ev :MouseEvent)=>{
    ev.preventDefault();
    if(this.user?.username){
      navigate(this);
    }else{
      Modal.show({
        header: this.t("ui.login"),
        body: html`<user-login @close=${()=>Modal.close()}></user-login>`,
      });
    }
    return false;
  }

  protected shouldUpdate(changedProperties: PropertyValues)
  {
    let s = super.shouldUpdate(changedProperties);
    if(changedProperties.has("user") || changedProperties.has("language")){
      this.innerHTML = this.user?.username || this.t("ui.login");
      return true;
    }
    return s;
  }
 
}