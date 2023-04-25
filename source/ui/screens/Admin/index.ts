
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
    return html`
    <div class="admin-panel">
      <nav>
          <nav-link .selected=${this.isActive("", true)} href="${this.path}"><ff-icon name="tools"></ff-icon> Home</nav-link>
          <nav-link .selected=${this.isActive("users")} href="${this.path}users"><ff-icon name="users"></ff-icon> ${this.t("ui.users")}</nav-link>
          <nav-link .selected=${this.isActive("stats")} href="${this.path}stats"><ff-icon name="stats"></ff-icon> ${this.t("ui.stats")}</nav-link>
      </nav>
      <section>
        ${this.renderContent()}
      </section>
    </div>`
  }
  static styles = [styles, css`
    .admin-panel{
      display:flex;
      gap: 15px;
      padding: 1rem;
    }
    nav{
      display: flex;
      flex-direction: column;
      gap: 5px;
      padding-bottom: 10px;
      margin-top: 75px;
    }
    section{
      width:100%;
    }
    nav > nav-link{
      font-size: 1rem;
      text-align: left;
      min-width:200px;
    }
    nav-link svg{
      fill: white;
      margin-right: 5px;
    }
    nav-link ff-icon{
      height: 1.5rem !important;
    }
    nav-link ff-icon[name="tools"] svg{
      padding:2px
    }

    @media (max-width: 1024px){
      .admin-panel{
        flex-direction: column;
      }
      nav{
        justify-content: center;
        margin-top:0;
        border-bottom: 1px solid #103040;
      }
    }
  `];
}