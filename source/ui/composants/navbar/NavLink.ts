import { LitElement, html, customElement, property, css } from 'lit-element';
import Button from "@ff/ui/Button";
import { navigate } from '../../state/router';

@customElement("nav-link")
export default class NavLink extends Button{
  @property({type: String})
  href :string;


  onclick = (ev :MouseEvent)=>{
    super.onClick(ev);
    ev.preventDefault();
    console.log("Event : ", ev);
    navigate(this);
    return false;
  }
}