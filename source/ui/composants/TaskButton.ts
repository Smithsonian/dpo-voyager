
import { css, LitElement,customElement, property, html, TemplateResult } from "lit-element";




/**
 * Main UI view for the Voyager Explorer application.
 */
@customElement("task-button")
export default class TaskButton extends LitElement
{

  render() :TemplateResult {
      return html`<slot></slot>`;
  }

  static styles = css`
    :host > ::slotted(*){
      cursor : pointer;
      color: white;
      text-decoration: none;
      background-color: var(--color-primary)!important;
      padding: 0.5rem 1rem;
      margin : 2rem 0.5rem;
      border-radius: 4px;
    }
  `;
 
}