import { LitElement, html, customElement, property, css } from 'lit-element';
import Button from "@ff/ui/Button";

@customElement("nav-link")
export default class NavLink extends Button{
  @property({type: String})
  href :string;


  onclick = (ev :MouseEvent)=>{
    ev.preventDefault();
    window.dispatchEvent(new CustomEvent<HTMLElement>("navigate", {detail: this}));
    return false;
  }
}