import { css, CSSResultGroup, customElement, html, LitElement, property } from "lit-element";



@customElement("list-item")
export default class ListItem extends LitElement{

  @property({type: Function})
  onChange :(ev :Event)=>any;

  @property({type :String})
  name :string;

  protected render(): unknown {

    return html`
      ${(this.onChange? html`<span class="pill">
        <input type="checkbox" name="${this.name}" @change=${this.onChange} name="isAdministrator" id="isAdministrator">
      </span>`:null)}
      <span class="name">
        ${this.name}
      </span>
    `
  }
  static styles = css`
    :host{
      display: block;
      flex: 1 1 auto;
      background: rgba(0, 0, 0, 0.3);
      margin: 4px 0;
      display: flex;
      align-items: center;
    }
    .pill{
      padding: 6px;
    }
    .pill input{
      width: 25px;
      height: 25px;
    }
    .name{
      font-size: 120%;
    }
  `;
}