import Notification from "@ff/ui/Notification";
import { LitElement } from "lit-element";
import { off } from "process";

import strings, { I18nDict, Language, LocalizedString } from "./strings";


let languages :Language[] = ["en", "fr"];

function getDefaultLanguage() :Language{
  return navigator.languages.find(l=>(languages.indexOf(l.split(/[-_]/)[0].toLowerCase() as any) !== -1)) as Language;
}

class EventEmitter<T>{
  #events :Record<string, ((data:T)=>any)[]> = {};
  on(name, listener) {
    this.#events[name] ??= [];
    this.#events[name].push(listener);
  }
  off(name, listener){
    if (!this.#events[name] || this.#events[name].length == 0) throw new Error(`No listener found for "${name}"`);
    let size = this.#events[name].length
    this.#events[name] = this.#events[name].filter(l => l !== listener);
    if(this.#events[name].length == size){
      throw new Error(`Couldn't find ${listener} in listeners for ${name}`);
    }
  }
  emit(name, data:T){
    this.#events[name].forEach(function(l){l(data); });
  }
}


export class Localization extends EventEmitter<{language :Language, loaded :boolean}>{
  static #instance;
  static get Instance() :Localization{
    return Localization.#instance ?? (Localization.#instance = new Localization());
  }
  #lang :Language;
  constructor(){
    super();
  }

  setLanguage(l:Language){
    if(this.language != l){
      window.localStorage.setItem("user-language", l);
      this.#lang = l;
      this.emit("update", {language: l, loaded: false })
    }
  }


  public get strings(){
    return strings;
  }
  public get language(){
    return this.#lang ?? (this.#lang = window.localStorage.getItem("user-language") as Language|undefined || getDefaultLanguage());;
  }

  interpolate(str :string, params :Record<string, any>){
    return str.replace(/\{([^=}]+)(?:=([^}]+))?\}/g, (m, name, defaultValue)=>{
      if((["number", "string"].indexOf(typeof params[name]) == -1 && params[name] !=null)&& typeof defaultValue !== "string"){
        console.warn(`Missing translation parameter for ${str} : ${name}`, params);
        return m;
      }
      return params[name] ?? defaultValue;
    });
  }

  getString(key :string, params:Record<string, any>={}){
    let parts = key.split(".");
    let currentRef :string|I18nDict = this.strings;
    for(let part of parts){
      currentRef = currentRef[part];
      if(!currentRef) break;
    }
    if(typeof currentRef !== "object" || typeof currentRef[ this.language ] !== "string") {
      console.warn(`Missing string translation in locale "${this.language}": "${key}"`, this.strings);
      return key;
    }
    let str :string = currentRef[this.language] as any;
    if(typeof params.count === "number" && 1 < params.count){
      str = currentRef[`${this.language}_plural`] as any 
        ?? this.interpolate(str, {plural: null});
    }
    str = this.interpolate(str, params);
    return str
  }
}



type Constructor<T = {}> = new (...args: any[]) => T;
export declare class I18n{
  /**
   * "ui.users" will return the string contained in {ui:{users:{fr:"Utilisateurs", en: "Users"}}}
   * 
   * values enclosed in `{}` are replaced if present in the parameter argument
   * a key can have a default value, like {name=foo}
   * @param key path to the requested string. Nested paths joined by a "."
   * @param params parameters given to the string interpolation
   */
  public t(key :string, params ?:Record<string, any>) :string;

  public get language():Language;
}
/**
 * Translation decorator
 */
export default function i18n<T extends Constructor<LitElement>>(baseClass:T) : T & Constructor<I18n> {

  class I18n extends baseClass{
    readonly #T = Localization.Instance;
    connectedCallback(){
      super.connectedCallback();
      this.#T.on("update", this.onTranslationChange);
    }
    disconnectedCallback(){
      super.disconnectedCallback();
      this.#T.off("update", this.onTranslationChange);
    }
    onTranslationChange = ()=>{
      this.requestUpdate();
    }
    t(key:string, params ?:Record<string, any>){
      return this.#T.getString(key, params);
    }
    get language(){
      return this.#T.language;
    }
  }
  return I18n;
}
