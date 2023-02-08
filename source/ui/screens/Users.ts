
import { customElement, property, html, TemplateResult, LitElement, css } from "lit-element";

import "@ff/ui/Button";

import "client/ui/Spinner";
import Modal from "../composants/Modal";
import "../composants/SceneCard";
import HttpError from "../state/HttpError";
import Icon from "@ff/ui/Icon";
import { nothing } from "lit-html";

interface User {
    uid :string;
    username :string;
    isAdministrator :boolean;
}

Icon.add("trash", html`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M192 188v216c0 6.627-5.373 12-12 12h-24c-6.627 0-12-5.373-12-12V188c0-6.627 5.373-12 12-12h24c6.627 0 12 5.373 12 12zm100-12h-24c-6.627 0-12 5.373-12 12v216c0 6.627 5.373 12 12 12h24c6.627 0 12-5.373 12-12V188c0-6.627-5.373-12-12-12zm132-96c13.255 0 24 10.745 24 24v12c0 6.627-5.373 12-12 12h-20v336c0 26.51-21.49 48-48 48H80c-26.51 0-48-21.49-48-48V128H12c-6.627 0-12-5.373-12-12v-12c0-13.255 10.745-24 24-24h74.411l34.018-56.696A48 48 0 0 1 173.589 0h100.823a48 48 0 0 1 41.16 23.304L349.589 80H424zm-269.611 0h139.223L276.16 50.913A6 6 0 0 0 271.015 48h-94.028a6 6 0 0 0-5.145 2.913L154.389 80zM368 128H80v330a6 6 0 0 0 6 6h276a6 6 0 0 0 6-6V128z"/></svg>`);
Icon.add("plus",  html`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M256 80c0-17.7-14.3-32-32-32s-32 14.3-32 32V224H48c-17.7 0-32 14.3-32 32s14.3 32 32 32H192V432c0 17.7 14.3 32 32 32s32-14.3 32-32V288H400c17.7 0 32-14.3 32-32s-14.3-32-32-32H256V80z"/></svg>`)

/**
 * Main UI view for the Voyager Explorer application.
 */
 @customElement("users-list")
 export default class UsersList extends LitElement
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
        const password = ev.target["password"].value;
        const isAdministrator = ev.target["isAdministrator"].checked;
        (ev.target as HTMLFormElement).reset();
        Modal.close();
        console.log("create user : ", username, password, isAdministrator);
        fetch("/api/v1/users", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({username, password, isAdministrator})
        }).then(HttpError.okOrThrow)
        .then(()=>this.fetchUsers())
        .catch(e=>{
            console.error(e);
            Modal.show({
                header: "Error creating user",
                body: "Message : "+e.message,
            });
        });
    }

    createUserOpen(){
        Modal.show({
            header: "Create new user",
            body: html`<form id="userlogin" autocomplete="off" class="form-control" @submit=${this.onCreateUser}>
              <div class="form-item">
                <input type="text" name="username" id="username" autocomplete="off" placeholder="Username" required>
                <label for="username">Username</label>
              </div>
              <div class="form-item">
                <input type="password" name="password" id="password" autocomplete="new-password" placeholder="Password" required>
                <label for="password">Password</label>
              </div>
              <input type="checkbox" name="isAdministrator" id="isAdministrator">
              <div class="form-item">
                <input type="submit" value="Connect" >
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
        return html`<div class="users-list" style="position:relative;">
            <table class="list-table">
                <thead><tr>
                    <th>uid</th>
                    <th>username</th>
                    <th>
                        admin?
                    </th>
                    <th>
                        <div style="display:flex;justify-content:end">
                            <div style="display:block;flex-grow:0;">
                                <ff-button class="secondary" inline icon="plus" @click=${this.createUserOpen}></ff-button>
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
                    <td><ff-button class="secondary" style="color:var(--color-dark);opacity:0.8" inline icon="trash" @click=${this.createUserOpen} disabled></ff-button></td>
                </tr>`)}
                </tbody>
            </table>
        </div>`;
    }
 }