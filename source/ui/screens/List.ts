
import { css, customElement, property, html, TemplateResult, LitElement } from "lit-element";
import Notification from "@ff/ui/Notification";

import "client/ui/Spinner";
import "../composants/UploadButton";
import "./LandingPage";
import { SceneProps } from "../composants/SceneCard";
import i18n from "../state/translate";
import { UserSession, withUser } from "../state/auth";
import { repeat } from "lit-html/directives/repeat";

import "../composants/TaskButton";

/**
 * Main UI view for the Voyager Explorer application.
 */
 @customElement("corpus-list")
 export default class List extends withUser(i18n(LitElement))
 {
    @property()
    list : SceneProps[];

    @property({type: Object})
    uploads :{[name :string]:{
        error ?:{code?:number,message:string},
        done :boolean,
        progress ?:number,
    }} = {};

    @property()
    dragover = false;

    #loading = new AbortController();

    get isUser(){
        return (this.user && !this.user.isDefaultUser);
    }

    constructor()
    {
        super();
    }
    createRenderRoot() {
        return this;
    }
      
    public connectedCallback(): void {
        super.connectedCallback();
        this.fetchScenes();
    }
    public onLoginChange (u: UserSession|undefined){
        super.onLoginChange(u);
        this.fetchScenes();
    }
    async fetchScenes(){
        this.#loading.abort();
        this.#loading = new AbortController();
        fetch("/api/v1/scenes", {signal: this.#loading.signal}).then(async (r)=>{
            if(!r.ok) throw new Error(`[${r.status}]: ${r.statusText}`);
            this.list = (await r.json()) as SceneProps[];
        }).catch((e)=> {
            if(e.name == "AbortError") return;
            Notification.show(`Failed to fetch scenes list : ${e.message}`, "error");
        });
    }

    upload(file :File){
        console.log("Upload File : ", file);
        let sceneName = file.name.split(".").slice(0,-1).join(".");
    
        const setError = ({code, message})=>{
            Notification.show(`Can't  create ${sceneName}: ${message}`, "error", 4000);
            delete this.uploads[sceneName];
            this.uploads = {...this.uploads};
        }
        const setProgress = (n)=>{
            this.uploads = {...this.uploads, [sceneName]: {...this.uploads[sceneName], progress: n}};
        }
        const setDone = ()=>{
            this.fetchScenes().then(()=>{
                delete this.uploads[sceneName];
                this.uploads = {...this.uploads};                
            });
        }

        this.uploads = {...this.uploads, [sceneName]: {progress:0, done: false}};
        (async ()=>{
            let xhr = new XMLHttpRequest();
            xhr.onload = function onUploadDone(){
                if(xhr.status != 201 /*created*/){
                    setError({code: xhr.status, message: xhr.statusText});
                }else{
                    Notification.show(sceneName+" uploaded", "info");
                    setTimeout(setDone, 0);
                }
            }
    
            xhr.upload.onprogress = function onUploadProgress(evt){
                if(evt.lengthComputable){
                    console.log("Progress : ", Math.floor(evt.loaded/evt.total*100));
                    setProgress(Math.floor(evt.loaded/evt.total*100));
                }else{
                    setProgress(0);
                }
            }
            xhr.onerror = function onUploadError(){
                setError({code: xhr.status, message: xhr.statusText});
            }
    
            xhr.open('POST', `/api/v1/scenes/${sceneName}`);
            xhr.send(file);
        })();
    }

    protected render() :TemplateResult {
        if(!this.isUser){
            return html`<landing-page></landing-page>`;
        }
        let mode = (this.user?"write":"read")
        if(!this.list){
            return html`<div style="margin-top:10vh"><sv-spinner visible/></div>`;
        }else if (this.list.length == 0 && Object.keys(this.uploads).length == 0){
            return html`<div style="padding-bottom:100px;padding-top:20px;position:relative;" class="list-grid" >
                <h1>No scenes available</h1>
                ${this.dragover ?html`<div class="drag-overlay">Drop item here</div>`:""}
            </div>`;
        }
        return html`
            <div class="list-tasks">
                <task-button><upload-button @change=${this.onUploadBtnChange}>
                    ${this.t("ui.upload")}
                </upload-button></task-button>
                <task-button><a href="/voyager-story.html?resourceRoot=/&lang=${this.language.toUpperCase()}&mode=Standalone&referrer=/">${this.t("info.useStandalone")}</a></task-button>
            </div>
            <div class="list-grid" style="position:relative;">
            ${repeat([
                ...this.list,
                ...Object.keys(this.uploads).map(name=>({name})),
            ],({name})=>name , ({name}) => html`<scene-card .mode=${mode} name="${name}" />`)}
            ${this.dragover ?html`<div class="drag-overlay">Drop item here</div>`:""}
        </div>`;

    }

    ondragenter = (ev)=>{
        ev.preventDefault();
    }
    ondragleave = ()=>{
        this.dragover = false;
    }
    ondragover = (ev)=>{
        ev.preventDefault()
        if(this.isUser) this.dragover = true;
    }
    ondrop = (ev)=>{
        ev.preventDefault();
        if(!this.isUser) return;

        this.dragover = false;
        for(let item of [...ev.dataTransfer.items]){
            
            let file = item.getAsFile();
            if( !/\.glb$/i.test(file.name) || item.kind !== "file"){
                Notification.show(`${file.name} is not valid. This method only accepts .glb files` , "error", 4000);
                continue;
            };
            this.upload(file)
        }
    }

    onUploadBtnChange = (ev)=>{
        ev.preventDefault();
        for(let file of [...ev.detail.files]){
            if( !/\.glb$/i.test(file.name)){
                Notification.show(`${file.name} is not valid. This method only accepts .glb files` , "error", 4000);
                continue;
            };
            this.upload(file)
        }
    }
      
 }