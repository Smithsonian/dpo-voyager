import { LitElement, html, customElement, property, css } from 'lit-element';

import { link, navigate } from '../../state/router';

import styles from '!lit-css-loader?{"specifier":"lit-element"}!sass-loader!./styles.scss';

@customElement("nav-link")
export default class NavLink extends LitElement{
  @property({type: String})
  href :string;

  @property({attribute:true, type: Boolean})
  selected :boolean = false;

  connectedCallback()
  {
    super.connectedCallback();
    this.classList.add("nav-link");
  }

  render(){
    return html`<a class="${this.selected?"selected":""}" href="${this.href}" @click=${this.onClick}><slot></slot></a>`;
  }

  onClick = (ev :MouseEvent)=>{
    ev.preventDefault();
    navigate(this);
    return false;
  }

  static styles = [styles];
}