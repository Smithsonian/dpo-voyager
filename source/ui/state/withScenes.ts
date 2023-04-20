
import { Constructor, LitElement, property } from "lit-element";
import Notification from "@ff/ui/Notification";

export interface Scene {
  /**ISO date string */
  ctime :string;
  /**ISO date string */
  mtime :string;
  author_id :number;
  author :string;
  id :number;
  name :string;
  thumb ?:string;
  access :AccessType;
}
export const AccessTypes = [
  null,
  "none",
  "read",
  "write",
  "admin"
] as const;

export type AccessType = typeof AccessTypes[number];


export declare class SceneView{
  list : Scene[];
  access ?:Array<AccessType>;
  match ?:string;
  fetchScenes():Promise<void>;
}

export function withScenes<T extends Constructor<LitElement>>(baseClass:T) : T & Constructor<SceneView> {
  class SceneView extends baseClass{
    @property()
    list : Scene[];
    
    #loading = new AbortController();

    access ?:Array<AccessType>;

    match ?:string;
 
    public connectedCallback(): void {
        super.connectedCallback();
        this.fetchScenes();
    }

    async fetchScenes(){
      this.#loading.abort();
      this.#loading = new AbortController();
      let url = new URL("/api/v1/scenes", window.location.href);
      if(this.match) url.searchParams.set("match", this.match);
      if(this.access?.length) this.access.forEach(a=>url.searchParams.append("access", a));
      fetch(url, {signal: this.#loading.signal}).then(async (r)=>{
          if(!r.ok) throw new Error(`[${r.status}]: ${r.statusText}`);
          this.list = (await r.json()) as Scene[];
      }).catch((e)=> {
          if(e.name == "AbortError") return;
          Notification.show(`Failed to fetch scenes list : ${e.message}`, "error");
      });
    }
  }
  return SceneView;
}