import { customElement, property, html, TemplateResult, LitElement, css } from "lit-element";
import Notification from "@ff/ui/Notification";
import { doLogout, setSession, withUser, UserSession } from "../state/auth";
import i18n from "../state/translate";



@customElement("user-settings")
export default class UserSettings extends i18n(withUser(LitElement)) {
  
  createRenderRoot() {
      return this;
  }

  public connectedCallback(): void {
    super.connectedCallback();
  }

  protected render() {

    console.log("Render userSettings : ", this.user);

    if(!this.user){
      return html`<div style="margin:auto; max-width:500px">
        <user-login></user-login>
      </div>`;
    }
    return html`
    <div class="user-form">
      <h1>${this.t("ui.userSettings")}</h1>

      <form id="userlogin" class="form-control" style="max-width:500px" @submit=${this.onChangeUserSubmit}>
      <div class="form-group">
        <h2>Modifier le profil</h2>
      </div>
        <div class="form-group">
          <div class="form-item">
            <label for="username">${this.t("ui.username")}</label>
            <input type="text" autocomplete="username" name="username" id="username" placeholder="username" value="${this.user.username || ""}">
          </div>
        </div>
        <div class="form-group">
          <div class="form-item">
            <label for="email">${this.t("ui.email")}</label>
            <input type="email" autocomplete="email" name="email" id="email" placeholder="email" value="${this.user.email || ""}">
          </div>
        </div>
        <div class="form-group">
            <input class="ff-button ff-control btn-primary" style="padding:8px; width:100%" type="submit" value=${this.t("ui.saveChanges")}>
        </div>
      </form>

      <form id="userlogin" class="form-control" style="max-width:500px" @submit=${this.onChangePasswordSubmit}>
        <div class="form-group">
          <h2>${this.t("ui.changePassword")}</h2>
        </div>
        <div class="form-group">
          <div class="form-item">
            <label for="password">${this.t("ui.password")}</label>
            <input type="password" autocomplete="new-password" name="password" id="password" placeholder="${this.t("ui.password")}" required>
          </div>
        <div class="form-group">
        </div>
          <div class="form-item">
            <label for="password-confirm">${this.t("ui.passwordConfirm")}</label>
            <input type="password" autocomplete="new-password" name="password-confirm" id="password-confirm" placeholder="${this.t("ui.passwordConfirm")}" required>
          </div>
        <div class="form-group">
        </div>
          <div>
            <input class="ff-button ff-control btn-primary" style="padding:8px; width:100%" type="submit" name="password-submit" value="${this.t("ui.changePassword")}">
          </div>
        </div>
      </form>

      <div style="padding-top:15px; max-width:500px">
        <h2>${this.t("ui.logout")}</h2>
        <ff-button text="${this.t("ui.logout")}" icon="cross" @click=${this.onLogout}></ff-button>
      </div>
    </div>`;
  }

  onChangePasswordSubmit = (ev :MouseEvent)=>{
    ev.preventDefault();
    let form = ev.target as HTMLFormElement;
    if(form["password"].value != form["password-confirm"].value) return Notification.show("Passwords must match", "error");
    this.onChangeUserSubmit(ev);
  }

  onChangeUserSubmit = (ev :MouseEvent)=>{
    ev.preventDefault();
    let form = ev.target as HTMLFormElement;
    let patch = {};
    for(let key of ["email", "username", "password"]){
      if(!form[key]?.value ||  form[key]?.value === this.user[key]) continue;
      patch[key]= form[key].value;
    }
    if(!Object.keys(patch).length){
      return Notification.show("Nothing to change", "info");
    }
    fetch(`/api/v1/users/${this.user.uid}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify(patch),
    }).then(async r=>{
      if(!r.ok) throw new Error(`[${r.status}] ${r.statusText}`);
      let user = await r.json();
      setSession(user);
      Notification.show("Done", "info");
    }).catch(e=>{
      console.error(e);
      Notification.show(`Save failed : ${e.message}`);
    });
  }

  onLogout = (ev :MouseEvent)=>{
    doLogout()
    .catch(e=>{
      Notification.show("Failed to logout "+ e.message, "error");
    });
    window.dispatchEvent(new CustomEvent("navigate", {detail: {href: "/ui/scenes/"}}));
  }
  static styles = []
}