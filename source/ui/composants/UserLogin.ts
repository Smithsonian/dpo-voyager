
import { css, LitElement,customElement, property, html, TemplateResult } from "lit-element";


import { doLogin } from "../state/auth";
import i18n from "../state/translate";

import styles from '!lit-css-loader?{"specifier":"lit-element"}!sass-loader!../styles.scss';
import Notification from "@ff/ui/Notification";
import Modal from "./Modal";

/**
 * Main UI view for the Voyager Explorer application.
 */
 @customElement("user-login")
 export default class UserMenu extends i18n(LitElement)
 {
    @property()
    username :string;
    
    constructor()
    {
        super();
    }

    onLoginSubmit = (ev :MouseEvent)=>{
      ev.preventDefault();
      const username = ev.target["username"].value;
      const password = ev.target["password"].value;
      Modal.close();

      doLogin(username, password)
      .then(()=>{
        console.log("User logged-in succesfully");
      },(e)=>{
        Modal.close();
        console.log("Catch :", e);
        Notification.show(`Failed to login : ${e}`, "warning")
      })
    }

    protected render() :TemplateResult {
      return html`<form id="userlogin" class="form-control form-modal" @submit=${this.onLoginSubmit}>
      <div class="form-group">
        <div class="form-item">
          <input type="text" autocomplete="username" name="username" id="username" placeholder="${this.t("ui.username")}" required>
          <label for="username">${this.t("ui.username")}</label>
        </div>
      </div>
      <div class="form-group">
        <div class="form-item">
          <input type="password" autocomplete="current-password" name="password" id="password" placeholder="${this.t("ui.password")}" required>
          <label for="password">${this.t("ui.password")}</label>
        </div>
      </div>
      <div class="form-group">
        <div class="form-item">
          <input type="submit" value="${this.t("ui.login")}" >
        </div>
      </div>
    </form>`
    }
    static styles = [styles, css`
      :host {
        cursor: pointer;
      }
    `];
 
 }