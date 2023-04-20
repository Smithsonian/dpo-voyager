import { css, customElement, html, LitElement, property } from "lit-element";



@customElement("list-item")
export default class ListItem extends LitElement{

  @property({type: Function})
  onChange :(ev :Event)=>any;

  @property({type :String})
  name :string;

  @property({type :String})
  href :string = "";

  @property()
  thumb :string;

  protected render(): unknown {

    return html`
      <a href=${this.href} class="list-item">
        <slot class="name">
          ${this.name}
        </slot>
      </a>
      ${(this.onChange? html`<span class="pill">
        <input type="checkbox" name="${this.name}" @change=${this.onChange} name="isAdministrator" id="isAdministrator">
      </span>`:null)}
    `
  }
  static styles = css`
    :host{
      display: block;
      flex: 1 1 auto;
      display: flex;
      align-items: center;
    }
    .pill{
      padding: 6px;
    }
    .pill input{
      width: 20px;
      height: 20px;
    }
    .list-item{
      display:flex; 
      flex: 1 1 auto;
      gap: 1rem;
      white-space: nowrap;
      text-overflow: ellipsis;
      overflow: hidden;
      background: #000a;
      padding: 1rem;
      border-bottom: 1px solid #103040;
    }
    .list-item:hover{
      background: #071922
    }
    a{
      text-decoration: none;
      color: inherit;
    }
  `;
}