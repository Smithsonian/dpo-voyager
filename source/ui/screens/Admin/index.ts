
import { customElement, property, html, TemplateResult, LitElement, css } from "lit-element";

import "@ff/ui/Button";

import i18n from "../../state/translate";
import { link, route, router } from "../../state/router";
import { withUser } from "../../state/auth";

import "./AdminHome";
import "./AdminStats";
import "./UsersList";
import "../../composants/navbar/NavLink";

import styles from '!lit-css-loader?{"specifier":"lit-element"}!sass-loader!../../styles.scss';

/**
 * Main UI view for the Voyager Explorer application.
 */
@customElement("admin-panel")
export default class AdminScreen extends router( withUser( i18n(LitElement) ) ) {
  path = "/ui/admin/";

  @route()
  static "/" =()=> html`<admin-home></admin-home>`;
  @route()
  static "/users" =()=> html`<users-list></users-list>`;
  @route()
  static "/stats" =()=> html`<admin-stats></admin-stats>`;


  render(){
    if(!this.user?.isAdministrator){
      return html`<h1>Error</h1><div>This page is reserved to administrators</div>`
    }
    return html`<div>
      <nav>
          <nav-link .selected=${this.isActive("", true)} href="${this.path}" text="Home"></nav-link>
          <nav-link .selected=${this.isActive("users")} href="${this.path}users" text="${this.t("ui.users")}"></nav-link>
          <nav-link .selected=${this.isActive("stats")} href="${this.path}stats" text="${this.t("ui.stats")}"></nav-link>
      </nav>
      <section>
        ${this.renderContent()}
      </section>
    </div>`
  }
  static styles = [styles, css`
    nav{
      display: flex;
      justify-content: center;
      gap: 5px;
      padding-bottom: 10px;
    }
    nav > nav-link{
      flex: 0 1 150px !important;
    }
  
  `];
}