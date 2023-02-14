
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

  static styles = css`
    :host{
      
    }
    .upload-btn {
      cursor : pointer;
      color: white;
      background-color: var(--color-tertiary);
      padding: 0.5rem 1rem;
      margin : 2rem 0.5rem;
    }
    .upload-btn:hover {
      background-color : var(--color-secondary);
    }
  `;
 
}