
import { css, customElement,  html, TemplateResult, LitElement} from "lit-element";


import i18n from "../state/translate";
import styles from '!lit-css-loader?{"specifier":"lit-element"}!sass-loader!../styles.scss';
import "../composants/UserLogin"

 @customElement("landing-page")
 export default class LandingPage extends i18n(LitElement)
 {

    constructor()
    {
        super();
    }
      
    protected render() :TemplateResult {

        return html`
            <div class="landing-page">
                <div class="illustration">
                    <img src="/images/sketch_ethesaurus.png" alt="sketch représentant l'application voyager et son utilisation dans une borne holographique">
                    <p>${this.t("info.lead")}</p>
                    <p style="text-align:right"> <a href="/ui/standalone/?lang=${this.language.toUpperCase()}">${this.t("info.useStandalone")}</a></p>
                </div>
                
                <div class="user-login">
                    <h2>${this.t("ui.login")}</h2>
                    <user-login></user-login>
                </div>
            </div>
        `
    }

    static styles = [styles, css`
    .landing-page {
        display:flex;
        flex-direction: row;
        align-items: center;
        min-height: calc(100vh - 88px - 2rem);
        flex-wrap: wrap;
    }
    .illustration{
        width:67%;
        min-width:300px;
        flex: 1 1 auto;
    }
    .user-login {
        background-color: var(--color-dark);
        width: 33%;
        padding: 1rem;
        min-width:300px;
        flex: 1 1 auto;
    }
    img{
        display: block;
        max-width: 100%;
        height: auto;
    }
    `];
 }