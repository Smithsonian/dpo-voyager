
import { customElement,  html, TemplateResult, LitElement} from "lit-element";

import "@ff/ui/Button";

import i18n from "../state/translate";


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
            <img class="" style="width:100%" src="/images/sketch_ethesaurus.png" alt="sketch représentant l'application voyager et son utilisation dans une borne holographique">
        </div>`
    }

 }