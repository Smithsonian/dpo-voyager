
import { css, customElement, property, html, TemplateResult, LitElement } from "lit-element";
import Notification from "@ff/ui/Notification";

import "client/ui/Spinner";
import "../Size";
import { nothing } from "lit-html";
import i18n from "../state/translate";


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
  access :string;
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
        
        return html`
        <h1>${this.scene}</h1>
        <div style="display:flex;flex-wrap:wrap;">
          <div style="flex-grow: 1; min-width:300px;">
            <h3>Total size: <b-size b=${size}></b-size>
            <h3>${articles.size} article${(1 < articles.size?"s":"")}
          </div>
          <div style="min-width:300px;">
            <h2>Accès</h2>
            <table class="list-table">
              <thead><tr>
                  <th>${this.t("ui.username")}</th>
                  <th>${this.t("ui.rights")}</th>
                  <th></th>
              </tr></thead>
              <tbody>
              ${((!this.permissions?.length)?html`<tr><td colspan=4 style="text-align: center;">${this.t("info.noData",{item: this.scene})}</td</tr>`:nothing)}
              ${this.permissions.map((p, index) => {
                return html`<tr>
                <td title="${p.uid}">${p.username}</td>
                <td>${p.access}</td>
                <td>-</td>
              </tr>`
              })}
                <tr>
                  <form>
                    <td colspan=3 >add</td>
                  </form>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <div>
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
              <td>${index==0?html`Active`:html`<button class="btn btn-restore" @click=${this.onRestore}>Restore</button>`}</td>
            </tr>`
          })}
          </tbody>
        </table>
      </div>`;
    }
    onRestore = (e:MouseEvent)=>{
      let id = (e.target as HTMLButtonElement).name;
      Notification.show(`Restoring document to version ${id}...`, "info");
      //fetch(`/api/v1/scenes/${this.scene}/files/`)
    }
 }