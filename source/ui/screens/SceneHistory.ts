
import { css, customElement, property, html, TemplateResult, LitElement } from "lit-element";

import Notification from "@ff/ui/Notification";
import "@ff/ui/Dropdown";
import "@ff/ui/Button";

import "client/ui/Spinner";

import "../Size";
import { nothing } from "lit-html";
import i18n from "../state/translate";
import {getLogin} from "../state/auth";
import { navigate } from "../state/router";


const AccessTypes = [
  "none",
  "read",
  "write",
  "admin"
] as const;


interface ItemEntry{
  name :string;
  id :number;
  generation :number;
  ctime :string;
  author_id :number;
  author :string;
  size :number;
}

interface AccessRights{
  uid :number;
  username :string;
  access :typeof AccessTypes[number];
}

/**
 * Specialized container to arrange scene entries into groups
 * 
*/
class SceneVersion{
  start :Date;
  end :Date;
  names :Set<string> = new Set();
  authors :Set<string> = new Set();
  entries :Array<ItemEntry> = [];
  size :number = 0;
  constructor(first :ItemEntry){
    this.start = new Date(first.ctime);
    this.add(first);
  }
  /**Time diff between two entries in milliseconds */
  diff(i:ItemEntry){
    return (new Date(i.ctime).valueOf() - this.start.valueOf());
  }
  accepts(i:ItemEntry){
    if(this.names.has(i.name)) return false;
    if( 1000*60*60*24 /*24 hours */ < (this.diff(i))) return false;
    if(!this.authors.has(i.author) && 3 <=this.authors.size) return false;
    return true;
  }
  add(i:ItemEntry){
    this.names.add(i.name);
    this.authors.add(i.author);
    this.end = new Date(i.ctime);
    this.size += i.size
    this.entries.push(i);
  }
}



/**
 * Main UI view for the Voyager Explorer application.
 */
 @customElement("scene-history")
 export default class SceneHistory extends i18n(LitElement)
 {
    @property()
    scene :string;
    @property({attribute: false, type:Array})
    versions : SceneVersion[];

    @property({attribute: false, type:Array})
    permissions :AccessRights[] =[];

    constructor()
    {
        super();
    }
    createRenderRoot() {
        return this;
    }
      
    public connectedCallback(): void {
        super.connectedCallback();
        this.fetchScene();
        this.fetchPermissions();
    }
    async fetchPermissions(){
      await fetch(`/api/v1/scenes/${this.scene}/permissions`).then(async (r)=>{
        if(!r.ok) throw new Error(`[${r.status}]: ${r.statusText}`);
        let body = await r.json();
        this.permissions = body as AccessRights[];
      }).catch((e)=> {
        console.error(e);
        Notification.show(`Failed to fetch scene history: ${e.message}`, "error");
      });
    }
    
    async fetchScene(){
      await fetch(`/api/v1/scenes/${this.scene}/history`).then(async (r)=>{
        if(!r.ok) throw new Error(`[${r.status}]: ${r.statusText}`);
        let body = await r.json();
        this.versions = this.aggregate(body as ItemEntry[]);
      }).catch((e)=> {
        console.error(e);
        Notification.show(`Failed to fetch scene history: ${e.message}`, "error");
      });
    }

    aggregate(entries :ItemEntry[]) :SceneVersion[]{
      if(!entries || entries.length == 0) return [];
      let versions = [new SceneVersion(entries.pop())];
      let last_ref = versions[0];
      while(entries.length){
        let entry = entries.pop();
        if(!last_ref.accepts(entry) ){
          last_ref = new SceneVersion(entry);
          versions.push(last_ref);
        }else{
          last_ref.add(entry);
        }
      }
      return versions.reverse();
    }

    protected render() :TemplateResult {
        if(!this.versions){
          return html`<div style="margin-top:10vh"><sv-spinner visible/></div>`;
        }else if (this.versions.length == 0){
          return html`<div style="padding-bottom:100px;padding-top:20px;" >
              <h1></h1>
          </div>`;
        }
        let articles = new Set();
        for(let version of this.versions){
          for(let name of version.names){
            if(name.startsWith("articles/")) articles.add(name);
          }
        }
        let size = this.versions.reduce((s, v)=>s+v.size, 0);
        
        return html`<div>
          <h1>${this.scene}</h1>
          <div style="display:flex;flex-wrap:wrap;">
            <div style="flex-grow: 1; min-width:300px;">
              <h3>Total size: <b-size b=${size}></b-size></h3>
              <h3>${articles.size} article${(1 < articles.size?"s":"")}</h3>
              <div style="max-width: 300px">
                <a class="ff-button ff-control btn-primary" href=${`/ui/scenes/${encodeURIComponent(this.scene)}/edit?lang=${this.language.toUpperCase()}`}>${this.t("ui.editScene")}</a>
                <a class="ff-button ff-control btn-primary" style="margin-top:10px" href=${`/ui/scenes/${encodeURIComponent(this.scene)}/view?lang=${this.language.toUpperCase()}`}>${this.t("ui.viewScene")}</a>  
              </div>
            </div>
            <div style="min-width:300px;">
              ${this.renderPermissions()}
            </div>
          </div>
        </div>
        <div>
          ${this.renderHistory()}
        </div>
        ${getLogin()?.isAdministrator? html`<div style="padding: 10px 0;display:flex;color:red;justify-content:end;">
        <div><ff-button class="btn-danger" icon="trash" text="Delete" @click=${this.onDelete}</div>
        </div>`:null}
      </div>`;
    }
    renderPermissions(){
      return html`
        <h2>${this.t("ui.access")}</h2>
          <table class="list-table">
            <thead><tr>
              <th>${this.t("ui.username")}</th>
              <th>${this.t("ui.rights")}</th>
            </tr></thead>
            <tbody>
            ${((!this.permissions?.length)?html`<tr>
              <td colspan=4 style="text-align: center;">
                ${this.t("info.noData",{item: this.scene})}
              </td>
            </tr>`:nothing)}
            ${this.permissions.map((p, index) => {
              return html`<tr>
                <td title="${p.uid}">${p.username}</td>
                <td class="form-control">${this.renderPermissionSelection(p.username, p.access)}</td>
            </tr>`
            })}
              <tr>
                <td colspan=2 class="form-control" style="padding:0">
                  <form id="userlogin" style="padding:0" autocomplete="off" @submit=${this.onAddUserPermissions}>
                    <div class="form-group inline" style="padding:0;border:none;">
                      <div class="form-item" style="width:100%">
                        <input style="border:none;" type="text" name="username" id="username" placeholder="${this.t("ui.username")}" required>
                      </div>
                      <div class="form-item">
                        <input style="border:none;" type="submit" value="${this.t("ui.add")}" >
                      </div>
                    </div>
                  </form>
                </td>
              </tr>
            </tbody>
          </table>
      `;
    }
    renderHistory(){
      return html`
        <h2>Historique</h2>
          <table class="list-table">
            <thead><tr>
                <th>${this.t("ui.filename", {count:2})}</th>
                <th>${this.t("ui.mtime")}</th>
                <th>${this.t("ui.author", {count: 2})}</th>
                <th></th>
            </tr></thead>
            <tbody>
            ${(!this.versions?.length)?html`<tr><td colspan=4 style="text-align: center;">${this.t("info.noData",{item: this.scene})}</td</tr>`:nothing}
            ${this.versions.map((v, index)=>{
              let name = (3 < v.names.size)? `${this.t("info.etAl", {item: v.names.values().next().value, count:v.names.size})}`: [...v.names.values()].join(", ");
              let authors = [...v.authors.values()].join(", ")
              return html`<tr>
                <td>${name}</td>
                <td>${new Date(v.start).toLocaleString()}</td>
                <td>${authors}</td>
                <td>${index==0?html`Active`:html`<ff-button class="btn-restore" @click=${this.onRestore} text="Restore"></ff-button>`}</td>
              </tr>`
            })}
          </tbody>
        </table>
      `;
    }

    renderPermissionSelection(username:string, selected :AccessRights["access"], disabled :boolean = false){
      const onSelectPermission = (e:Event)=>{
        let target = (e.target as HTMLSelectElement)
        let value = target.value as AccessRights["access"];
        this.grant(username, value)
        .catch((e)=>{
          target.value = selected;
          Notification.show("Failed to grant permissions : "+e.message, "error");
        })
      }
      return html`<span class="form-item"><select .disabled=${disabled} @change=${onSelectPermission}>
        ${AccessTypes.map(a=>html`<option .selected=${a === selected} value="${a}">${this.t(`ui.${a}`)}</option>`)}
      </select></span>`
    }

    onAddUserPermissions = (ev :SubmitEvent)=>{
      ev.preventDefault();
      let target = ev.target as HTMLFormElement;
      let username = target.username.value;
      this.grant(username, "read").catch(e=>{
        Notification.show(`Failed to grant read access for ${username}: ${e.message}`);
      })
    }

    onRestore = (e:MouseEvent)=>{
      let id = (e.target as HTMLButtonElement).name;
      Notification.show(`Restoring document to version ${id}...`, "info");
      //fetch(`/api/v1/scenes/${this.scene}/files/`)
    }

    async grant(username :string, access :AccessRights["access"]){
      if(access == "none" && username != "default") access = null;
      let p = fetch(`/api/v1/scenes/${this.scene}/permissions`, {
        method: "PATCH",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({username:username, access:access})
      }).then(async (r)=>{
        if(!r.ok){
          try{
            let body = await r.json();
            throw new Error(`[${r.status}]: ${body.message || r.statusText}`);
          }catch(e){
            throw new Error(`[${r.status}] ${r.statusText}`);
          }
        }
      })
      p.then(()=>{this.fetchPermissions()}).catch(e=>{
        Notification.show(`Failed to fetch permissions : ${e.message}`);
      })
      return p;
    }

    onDelete = ()=>{
      if(!confirm("Delete permanently "+this.scene+"?")) return;
      Notification.show("Deleting scene "+this.scene, "warning");
      fetch(`/scenes/${this.scene}?archive=false`, {method:"DELETE"})
      .then(()=>{
        navigate(this, "/ui/");
      }, (e)=>{
        console.error(e);
        Notification.show(`Failed to remove ${this.scene} : ${e.message}`);
      });
    }
 }