import { LitElement, html, customElement, property, css } from 'lit-element';
import Button from "@ff/ui/Button";
import { link, navigate } from '../../state/router';

@customElement("nav-link")
export default class NavLink extends Button{
  @property({type: String})
  href :string;

  override onClick = (ev :MouseEvent)=>{
    super.onClick(ev);
    ev.preventDefault();
    navigate(this);
    return false;
  }
}