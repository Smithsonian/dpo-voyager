
import { css, customElement, html, LitElement, TemplateResult } from "lit-element";

import styles from '!lit-css-loader?{"specifier":"lit-element"}!sass-loader!./styles.scss';;

import "client/ui/Logo";

/**
 * Main UI view for the Voyager Explorer application.
 */
 @customElement("corpus-navbar")
 export default class Navbar extends LitElement
 {
 
  constructor()
  {
    super();
  }

  protected render() :TemplateResult {
  return html`<nav>
    <div class="brand"> <a style="display:block;color:white;text-decoration:none;font-weight:bold" href="/">E-Thesaurus</a> </div>
    <div class="spacer"></div>
    <div class="navbar"><slot>no-content</slot></div>
  </nav>`;
  }
  static styles = [styles];
}
