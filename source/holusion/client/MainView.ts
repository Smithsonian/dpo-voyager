/**
 * 3D Foundation Project
 * Copyright 2021 Smithsonian Institution
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

import { LitElement, customElement, property, html, TemplateResult } from "lit-element";
import CFullscreen from "@ff/scene/components/CFullscreen";
import CVARManager from "client/components/CVARManager";
import CVViewer from "client/components/CVViewer";

import Notification from "@ff/ui/Notification";

import ExplorerApplication, { IExplorerApplicationProps } from "client/applications/ExplorerApplication";


import "./SplitContentView";
import "./SplitUserInterface/SplitUserInterface";
import  "./SplitModeObjectMenu";

//@ts-ignore
import styles from '!lit-css-loader?{"specifier":"lit-element"}!sass-loader!client/ui/explorer/styles.scss';
//@ts-ignore
import splitStyles from '!lit-css-loader?{"specifier":"lit-element"}!sass-loader!./styles.scss';




export interface NavigationParams{
    document ?:string;
    auto ?:boolean;
    route ?:string;
}

export type NavigationEvent = CustomEvent<NavigationParams>;


async function *animationLoop() :AsyncGenerator<DOMHighResTimeStamp>{
    while(true){
        yield await new Promise(resolve =>window.requestAnimationFrame(resolve));
    }
}


/**
 * Main UI view for the Voyager Explorer application.
 */
@customElement("voyager-explorer-split")
export default class MainView extends LitElement
{
    application: ExplorerApplication = null;
    private _loop :AbortController;

    @property()
    public document :string;

    @property()
    public route :string;
    
    @property({type: Boolean})
    private auto :boolean;

    constructor(){
        super();
        let sp = new URLSearchParams(window.location.search);
        let props = {
            route: decodeURIComponent(sp.get("route") || ""),
            document: decodeURIComponent(sp.get("document")),
            auto: !!sp.get("auto")
        }
        this.onNavigate(new CustomEvent<NavigationParams>("select", {detail: props}));
    }

    public connectedCallback()
    {
        super.connectedCallback();
        this.classList.add("split-mode");
        Notification.shadowRootNode = this.shadowRoot;

        console.log("Start app with root : \"%s\"", this.document);
        this.application = new ExplorerApplication(null, {root: this.document, document:"scene.svx.json", resourceRoot:"/", lang: "FR", bgColor: "#000000", bgStyle: "solid"});
    }

    protected render() {
        let system = this.application.system;
        
        if(this.document !== this.application.props.root){
            this.application.props.root = this.document;
            this.application.reloadDocument();
        }
        
        //this.application.setBackgroundColor("#000000", "#000000")
        console.log("Render with path :", this.route, this.document, this.auto);
        let ui :TemplateResult;
        if(this.auto) this.loop();
        else this._loop?.abort();

        if(!this.route){
            ui = html`<split-object-menu @select=${this.onNavigate}></split-object-menu>`
        }else{
            ui = html`<split-user-interface @select=${this.onNavigate} .system=${system}></split-user-interface>`
        }

        return html`<div class="et-screen et-container-1">
            ${ui}
            <split-content-view .system=${system}></split-content-view>
        </div>
        <div id="${Notification.stackId}"></div>`
    }


    onNavigate = (ev :NavigationEvent)=>{
        console.log("Navigate to :", ev.detail);
        ["route", "document", "auto"].forEach((key)=>{
            if(typeof ev.detail[key] !== "undefined") this[key] = ev.detail[key];
        })
        let url = new URL(window.location.href);
        if(this.route) url.searchParams.set("route", encodeURIComponent(this.route));
        if(this.document) url.searchParams.set("document", encodeURIComponent(this.document));
        if(this.auto) url.searchParams.set("auto", "true");
        window.history.pushState({},"", url);
    }

    loop ({ timeout=1000, speed=0.01, changeTimeout=360/speed }={}) :void{
        this._loop?.abort();
        let control = this._loop = new AbortController();
        (async ()=>{
            let [yaw, pitch] = this.application.getCameraOrbit(null);
            let last_direction = 1;
            let last_timestamp = performance.now();
            let idle_since = last_timestamp;
            for await (let timestamp of animationLoop()){
                if(control.signal.aborted) {console.log("break loop");break;}
                let elapsed = (timestamp-last_timestamp);
                last_timestamp = timestamp;
                let [n_yaw, n_pitch] = this.application.getCameraOrbit(null);
                if( n_yaw != yaw || n_pitch != pitch ){
                    last_direction = Math.sign(n_pitch - pitch);
                    yaw = n_yaw;
                    pitch = n_pitch;
                    idle_since = timestamp;
                    continue;
                }if ( (idle_since + timeout) <= timestamp){
                    pitch = (((pitch) + last_direction*speed*elapsed) % 360);/* deg/s */
                    this.application.setCameraOrbit(yaw as any, pitch as any);
                }else{
                    //waiting to be idle for enough time
                }
            }
        })();
    }

    public disconnectedCallback()
    {
        this._loop?.abort();
        this.application.dispose();
        this.application = null;
    }

    static styles = [styles, splitStyles];
}