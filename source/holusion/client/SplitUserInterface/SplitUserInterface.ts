
import Subscriber from "@ff/core/Subscriber";
import { System } from "@ff/scene/ui/SystemView";

import ExplorerApplication from "client/applications/ExplorerApplication";
import { Annotation } from "client/components/CVAnnotationView";
import DocumentView, { customElement, html } from "client/ui/explorer/DocumentView";
import CVDocument from "client/components/CVDocument";
import CVLanguageManager from "client/components/CVLanguageManager";
import { ITourMenuSelectEvent } from "client/ui/explorer/TourMenu";
import CVViewer from "client/components/CVViewer";


import "../TouchController";
import "./SplitTagCloud";
import "../SplitModeObjectMenu";
import "./ObjectContent";
import "./TourSelector";


@customElement("split-user-interface")
export default class SplitUserInterface extends DocumentView
{
    protected documentProps = new Subscriber("value", this.onUpdate, this);
    private _loop :AbortController;
    private readonly app:ExplorerApplication;

    protected get language() {
        return this.system.getMainComponent(CVLanguageManager, true);
    }

    protected get viewer()
    {
        return this.system.getComponent(CVViewer, true);
    }
    
    constructor(system :System)
    {
        super(system);
    }
    
    protected firstConnected(): void 
    {
        this.classList.add("split-userinterface");
    }

    protected connected(): void {
        super.connected();
        this.activeDocument.setup.language.outs.language.on("value", this.onUpdate, this);
    }
    protected disconnected(): void {
        super.disconnected();
        this.activeDocument?.setup.language.outs.language.off("value", this.onUpdate, this);
    }

    
    protected render()
    {
        const document = this.activeDocument;
        if(!document) return null;
        const setup = document.setup;

        const tours = setup.tours.tours;
        const selectedTour = setup.tours.ins.tourIndex.value;

        // tag cloud is visible if there is at least one tag in the cloud
        //We could also check if setup.viewer.ins.annotationsVisible.value is true to enable
        // on a per-object basis
        const tagCloudVisible = setup.viewer.outs.tagCloud.value;

        const language = setup.language;
        const activeLanguage = language.outs.language.value;

        let tabs = [];

        if(document && tours.length !== 0){
            tabs.push([
                (0 <= selectedTour)? html`<tour-navigator .system=${this.system} @close=${this.onCloseTour}></tour-navigator>`
                    : html`<tour-selector .tours=${tours} .activeLanguage=${activeLanguage} @select=${this.onSelectTour}></tour-selector>`,
                html`<ff-button transparent icon="article" text="Parcours"></ff-button>`,
                ()=>{if(this.viewer) this.viewer.ins.annotationsVisible.setValue(false)},
            ]);
        }
        if(document && tagCloudVisible){
            tabs.push([
                html`<split-tag-cloud .system=${this.system}  @select=${this.onSelectAnnotation}></split-tag-cloud>`,
                html`<ff-button transparent icon="comment" text="Annotations"></ff-button>`,
                ()=>{if(this.viewer) this.viewer.ins.annotationsVisible.setValue(true)}
            ]);
        }
        tabs.push([
            html`<div class="sv-tool-bar-container"><sv-tool-bar .system=${this.system}></sv-tool-bar></div>`,
            html`<ff-button transparent icon="tools" text="Outils"></ff-button>`,
            ()=>{if(this.viewer) this.viewer.ins.annotationsVisible.setValue(false)}
        ]);

        return html`
            <object-content title="${document.ins.title.value}" .system=${this.system} .content=${tabs} @return=${this.toHomeScreen}></object-content>
            <div style="margin:auto; width: 30%; position:relative">
                <touch-controller></touch-controller>
                <div style="position:absolute; top:40%;right:-200px;"><ff-button style="padding:1rem" text="Reset camera" @click=${this.onResetCamera}></ff-button></div>            
            </div>

        `;
    }

    protected onResetCamera = ()=>{
        this.activeDocument.setup.navigation.ins.orbit.setValue([ -25, -25, 0 ]);
        this.activeDocument.setup.navigation.ins.zoomExtents.set();
    }

    protected onCloseTour =()=>{
        this.dispatchEvent(new CustomEvent("select", {
            detail: {auto: true}
        }));
    }

    protected onSelectTour =(event: ITourMenuSelectEvent)=>{
        const tours = this.activeDocument.setup.tours;
        tours.ins.tourIndex.setValue(event.detail.index);
        
        this.dispatchEvent(new CustomEvent("select", {
            detail: {auto: false}
        }));
    }

    protected onSelectAnnotation = (event :CustomEvent<Annotation>)=>{
      console.log("Select :", event.detail);
      if("data" in event.detail){
        this.dispatchEvent(new CustomEvent("select", {
          detail:{lookAt:event.detail.data.position.join(","), auto:false}
        }));
      }else{
        this.dispatchEvent(new CustomEvent("select", {
          detail:{auto:"true"}
        }));
      }
    }


    protected onActiveDocument(previous: CVDocument, next: CVDocument)
    {
        if (previous) {
            this.documentProps.off();
        }
        if (next) {
            const setup = next.setup;
            this.documentProps.on(
                next.outs.title,
                next.outs.assetPath,
                setup.interface.ins.visible,
                setup.interface.ins.logo,
                setup.interface.ins.menu,
                setup.viewer.ins.annotationsVisible,
                setup.reader.ins.enabled,
                setup.tours.ins.enabled,
                setup.tours.outs.tourIndex,
            );
        }

        this.requestUpdate();
    }

    toHomeScreen(e)
    {
        this.dispatchEvent(new CustomEvent("select", {
            detail: {route:"", auto: true}
        }));
    }
}