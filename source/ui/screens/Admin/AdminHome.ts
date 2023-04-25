
import { customElement, property, html, TemplateResult, LitElement, css } from "lit-element";

import "@ff/ui/Button";

import "./UsersList";
import i18n from "../../state/translate";
import Notification from "@ff/ui/Notification";


/**
 * Main UI view for the Voyager Explorer application.
 */
@customElement("admin-home")
export default class AdminHomeScreen extends i18n(LitElement) {

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
    return html`
      <h2>Welcome to the administration section</h2>

      <div class="section">
        <h3>${this.t("ui.tools")}</h3>
          <ul>
              <li>
                  <a  download href="/api/v1/scenes?format=zip">Download all scenes as Zip</a>
              </li>
          </ul>
      </div>
    `;
  }
}