
import { css, LitElement, customElement, property, html, TemplateResult, PropertyValues } from "lit-element";

import Notification from "@ff/ui/Notification";
import "../Modal";
import Modal from "../Modal";
import "../UserLogin"
import Button from "@ff/ui/Button";
import { doLogout, setSession, UserSession } from "../../state/auth";
import i18n from "../../state/translate";
import { navigate } from "../../state/router";

/**
 * Main UI view for the Voyager Explorer application.
 */
@customElement("user-button")
export default class UserMenu extends i18n(Button){
  @property()
  href = "/ui/user/";

  @property({type: Object})
  user :UserSession;
  
  constructor()
  {
      super();
  }

  override onClick = (ev :MouseEvent)=>{
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
      this.text = this.user?.username || this.t("ui.login");
      return true;
    }
    return s;
  }


 
}