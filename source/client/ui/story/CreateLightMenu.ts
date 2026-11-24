import { html } from "@ff/ui/CustomElement";

import "@ff/ui/Button";
import CVLanguageManager from "../../components/CVLanguageManager";
import { ELightType } from "../../components/lights/CVLight";
import { openModal } from "../Modal";

////////////////////////////////////////////////////////////////////////////////

/**
 * Asks for the type and name of a light to create.
 * Resolves with them, or `undefined` if cancelled.
 */
export function showCreateLightMenu(parent: HTMLElement, language: CVLanguageManager): Promise<[ELightType, string] | undefined>
{
    const title = language.getUILocalizedString("Create Light");

    let lightType = ELightType.directional;
    let name: string = ELightType[lightType];
    let errorString = "";

    return openModal<[ELightType, string]>(parent, ({ close, update }) => {

        const confirm = () => {
            if (lightType === null || name.trim() === "") {
                errorString = language.getUILocalizedString("Please select a light type and enter a name.");
                update();
            }
            else {
                close([lightType, name]);
            }
        };

        const onChangeType = (event: Event) => {
            event.stopPropagation();
            lightType = parseInt((event.target as HTMLSelectElement).value);

            if (Object.values(ELightType).includes(name)) {
                // adapt name to new light type, unless it was customized before
                name = ELightType[lightType];
                name = name[0].toUpperCase() + name.slice(1);
            }

            update();
        };

        return html`
            <div class="ff-flex-column ff-fullsize">
                <div class="ff-flex-row">
                    <div class="ff-flex-spacer ff-title">${title}</div>
                </div>
                <div class="ff-flex-row">
                    <div class="ff-dropdown">
                    <select class="ff-input" autofocus .value=${String(lightType)} @change=${onChangeType}>
                        ${Object.keys(ELightType)
                            .filter(key => typeof ELightType[key] === 'number')
                            .map((key) => {
                                const light = language.system.getComponent("CV"+key.charAt(0).toUpperCase() + key.slice(1)+"Light", true);
                                const isDisabled = light && light.isGraphSingleton;
                                return html`<option value=${ELightType[key]} ?disabled=${isDisabled}>${key}</option>`
                            })}
                    </select>
                    </div>
                </div>
                <div class="ff-flex-row">
                    <label class="ff-label">${language.getUILocalizedString("Name")}</label>
                    <div class="ff-flex-spacer"></div>
                    <input class="ff-input" type="text" .value=${name} @input=${(e: Event) => name = (e.target as HTMLInputElement).value} />
                </div>
                <div class="ff-flex-row">
                    <ff-button icon="check" class="ff-button ff-control" text=${language.getUILocalizedString("Create")} title=${title} @click=${confirm}></ff-button>
                    <div class="ff-flex-spacer"></div>
                    <ff-button icon="close" class="ff-close-button ff-control" text=${language.getUILocalizedString("Cancel")} title=${language.getUILocalizedString("Cancel")} @click=${() => close()}></ff-button>
                </div>
            </div>`;
    }, { label: title, panelClass: "sv-option-menu sv-light-menu" });
}
