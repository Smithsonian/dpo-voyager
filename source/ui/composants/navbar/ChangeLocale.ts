import { LitElement, html, customElement, property, css, TemplateResult } from 'lit-element';
import Button from "@ff/ui/Button";
import i18n, {Localization} from '../../state/translate';

@customElement("change-locale")
export default class ChangeLocale extends i18n(Button){
  constructor(){
    super();
  }
  onclick = (ev :MouseEvent)=>{
    ev.preventDefault();

    return false;
  }
  protected createRenderRoot(): Element | ShadowRoot {
    return this;
  }
  onClick = ()=>{
    Localization.Instance.setLanguage(this.language == "fr"? "en": "fr");
  }
  protected render(): TemplateResult {
    this.text = this.language;
    console.log("lang render : ", Localization.Instance);
    return super.render();
  }
}