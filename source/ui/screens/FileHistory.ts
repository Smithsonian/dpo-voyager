
import { css, customElement, property, html, TemplateResult, LitElement } from "lit-element";
import Notification from "@ff/ui/Notification";

import "client/ui/Spinner";
import "../Size";
import HttpError from "../state/HttpError";

interface Scene{
  name :string;
  id :number;
  ctime :Date;
  author_id :number;
  author :string;
  state :0|1;
}
interface FileProps extends Scene{
  type :"article"|"image"|"glb";
  mtime :Date;
  size :number;
  hash :string|null;
  generation :number;
}

/**
 * Main UI view for the Voyager Explorer application.
 */
 @customElement("file-history")
 export default class FileHistory extends LitElement
 {
    @property()
    scene :string;
    @property()
    type :"article"|"image"|"glb";
    @property()
    name :string;

    @property({attribute: false})
    history : FileProps[];

    @property({attribute: false})
    working :number = 0;

    constructor()
    {
        super();
    }
    createRenderRoot() {
        return this;
    }
      
    public connectedCallback(): void {
        super.connectedCallback();
        this.fetchHistory()
    }

    
    async fetchHistory(){
      return fetch(`/api/v1/scenes/${this.scene}/files/${this.type}/${this.name}/history`).then(async (r)=>{
        if(!r.ok) throw new Error(`[${r.status}]: ${r.statusText}`);
        this.history = ((await r.json()) as FileProps[]);
        console.log("File History : ", this.history);
      }).catch((e)=> {
        console.error(e);
        Notification.show(`Failed to fetch file history : ${e.message}`, "error");
      });
    }

    activate = (ev :Event)=>{
      ev.preventDefault();
      let target :HTMLInputElement = ev.target as HTMLInputElement;
      let id = target.name;
      let checked = target.checked;
      this.working++;
      target.disabled = true;
      fetch(`/api/v1/files/${id}`, {method:"PATCH", headers:{"Content-Type":"application/json"}, body: JSON.stringify({state: checked?0: 1})})
      .then(HttpError.okOrThrow)
      .catch(e=>{
        Notification.show(`Failed to ${checked?"enable":"disable"} ${this.name}: ${e.message}`, "error")
        target.checked = !checked;
      })
      .finally(()=>{
        this.working--;
        target.disabled = false;
      });
    }

    protected render() :TemplateResult {
        if(!this.history){
            return html`<div style="margin-top:10vh"><sv-spinner visible/></div>`;
        }

        return html`
        <h1>${this.name}</h1>
        <div style="display:flex;flex-wrap:wrap;">
          <div style="flex-grow: 1; min-width:300px;">
            <h3>scene: ${this.scene}</h3>
            <h3>Type: ${this.type}</h3>
            <h3>${this.history.length} version${(1 < this.history.length?"s":"")}
          </div>
          <div style="min-width:300px;">
            <h2>Historique</h2>
            <div style="position:relative;">
              <div style="position: absolute;top: 0;right:0;z-index:2;overflow: hidden;width:${this.working?"auto":"0"}">
                <span style="font-size:0.8rem; color: var(--color-secondary)">saving...</span>
              </div>
              <table class="list-table">
                <thead>
                  <tr>
                    <th>name</th>
                    <th>mtime</th>
                    <th>size</th>
                    <th>author</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                ${this.history.map(m=>html`<tr>
                    <td style="font-family:monospace;">${m.id}</td>
                    <td>${new Date(m.ctime).toLocaleString()}</td>
                    <td>${((m.hash)? html`<b-size .b=${m.size}></b-size>` : html`<ff-icon name="trash"></ff-icon>`)}</td>
                    <td>${m.author}</td>
                    <td>
                      <ff-button class="btn-restore" name="${m.generation}" text="Restore" @click=${this.onRestore}></ff-button>
                    </td>
                </tr>`)}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      `;
    }
    onRestore = (e:MouseEvent)=>{
      Notification.show(`Failed to restore to generation : ${(e.target as HTMLButtonElement).name}`)
    }
 }