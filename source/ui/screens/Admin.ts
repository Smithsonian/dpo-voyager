
import { customElement, property, html, TemplateResult, LitElement, css } from "lit-element";

import "@ff/ui/Button";

import "client/ui/Spinner";
import Modal from "../composants/Modal";
import "../composants/SceneCard";
import HttpError from "../state/HttpError";
import Icon from "@ff/ui/Icon";
import { nothing } from "lit-html";
import Notification from "@ff/ui/Notification";
import i18n from "../state/translate";

interface User {
    uid :string;
    username :string;
    isAdministrator :boolean;
}

Icon.add("trash", html`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M192 188v216c0 6.627-5.373 12-12 12h-24c-6.627 0-12-5.373-12-12V188c0-6.627 5.373-12 12-12h24c6.627 0 12 5.373 12 12zm100-12h-24c-6.627 0-12 5.373-12 12v216c0 6.627 5.373 12 12 12h24c6.627 0 12-5.373 12-12V188c0-6.627-5.373-12-12-12zm132-96c13.255 0 24 10.745 24 24v12c0 6.627-5.373 12-12 12h-20v336c0 26.51-21.49 48-48 48H80c-26.51 0-48-21.49-48-48V128H12c-6.627 0-12-5.373-12-12v-12c0-13.255 10.745-24 24-24h74.411l34.018-56.696A48 48 0 0 1 173.589 0h100.823a48 48 0 0 1 41.16 23.304L349.589 80H424zm-269.611 0h139.223L276.16 50.913A6 6 0 0 0 271.015 48h-94.028a6 6 0 0 0-5.145 2.913L154.389 80zM368 128H80v330a6 6 0 0 0 6 6h276a6 6 0 0 0 6-6V128z"/></svg>`);
Icon.add("plus",  html`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M256 80c0-17.7-14.3-32-32-32s-32 14.3-32 32V224H48c-17.7 0-32 14.3-32 32s14.3 32 32 32H192V432c0 17.7 14.3 32 32 32s32-14.3 32-32V288H400c17.7 0 32-14.3 32-32s-14.3-32-32-32H256V80z"/></svg>`)
Icon.add("email", html`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M464 64H48C21.49 64 0 85.49 0 112v288c0 26.51 21.49 48 48 48h416c26.51 0 48-21.49 48-48V112c0-26.51-21.49-48-48-48zm0 48v40.805c-22.422 18.259-58.168 46.651-134.587 106.49-16.841 13.247-50.201 45.072-73.413 44.701-23.208.375-56.579-31.459-73.413-44.701C106.18 199.465 70.425 171.067 48 152.805V112h416zM48 400V214.398c22.914 18.251 55.409 43.862 104.938 82.646 21.857 17.205 60.134 55.186 103.062 54.955 42.717.231 80.509-37.199 103.053-54.947 49.528-38.783 82.032-64.401 104.947-82.653V400H48z"/></svg>`);
Icon.add("key", html`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 96 960 960"><path d="M280 640.614q-26.846 0-45.73-18.884-18.884-18.884-18.884-45.73 0-26.846 18.884-45.73 18.884-18.884 45.73-18.884 26.846 0 45.73 18.884 18.884 18.884 18.884 45.73 0 26.846-18.884 45.73-18.884 18.884-45.73 18.884Zm0 155.385q-91.538 0-155.768-64.231-64.23-64.23-64.23-155.768t64.23-155.768q64.23-64.231 155.768-64.231 64.307 0 116.307 33.193 52 33.192 79.384 86.807h360.078L935.767 576 781.923 729.075l-74.23-55.769-76.154 56.538-78.076-53.845h-77.772q-27.384 53.23-79.384 86.615T280 795.999ZM280 736q57.539 0 99.654-34.769 42.115-34.77 54.961-85.231h137.694l57.615 39.846 78.154-57.153L776 650.615 850.616 576l-40-40H434.615q-12.846-50.461-54.961-85.231Q337.539 416 280 416q-66 0-113 47t-47 113q0 66 47 113t113 47Z"/></svg>`)

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