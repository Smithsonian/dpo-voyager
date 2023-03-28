
import { customElement, property, html, TemplateResult, LitElement, css } from "lit-element";

import "@ff/ui/Button";

import "./UsersList";
import i18n from "../../state/translate";

import Notification from "@ff/ui/Notification";
import "client/ui/Spinner";

/**
 * Main UI view for the Voyager Explorer application.
 */
@customElement("admin-stats")
export default class AdminStatsScreen extends i18n(LitElement) {

  @property({attribute: false})
  stats :Record<string, Record<string, any>>;

  fetchStats(){
    fetch("/api/v1/stats", {
      headers:{"Accept":"application/json"}
    }).then(async r=>{
      let b = await r.json();
      if(!r.ok) throw new Error(b.message);
      this.stats = b;
    }).catch(e=>{
      console.error(e);
      Notification.show(`Failed to fetch server stats : ${e.message}`, "error");
    });
  }

  createRenderRoot() {
    return this;
  }

  public connectedCallback(): void {
    super.connectedCallback();
    this.fetchStats();
  }

  protected render(): unknown {
    if(!this.stats){
      return html`<div style="margin-top:10vh"><sv-spinner visible/></div>`
    }
    return html`<div style="max-width:1200px; margin: auto;">
      <h1>Server Statistics</h1>
      <h3>Files statistics</h3>
      <ul>
        <li>Total number of scenes: ${this.stats.files.scenes}</li>
        <li>Total number of files: ${this.stats.files.files}</li>
        <li>Last modification: ${new Date(this.stats.files.mtime).toLocaleString(this.language)}</li>
        <li>Total disk usage: <b-size i b=${this.stats.files.size}></b-size></li>
      </ul>
      <h3>Performance statistics</h3>
      <ul>
        <li>Free memory: <b-size b=${this.stats.process.freemem}></b-size></li>
        <li>Load average (1 min): ${Math.floor(100*this.stats.process.load[0] / this.stats.process.cores)}%</li>
        <li>Load average (15 min): ${Math.floor(100*this.stats.process.load[2] / this.stats.process.cores)}%</li>
      </ul>
    </div>`;
  }
}