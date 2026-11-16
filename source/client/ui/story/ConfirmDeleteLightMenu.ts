import { html } from "@ff/ui/CustomElement";

import "@ff/ui/Button";
import CVLanguageManager from "../../components/CVLanguageManager";
import { openModal } from "../Modal";

////////////////////////////////////////////////////////////////////////////////

/**
 * Asks for confirmation before deleting a light.
 * Resolves with `true` if confirmed, `undefined` if cancelled.
 */
export function showConfirmDeleteLightMenu(parent: HTMLElement, language: CVLanguageManager, lightName: string): Promise<boolean | undefined>
{
    const title = language.getUILocalizedString("Delete Light");
    const cancel = language.getUILocalizedString("Cancel");
    const del = language.getUILocalizedString("Delete");

    return openModal<boolean>(parent, ({ close }) => html`
        <div class="ff-flex-column ff-fullsize" style="min-width:260px;">
            <div class="ff-flex-row">
                <div class="ff-flex-spacer ff-title">${title}</div>
            </div>
            <div class="ff-flex-row" style="padding:8px 0;">
                <div class="ff-text">${language.getUILocalizedString("Delete light")} '${lightName}'?</div>
            </div>
            <div class="ff-flex-row">
                <ff-button icon="trash" class="ff-button ff-control" text=${del} title=${del} @click=${() => close(true)}></ff-button>
                <div class="ff-flex-spacer"></div>
                <ff-button icon="close" class="ff-close-button ff-control" text=${cancel} title=${cancel} autofocus @click=${() => close()}></ff-button>
            </div>
        </div>`,
        { label: title, panelClass: "sv-option-menu sv-light-menu" });
}
