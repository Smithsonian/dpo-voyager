
import { customElement, property, html, TemplateResult, LitElement, css } from "lit-element";

import "@ff/ui/Button";

import "client/ui/Spinner";
import Modal from "../composants/Modal";
import "../composants/SceneCard";
import HttpError from "../state/HttpError";
import "../composants/Icon";
import { nothing } from "lit-html";
import Notification from "@ff/ui/Notification";
import i18n from "../state/translate";

interface User {
    uid :string;
    username :string;
    isAdministrator :boolean;
}

/**
 * Main UI view for the Voyager Explorer application.
 */
 @customElement("users-list")
 export default class AdminScreen extends i18n(LitElement)
 {
    @property({type: Array})
    list : User[];

    @property({attribute: false, type: Boolean})
    loading =true;

    @property({attribute: false, type: Object})
    error :Error;

    constructor()
    {
        super();
    }
    createRenderRoot() {
        return this;
    }
      
    public connectedCallback(): void {
        super.connectedCallback();
        this.fetchUsers();
    }
    
    fetchUsers() : void{
        this.loading = true;
        fetch("/api/v1/users")
        .then(HttpError.okOrThrow)
        .then(async (r)=>{
            this.list = await r.json();
        }).catch((e)=>{
            console.error(e);
            this.error = e;
        })
        .finally(()=> this.loading = false);
    }
    onCreateUser = (ev :MouseEvent)=>{
        ev.preventDefault();
        const username = ev.target["username"].value;
        const email = ev.target["email"].value;
        const password = ev.target["password"].value;
        const isAdministrator = ev.target["isAdministrator"].checked;
        (ev.target as HTMLFormElement).reset();
        Modal.close();
        console.log("create user : ", username, password, isAdministrator, email);
        fetch("/api/v1/users", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({username, password, isAdministrator, email})
        }).then(HttpError.okOrThrow)
        .then(()=>this.fetchUsers())
        .catch(e=>{
            console.error(e);
            Modal.show({
                header: this.t("error.createUser"),
                body: "Message : "+e.message,
            });
        });
    }
    onDeleteUser = (ev :MouseEvent, u :User)=>{
        ev.preventDefault();
        fetch(`/api/v1/users/${u.uid}`, {
            headers: {"Content-Type": "application/json"},
            method: "DELETE"
        }).then(HttpError.okOrThrow)
        .then(()=>this.fetchUsers())
        .then(()=>Notification.show(`User ${u.username} Deleted`, "info"))
        .catch(e=>{
            console.error(e);
            Modal.show({
                header: "Error deleting user",
                body: "Message : "+e.message,
            });
        });
        Modal.close();
    }

    deleteUserOpen(u :User){
        Modal.show({
            header: "Delete user",
            body: html`<div>${this.t("info.userDeleteConfirm", {username : u.username})}</div>`,
            buttons: html`<div style="display:flex;padding-top:30px;">
                <ff-button class="btn-primary" text="cancel" @click=${Modal.close}></ff-button>
                <ff-button class="btn-danger" text="delete" @click=${(ev)=>this.onDeleteUser(ev, u)}><ff-button>
            </div>`
        });
    }

    createUserOpen(){
        Modal.show({
            header: this.t("ui.createUser"),
            body: html`<form id="userlogin" autocomplete="off" class="form-control form-modal" @submit=${this.onCreateUser}>
                <div class="form-item">
                    <input type="text" name="username" id="username" autocomplete="off" placeholder=${this.t("ui.username")} required>
                    <label for="username">${this.t("ui.username")}</label>
                </div>
                <div class="form-group">
                    <div class="form-item">
                        <input type="email" name="email" id="email" placeholder=${this.t("ui.email")} required>
                        <label for="email">${this.t("ui.email")}</label>
                    </div>
                </div>
                <div class="form-item">
                    <input type="password" name="password" id="password" autocomplete="new-password" placeholder=${this.t("ui.password")} required>
                    <label for="password">${this.t("ui.password")}</label>
                </div>
            </div>
                <div class="form-group">
                    <div class="form-checkbox">
                        <input type="checkbox" name="isAdministrator" id="isAdministrator">
                        <label for="isAdministrator">${this.t("ui.isAdministrator")}</label>
                    </div>
                </div>
                <div class="form-item" style="margin-top: 15px">
                    <input type="submit" value=${this.t("ui.create")} >
                </div>
            </form>`,
          });
    }

    protected render() :TemplateResult {
        if(this.error){
            return html`<h1>Error</h1><div>${this.error.message}</div>`;
        }else if(this.loading){
            return html`<div style="margin-top:10vh"><sv-spinner visible/></div>`
        }
        return html`<div>
            <div class="users-list" style="position:relative;">
                <h1>${this.t("ui.users")}</h1>
                <table class="list-table">
                    <thead><tr>
                        <th>uid</th>
                        <th>${this.t("ui.username")}</th>
                        <th>
                            admin?
                        </th>
                        <th>
                            <div style="display:flex;justify-content:end;margin: -15px -10px;">
                                <div style="display:block;flex-grow:0;">
                                    <ff-button class="btn-secondary" icon="plus" @click=${this.createUserOpen}></ff-button>
                                </div>
                            </div>
                        </th>
                    </tr></thead>
                    <tbody>
                    ${(!this.list?.length)?html`<tr><td colspan=4 style="text-align: center;">No user registered. Click the <ff-icon name="plus"></ff-icon> to add one</td</tr>`:nothing}
                    ${this.list.map(u=>html`<tr>
                        <td style="font-family:monospace;">${u.uid}</td>
                        <td>${u.username}</td>
                        <td><input type="checkbox" .checked=${u.isAdministrator} disabled></td>
                        <td>
                            <div style="display:flex; justify-content:end;gap:.6rem;">
                            <ff-button class="secondary" style=${u.isAdministrator ? "color:var(--color-danger);opacity:0.5":"color:var(--color-danger)"} inline icon="trash" @click=${()=>this.deleteUserOpen(u)} ?disabled=${u.isAdministrator}></ff-button>
                            <ff-button class="secondary" style="color:var(--color-light);opacity:0.8" inline icon="key" @click=${()=>this.createLoginLink(u)}></ff-button>
                            </div>
                        </td>
                    </tr>`)}
                    </tbody>
                </table>
            </div>
            <div>
                <h1>${this.t("ui.tools")}</h1>
                <ul>
                    <li>
                        <a  download href="/api/v1/scenes?format=zip">Download scenes as Zip</a>
                    </li>
                </ul>
            </div>
        </div>`;
    }
    createLoginLink(u :User){
        fetch(`/api/v1/login/${u.username}/link`, {
            method: "GET",
            headers: {
                "Content-Type": "text/plain"
            },
        }).then(async r=>{
            if(!r.ok) throw new Error(`[${r.status}] ${r.statusText}`);
            await navigator.clipboard.writeText(await r.text());
            Notification.show("Login link copied to clipboard", "info");
        }).catch(e=>{
            console.error(e);
            return Notification.show(`Failed to create login link : ${e.message}`, "error");
        })
    }
 }