
import { css, LitElement,customElement, property, html, TemplateResult } from "lit-element";


import "../Modal";
import Modal from "../Modal";
import Button from "@ff/ui/Button";
import { doLogin, doLogout } from "../state/auth";

/**
 * Main UI view for the Voyager Explorer application.
 */
 @customElement("user-button")
 export default class UserMenu extends Button
 {
    @property()
    username :string;
    
    constructor()
    {
        super();
    }

    onLoginOpen = ()=>{
      Modal.show({
        header: "Login",
        body: html`<form id="userlogin" class="form-control" @submit=${this.onLoginSubmit}>
          <div class="form-group">
            <div class="form-item">
              <input type="text" name="username" id="username" placeholder="Username" required>
              <label for="username">Username</label>
            </div>
          </div><div class="form-group">
            <div class="form-item">
              <input type="password" name="password" id="password" placeholder="Password" required>
              <label for="password">Password</label>
            </div>
          </div>
          <div class="form-group">
            <div class="form-item">
              <input type="submit" value="Connect" >
            </div>
          </div>
        </form>`,
      });
    }

    onLoginSubmit = (ev :MouseEvent)=>{
      ev.preventDefault();
      const username = ev.target["username"].value;
      const password = ev.target["password"].value;
      Modal.close();
      Modal.show({
        header: "Connecting",
        body: html`...`,
      });
      
      doLogin(username, password)
      .then(()=>{
        console.log("User logged-in succesfully");
        Modal.close()
      },(e)=>{
        console.log("Catch :", e);
        Modal.close();
        Modal.show({
          header:"Failed to login", 
          body:e.message
        });
      })
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
          <h3>Change password</h3>
          <form id="userlogin" class="form-control" @submit=${onChangePasswordSubmit}>
          <div class="form-group inline">
            <div class="form-item">
              <input type="password" name="password" id="password" placeholder="Password" required>
              <label for="password">Password</label>
            </div>
            <div class="divider"></div>
            <div class="form-item">
              <input type="password" name="password-confirm" id="password-confirm" placeholder="Confirm Password" required>
              <label for="password-confirm">Password Confirm</label>
            </div>
            <div class="divider"></div>
            <div class="form-item">
              <input type="submit" value="Change Password" >
            </div>
          </div>
        </form>
        `,
        buttons: html`<div style="padding-top:15px;">
          <ff-button text="logout" icon="cross" @click=${this.onLogout}></ff-button>
        </div>`
      });
    }

    protected render() :TemplateResult {
      if(!this.username){
        return html`<a @click=${this.onLoginOpen}>
          login
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