/**
 * 3D Foundation Project
 * Copyright 2024 Smithsonian Institution
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import Subscriber from "@ff/core/Subscriber";

import { EReaderPosition } from "client/schema/setup";

import CVAnalytics from "../../components/CVAnalytics";
import CVAssetManager from "../../components/CVAssetManager";
import CVDocument from "../../components/CVDocument";

import SceneView from "../SceneView";
import "../Spinner";
import "./ActionPrompt"
import "./ReaderView";
import "./CaptionView"

import DocumentView, { customElement, html } from "./DocumentView";
import CRenderer from "client/../../libs/ff-scene/source/components/CRenderer";

import ARPrompt from "./ARPrompt";
import ARMenu from "./ARMenu";
import CVARManager from "client/components/CVARManager";
import CVAssetReader from "client/components/CVAssetReader";
import CaptionView from "./CaptionView";
import { EQuadViewLayout } from "client/../../libs/ff-scene/source/RenderQuadView";

////////////////////////////////////////////////////////////////////////////////

@customElement("sv-content-view")
export default class ContentView extends DocumentView
{
    protected sceneView: SceneView = null;
    protected captionView: CaptionView = null;
    protected documentProps = new Subscriber("value", this.onUpdate, this);
    protected isMobile: boolean = null;
    protected assetPath: string = "";

    protected get analytics() {
        return this.system.getMainComponent(CVAnalytics);
    }
    protected get assetManager() {
        return this.system.getMainComponent(CVAssetManager);
    }
    protected get reader() {
        return this.activeDocument ? this.activeDocument.setup.reader : null;
    }
    protected get tours() {
        return this.activeDocument ? this.activeDocument.setup.tours : null;
    }
    protected get navigation() {
        return this.activeDocument ? this.activeDocument.setup.navigation : null;
    }
    protected get renderer() {
        return this.system.getMainComponent(CRenderer);
    }
    protected get arManager() {
        return this.system.getMainComponent(CVARManager);
    }
    protected get assetReader() {
        return this.system.getMainComponent(CVAssetReader);
    }

    protected firstConnected()
    {
        this.classList.add("sv-content-view");
        this.sceneView = new SceneView(this.system);

        this.captionView = new CaptionView(this.system);

        this.isMobile = this.mobileCheck();
    }

    protected connected()
    {
        super.connected();
        this.assetManager.outs.busy.on("value", this.onUpdate, this);
        this.sceneView.on("layout", () => this.onUpdate());     
        this.assetPath = this.assetReader.getSystemAssetUrl("");
    }

    protected disconnected()
    {
        this.sceneView.off("layout", () => this.onUpdate());
        this.assetManager.outs.busy.off("value", this.onUpdate, this);
        super.disconnected();
    }

    protected render()
    {
        const system = this.system;
        const isLoading = this.assetManager.outs.busy.value;
        const isInitialLoad = this.assetManager.initialLoad;

        let readerVisible = false;
        let readerPosition = EReaderPosition.Overlay;
        let tourMenuVisible = false;
        let promptVisible = false;

        const reader = this.reader;
        const tours = this.tours;
        const navigation = this.navigation;

        // TODO - Hack, figure out a better place for this.
        const overlayElement = this.arManager.shadowRoot.querySelector('ff-viewport-overlay');
        if(overlayElement) {
            if(this.arManager.shadowRoot.querySelector('sv-ar-prompt-container') === null) {        
                overlayElement.append(new ARPrompt(this.system));
            }
            if(this.arManager.shadowRoot.querySelector('sv-ar-menu') === null) {
                overlayElement.append(new ARMenu(this.system));
            }
        }
        
        if (tours) {
            tourMenuVisible = tours.ins.enabled.value && tours.outs.tourIndex.value === -1;
        }
        if (reader) {
            readerVisible = ! tourMenuVisible && reader.ins.enabled.value && reader.ins.visible.value;

            readerPosition = reader.ins.position.getValidatedValue();

            // do not use right reader position on mobile
            if(this.isMobile === true) {
                readerPosition = EReaderPosition.Overlay;
            }
        }
        if(navigation) {
            const controls = navigation.ins.pointerEnabled.value;
            const promptEnabled = navigation.ins.promptEnabled.value;

            if(controls && promptEnabled) {
                const isInUse = navigation.ins.isInUse.value;
                promptVisible = !isLoading && isInitialLoad && !isInUse && !readerVisible;
                navigation.ins.promptActive.setValue(promptVisible);
            }
        }

        const sceneView = this.sceneView;
        const captionView = this.captionView;

        const blurContent =
            ((readerVisible && readerPosition === EReaderPosition.Overlay) || tourMenuVisible) && this.sceneView.getView().layout == EQuadViewLayout.Single;

        if (!blurContent) {
            sceneView.classList.remove("sv-blur");
        }
        else {
            if(!sceneView.classList.contains("sv-blur")) {
                setTimeout(() => {sceneView.classList.add("sv-blur"); this.renderer.views[0].render()}, 1);  // TODO: Extra for an apparent Android Firefox bug - remove when fixed
            }
        }

        if(!isLoading && isInitialLoad) { 
            // send load timer event
            this.analytics.sendProperty("Loading_Time", this.analytics.getTimerTime()/1000);
            this.analytics.resetTimer();

            this.assetManager.initialLoad = false;
        }

        if (readerVisible) {
            if (readerPosition === EReaderPosition.Right) {
                return html`<div class="ff-fullsize sv-content-split">
                    <div class="ff-splitter-section" style="flex-basis: 60%">
                        ${sceneView}
                    </div>
                    <ff-splitter direction="horizontal"></ff-splitter>
                        <div class="ff-splitter-section" style="flex-basis: 40%; max-width: 500px;">
                            <div class="sv-reader-container">
                                <sv-reader-view .system=${system} @close=${this.onReaderClose} ></sv-reader-view>
                            </div>
                        </div>
                    </div>
                    <sv-spinner ?visible=${isLoading} .assetPath=${this.assetPath}></sv-spinner>
                    ${captionView}`;
            }
            if (readerPosition === EReaderPosition.Overlay) {
                return html`<div class="ff-fullsize sv-content-stack">${sceneView}
                    <div class="sv-reader-container">
                        <sv-reader-view .system=${system} @close=${this.onReaderClose}></sv-reader-view>
                    </div>
                    <sv-spinner ?visible=${isLoading} .assetPath=${this.assetPath}></sv-spinner>
                    ${captionView}
                    </div>`;
            }
        }

        return html`<div class="ff-fullsize sv-content-only">${sceneView}</div>
            <sv-spinner ?visible=${isLoading} .assetPath=${this.assetPath}></sv-spinner>
            ${captionView}
            ${promptVisible ? html`<sv-action-prompt></sv-action-prompt>` : null}`;
    }

    protected onReaderClose()
    {
        this.reader.ins.enabled.setValue(false);
        this.reader.ins.closed.set();
    }

    protected onActiveDocument(previous: CVDocument, next: CVDocument)
    {
        if (previous) {
            this.documentProps.off();
        }
        if (next) {
            this.documentProps.on(
                next.setup.reader.ins.position,
                next.setup.reader.ins.enabled,
                next.setup.tours.outs.tourIndex,
                next.setup.navigation.ins.isInUse
            );
        }

        this.requestUpdate();
    }

    // from detectmobilebrowsers.com
    protected mobileCheck() {
        var check = false;
        (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor);
        return check;
    };
}

