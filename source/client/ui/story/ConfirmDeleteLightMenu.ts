import Popup, { customElement, html } from "@ff/ui/Popup";
import CVLanguageManager from "../../components/CVLanguageManager";
import { focusTrap, getFocusableElements } from "../../utils/focusHelpers";

@customElement("sv-confirm-delete-light")
export default class ConfirmDeleteLightMenu extends Popup {
    protected language: CVLanguageManager = null;
    protected lightName: string;

    static show(parent: HTMLElement, language: CVLanguageManager, lightName: string): Promise<boolean> {
        const dialog = new ConfirmDeleteLightMenu(language, lightName);
        parent.appendChild(dialog);
        return new Promise(resolve => {
            dialog.on("confirm", () => resolve(true));
            dialog.on("close", () => resolve(false));
        });
    }

    constructor(language: CVLanguageManager, lightName: string) {
        super();
        this.language = language;
        this.lightName = lightName;
        this.position = "center";
        this.modal = true;
    }

    protected firstConnected() {
        super.firstConnected();
        this.classList.add("sv-option-menu", "sv-light-menu");
    }

    protected firstUpdated(changedProperties) {
        super.firstUpdated(changedProperties);

        (this.getElementsByClassName("ff-button")[1] as HTMLElement).focus();
    }
    
    close() {
        this.dispatchEvent(new CustomEvent("close"));
        this.remove();
    }

    protected confirm() {
        this.dispatchEvent(new CustomEvent("confirm"));
        this.remove();
    }

    protected onKeyDownMain(e: KeyboardEvent) {
        if (e.code === "Escape") {
            this.close();
        }
        else if (e.code === "Tab") {
            focusTrap(getFocusableElements(this) as HTMLElement[], e);
        }
    }

    protected render() {
        const language = this.language;
        const title = language.getUILocalizedString("Delete Light");
        const cancel = language.getUILocalizedString("Cancel");
        const del = language.getUILocalizedString("Delete");

        return html`<div class="sv-light-menu" role="dialog" aria-label=${title} @keydown=${(e: KeyboardEvent) => this.onKeyDownMain(e)}>
            <div class="ff-flex-column ff-fullsize" style="min-width:260px;">
                <div class="ff-flex-row">
                    <div class="ff-flex-spacer ff-title">${title}</div>
                </div>
                <div class="ff-flex-row" style="padding:8px 0;">
                    <div class="ff-text">${language.getUILocalizedString("Delete light")} '${this.lightName}'?</div>
                </div>
                <div class="ff-flex-row">
                    <ff-button icon="trash" class="ff-button ff-control" text=${del} title=${del} @click=${this.confirm} autofocus></ff-button>
                    <div class="ff-flex-spacer"></div>
                    <ff-button icon="close" class="ff-close-button ff-control" text=${cancel} title=${cancel} @click=${this.close}></ff-button>
                </div>
            </div>
        </div>`;
    }
}
