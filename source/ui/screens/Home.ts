import { css, customElement, property, html, TemplateResult, LitElement } from "lit-element";
import Notification from "@ff/ui/Notification";

import "client/ui/Spinner";
import "../composants/UploadButton";
import "./LandingPage";
import "../composants/SceneCard";
import "../composants/ListItem";

import i18n from "../state/translate";
import { UserSession, withUser } from "../state/auth";
import { repeat } from "lit-html/directives/repeat";

import "../composants/TaskButton";
import { withScenes, Scene, AccessType } from "../state/withScenes";



interface Upload{
    name :string;
}

/**
 * Main UI view for the Voyager Explorer application.
 */
 @customElement("home-page")
 export default class HomePage extends withScenes( withUser( i18n( LitElement )))
 {

    @property({type: Object})
    uploads :{[name :string]:{
        error ?:{code?:number,message:string},
        done :boolean,
        progress ?:number,
    }} = {};

    @property()
    dragover = false;

    @property({type: Boolean})
    compact :boolean = false;

    @property({type: Array, attribute: false})
    selection = [];

    get isUser(){
        return (this.user && !this.user.isDefaultUser);
    }

    access = ["read", "write", "admin"] as AccessType[];

    constructor()
    {
        super();
    }

    createRenderRoot() {
        return this;
    }

    public onLoginChange (u: UserSession|undefined){
        super.onLoginChange(u);
        this.fetchScenes();
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

    onSelectChange = (ev :Event)=>{
        let target = (ev.target as HTMLInputElement);
        let selected = target.checked;
        let name = target.name;
        this.selection = selected? [...this.selection, name] : this.selection.filter(n=>n !== name);
    }

    private renderScene(mode :string, scene:Scene|Upload){
        return html`<scene-card 
            cardStyle="grid" 
            .mode=${mode} 
            name=${scene.name} 
            .thumb=${(scene as Scene).thumb} 
            .time=${(("mtime" in scene)?scene.mtime: false)}
            access=${(("access" in scene)?((this.user?.isAdministrator)?"admin":scene.access): "none")}
        />`;
    }

    private renderSceneCompact(scene:Scene|Upload){
        return html`
            <a class="list-item" name="${scene.name}" href="/ui/scenes/${scene.name}/">
                ${"author" in scene? html`
                <span style="flex: 1 0 6rem;overflow: hidden;text-overflow: ellipsis">${scene.name}</span>
                <span style="flex: 0 5 auto; font-size:smaller">${scene.author}</span>
                <span style="flex: 1 0 5rem;overflow: hidden;text-align: right;; font-size:smaller">${new Date(scene.ctime).toLocaleString()}</span>
            `:scene.name}
            </a>
        `;
    }

    protected render() :TemplateResult {
        if(!this.isUser){
            return html`<landing-page></landing-page>`;
        }
        let mode = (this.user?"write":"read")
        if(!this.list){
            return html`<div style="margin-top:10vh"><sv-spinner visible/></div>`;
        }
        //All scenes where I am mentioned as a user, with read|write|admin sorted by last modified
        let scenes = this.list.sort((a, b) => new Date(b.mtime).valueOf() - new Date(a.mtime).valueOf());
        // Scenes where I am admin (max 4 last modified)
        let myScenes = scenes.filter((s:Scene)=> s.access.user == "admin").slice(0, 4);
        //Scenes where I can at least write (max 4 last created) - skipped if it has the same members as myScenes
        let recentScenes = this.list.filter((s:Scene)=> (s.access.user == "admin" || s.access.user == "write")).sort((a, b) => new Date(b.ctime).valueOf() - new Date(a.ctime).valueOf()).slice(0, 4 - Math.min(Object.keys(this.uploads).length, 4));
        
        let uploads = Object.keys(this.uploads).map(name=>({name}));
        
        return html`
        <h2>${this.t("info.homeHeader")}</h2>
        <div class="list-tasks" style="margin-bottom:1rem">
            <upload-button class="ff-button ff-control btn-primary" @change=${this.onUploadBtnChange}>
                ${this.t("ui.upload")}
            </upload-button>
            <a class="ff-button ff-control btn-primary" href="/ui/standalone/?lang=${this.language.toUpperCase()}">${this.t("info.useStandalone")}</a>
        </div>

        ${(this.list.length == 0 && Object.keys(this.uploads).length == 0)?null: html`
            ${(myScenes.length > 0) ? 
                html`
                <div class="section">
                    <h3>${this.t("ui.myScenes")}</h3>
                    <div class="list-grid" style="position:relative; margin-top:20px">
                        ${myScenes.map((scene)=>this.renderScene(mode, scene))}
                    </div>
                </div>
            `: null}
        ${(uploads.length === 0 && recentScenes.some(s=>myScenes.indexOf(s) == -1))? html`<div class="section">
                <h3>${this.t("ui.ctimeSection")}</h3>
                <div class="list-grid" style="position:relative;">
                ${repeat([
                    ...uploads,
                    ...recentScenes,
                ],({name})=>name , (scene)=>this.renderScene(mode, scene))}
                </div>
            </div>`: null}

        <div class="section">
            <h3>${this.t("ui.mtimeSection")}</h3>
            <div class="list list-items" style="position:relative;">
                ${repeat([
                    ...scenes.slice(0, 8),
                ],({name})=>name , (scene)=>this.renderSceneCompact(scene))}
            </div>
        </div>
        `}
    `}
    
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