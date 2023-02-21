
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
    @property()
    mode :"login"|"recover";

    #active = false;
    
    constructor()
    {
        super();
    }

    onLoginSubmit = (ev :MouseEvent)=>{
      ev.preventDefault();
      const username = ev.target["username"].value;
      const password = ev.target["password"].value;
      this.#active = true;
      doLogin(username, password)
      .then(()=>{
        console.log("User logged-in succesfully");
        this.dispatchEvent(new CustomEvent("close"));
      },(e)=>{
        console.log("Login failed :", e);
        Notification.show(`Failed to login : ${e}`, "warning")
      }).finally(()=> this.#active = false)
    }

    onRecoverSubmit = (ev :MouseEvent)=>{
      ev.preventDefault();
      const username = ev.target["username"].value;
      this.#active = true;
      fetch(`/api/v1/login/${username}/link`, {
        method: "POST",
      }).then(async (r)=>{
        if(!r.ok){
          try{
            throw new Error(`[${r.status}] ${(await r.json()).message}`);
          }catch(e){
            throw new Error(`[${r.status}] ${r.statusText}`);
          }
        }
      }).catch(e=>{
        console.log("Failed to send recovery link :", e);
        Notification.show(`Failed : ${e.message}`, "warning")
      }).finally(()=> this.#active = false)
    }

    private renderLogin(){
      return html`<form id="userlogin" class="form-control form-modal" ?disabled=${this.#active} @submit=${this.onLoginSubmit}>
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
            <input type="submit"  ?disabled=${this.#active} value="${this.t("ui.login")}" >
          </div>
        </div>
        <div style="text-align:right;">
          <a @click=${()=>this.mode = "recover"}>${this.t("ui.recoverPassword")}</a>
        </div>
      </form>`
    }

    private renderRecover(){
      return html`<form id="recoverPassword" class="form-control form-modal" ?disabled=${this.#active} @submit=${this.onRecoverSubmit}>
        <p>
          ${this.t("info.recoverPasswordLead")}
        </p>
        <div class="form-group">
          <div class="form-item">
            <input type="text" autocomplete="email" name="username" id="username" placeholder="${this.t("ui.email")}" required>
            <label for="username">${this.t("ui.username")} / ${this.t("ui.email")}</label>
          </div>
        </div>
        <div class="form-group">
          <div class="form-item">
            <input type="submit"  ?disabled=${this.#active} value="${this.t("ui.submit")}" >
          </div>
        </div>
      </form>`;
    }

    protected render() :TemplateResult {
      switch(this.mode){
        case "recover":
          return this.renderRecover();
        case "login":
        default:
          return this.renderLogin();
      }
    }
    static styles = [styles, css`
      :host {
        cursor: pointer;
      }
    `];
 
 }