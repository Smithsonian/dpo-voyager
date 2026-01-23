import Popup, { customElement, html } from "@ff/ui/Popup";
import CVLanguageManager from "../../components/CVLanguageManager";
import { ELightType } from "../../components/lights/CVLight";
import { focusTrap, getFocusableElements } from "../../utils/focusHelpers";

@customElement("sv-create-light-menu")
export default class CreateLightMenu extends Popup {
    protected language: CVLanguageManager = null;

    protected lightType: ELightType = ELightType.directional;
    protected name: string = ELightType[this.lightType];

    protected errorString: string = "";

    static show(parent: HTMLElement, language: CVLanguageManager): Promise<[ELightType, string]> {

        const menu = new CreateLightMenu(language);
        parent.appendChild(menu);

        return new Promise((resolve, reject) => {
            menu.on("confirm", () => resolve([menu.lightType, menu.name]));
            menu.on("close", () => {});
        });
    }

    constructor(language: CVLanguageManager) {
        super();

        this.language = language;

        this.position = "center";
        this.modal = true;
    }

    close() {
        this.dispatchEvent(new CustomEvent("close"));
        this.remove();
    }

    confirm() {
        if (this.lightType === null || this.name.trim() === "") {
            this.errorString = this.language.getUILocalizedString("Please select a light type and enter a name.");
            this.requestUpdate();
        } else {
            this.dispatchEvent(new CustomEvent("confirm"));
            this.remove();
        }
    }

    protected firstConnected() {
        super.firstConnected();
        this.classList.add("sv-option-menu", "sv-light-menu");
    }

    protected renderLightTypeEntry(lightType: ELightType, index: number) {
        return html`<div class="sv-entry" @click=${(e: MouseEvent) => this.onClickType(e, index)} ?selected=${lightType === this.lightType}>
            ${ELightType[lightType]}
        </div>`;
    }
    protected onClickType(e: MouseEvent, index: number) {
        e.stopPropagation();

        this.lightType = ELightType[ELightType[index]];
        this.requestUpdate();

    }

    protected onChange(e: Event) {
        e.stopPropagation();

        const target = e.target as HTMLSelectElement;
        this.lightType = parseInt(target.value);

        if (Object.values(ELightType).includes(this.name)) {
            // adapt name to new light type, unless it was customized before
            this.name = ELightType[this.lightType];
        }

        this.requestUpdate();
    }

    protected firstUpdated(changedProperties) {
        super.firstUpdated(changedProperties);

        (this.getElementsByClassName("ff-input")[0] as HTMLElement).focus();
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

        return html`
        <div class="sv-light-menu" role="region" aria-label="Create Light Menu" @keydown=${e => this.onKeyDownMain(e)}>
            <div class="ff-flex-column ff-fullsize">
                <div class="ff-flex-row">
                    <div class="ff-flex-spacer ff-title">${language.getUILocalizedString("Create Light")}</div>
                </div>
                <div class="ff-flex-row">
                    <div class="ff-dropdown">
                    <select class="ff-input" .value=${this.lightType} @change=${this.onChange}>
                        ${Object.keys(ELightType).filter(key => typeof ELightType[key] === 'number').map((key) => html`<option value=${ELightType[key]}>${key}</option>`)}
                    </select>
                    </div>
                </div>
                <div class="ff-flex-row">
                    <label class="ff-label">${language.getUILocalizedString("Name")}</label>
                    <div class="ff-flex-spacer"></div>
                    <input class="ff-input" type="text" style="text-align:right;" .value=${this.name} @input=${(e: Event) => this.name = (e.target as HTMLInputElement).value} />
                </div>
                <div class="ff-flex-row">
                    <ff-button icon="check" class="ff-button ff-control" text=${language.getUILocalizedString("Create")} title=${language.getUILocalizedString("Create Light")} @click=${this.confirm}></ff-button>
                    <div class="ff-flex-spacer"></div>
                    <ff-button icon="close" class="ff-close-button ff-control" text=${language.getUILocalizedString("Cancel")} title=${language.getUILocalizedString("Cancel")} @click=${this.close}></ff-button>
                </div>
            </div>
        </div>
        `;
    }
}