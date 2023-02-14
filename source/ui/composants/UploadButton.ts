
import { css, LitElement,customElement, property, html, TemplateResult } from "lit-element";




/**
 * Main UI view for the Voyager Explorer application.
 */
@customElement("upload-button")
export default class UploadButton extends LitElement
{

  dispatchChange = (ev :MouseEvent)=>{
    this.dispatchEvent(new CustomEvent("change", {
      detail: {
        files: (ev.target as any).files,
      }
    }));
  }

  render() :TemplateResult {
      return html`<label class="upload-btn" for="fileUpload"><slot></slot></label>
      <input multiple hidden @change={${this.dispatchChange}} id="fileUpload" type="file"/>`;
  }
 
}