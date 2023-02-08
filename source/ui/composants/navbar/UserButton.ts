
import { css, customElement, property, html, TemplateResult } from "lit-element";


import "../Modal";
import Modal from "../Modal";
import "../UserLogin"
import Button from "@ff/ui/Button";
import { doLogout } from "../../state/auth";
import i18n from "../../state/translate";

/**
 * Main UI view for the Voyager Explorer application.
 */
 @customElement("user-button")
 export default class UserMenu extends i18n(Button)
 {
    @property()
    username :string;
    
    constructor()
    {
        super();
    }

    onLoginOpen = ()=>{
      Modal.show({
        header: this.t("ui.login"),
        body: html`<user-login></user-login>`,
      });
    }

    onLogout = (ev :MouseEvent)=>{
      doLogout()
      .then(()=>Modal.close())
      .catch(e=>{
        Modal.show({
          header: "Failed to logout",
          body: e.message,
        });
      });
    }

    onUserDataOpen = (ev :MouseEvent)=>{
      const onChangePasswordSubmit = (ev :MouseEvent)=>{
        ev.preventDefault();
        alert("can't change password yet");
      }
      Modal.show({
        header: this.username,
        body: html`
          <h3>${this.t("ui.changePassword")}</h3>
          <form id="userlogin" class="form-control" @submit=${onChangePasswordSubmit}>
          <div class="form-group inline">
            <div class="form-item">
              <input type="password" name="password" id="password" placeholder="${this.t("ui.password")}" required>
              <label for="password">${this.t("ui.password")}</label>
            </div>
            <div class="divider"></div>
            <div class="form-item">
              <input type="password" name="password-confirm" id="password-confirm" placeholder="${this.t("ui.passwordConfirm")}" required>
              <label for="password-confirm">${this.t("ui.passwordConfirm")}</label>
            </div>
            <div class="divider"></div>
            <div class="form-item">
              <input type="submit" value="${this.t("ui.changePassword")}" >
            </div>
          </div>
        </form>
        `,
        buttons: html`<div style="padding-top:15px;">
          <ff-button text="${this.t("ui.logout")}" icon="cross" @click=${this.onLogout}></ff-button>
        </div>`
      });
    }

    protected render() :TemplateResult {
      if(!this.username){
        return html`<a @click=${this.onLoginOpen}>
          ${this.t("ui.login")}
        </a>`;
      }else{
        return html`<a @click=${this.onUserDataOpen}>${this.username}</a>`;
      }
    }
    static styles = css`
      :host {
        cursor: pointer;
      }
    `;
 
 }