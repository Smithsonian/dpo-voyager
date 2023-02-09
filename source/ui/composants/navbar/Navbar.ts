
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
    <div class="brand">
      <a style="display:flex; align-items:center; color:#c8c8c8;text-decoration:none;font-weight:bold" href="/">
        <img style="height:32px; padding: 0px 10px;" src="/images/logo-planete.png" alt="logo eCorpus">
        <span>eCorpus</span>
      </a>
    </div>
    <div class="spacer"></div>
    <div class="navbar"><slot>no-content</slot></div>
  </nav>`;
  }
  static styles = [styles];
}
