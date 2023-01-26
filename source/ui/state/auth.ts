
import HttpError from "./HttpError";
import StateChangeEvent from "./StateChangeEvent";

const LOGIN_STATE = "login-state";

export interface UserSession{
  username :string;
  isAdministrator :boolean;
}

function setSession(s ?:UserSession){
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