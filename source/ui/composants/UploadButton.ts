
import { css, LitElement,customElement, html, TemplateResult } from "lit-element";


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