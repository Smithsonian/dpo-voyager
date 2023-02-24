
import { LitElement, Constructor, property } from "lit-element";
import HttpError from "./HttpError";

const LOGIN_STATE = "login-state";

export interface UserSession{
  uid :number;
  username :string;
  email :string;
  isAdministrator :boolean;
  isDefaultUser: boolean;
}

export function setSession(s ?:UserSession){
  window.localStorage.setItem(LOGIN_STATE, (s && s.username)?JSON.stringify(s): "");
  window.dispatchEvent(new Event(LOGIN_STATE));
}

export async function doLogin(username :string, password :string) :Promise<void>{
  await fetch("/api/v1/login", {
    method: "POST",
    headers:{
      "Content-Type":"application/json",
      "Accept": "application/json",
    },
    body: JSON.stringify({
      username,
      password,
    })
  }).then(async r =>{
    await HttpError.okOrThrow(r);
    setSession(await r.json());
  });
}

export async function updateLogin(){
  let r = await fetch("/api/v1/login", {
    method : "GET",
    headers:{"Accept": "application/json"}
  });
  await HttpError.okOrThrow(r);
  let user = await r.json();
  console.log("User : ", user);
  setSession(user);
}

export async function doLogout(){
  let r = await fetch("/api/v1/logout", {
    method : "POST",
    headers:{"Accept": "application/json"}
  });
  await HttpError.okOrThrow(r);
  setSession();
}

export function getLogin() :UserSession|undefined{
  let user = window.localStorage.getItem(LOGIN_STATE);
  return ((user)?JSON.parse(user):undefined);
}


/**
 * callback is called at least once after registering
 */
export function onLogin(callback :(user :UserSession)=>any){
  window.addEventListener(LOGIN_STATE, ()=>{
    callback(getLogin());
  });
}
export function offLogin(callback){
  return window.removeEventListener(LOGIN_STATE, callback);
}



export declare class WithUser{
  public user :UserSession|undefined;
  public onLoginChange(u :UserSession|undefined):any;
}

export function withUser<T extends Constructor<LitElement>>(baseClass:T) : T & Constructor<WithUser> {

  class WithUser extends baseClass{
    @property({attribute: false, type: Object})
    public user :UserSession|undefined;
    connectedCallback(){
      super.connectedCallback();
      onLogin(this.onLoginCallback);
      this.onLoginCallback(getLogin());
    }

    disconnectedCallback(){
      super.disconnectedCallback();
      offLogin(this.onLoginCallback);
    }
    private onLoginCallback = (u :UserSession|undefined)=>{
      if(!u ||!this.user || !Object.keys(u).every(k=>u[k] === this.user[k])){
        this.onLoginChange(u);
        this.user = u;
      }
    }
    public onLoginChange(u:UserSession|undefined){}

  }
  return WithUser;
}
