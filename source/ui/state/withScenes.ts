import { SceneProps } from "../composants/SceneCard";
import { Constructor, LitElement, property } from "lit-element";
import Notification from "@ff/ui/Notification";


export declare class SceneView{
  list : SceneProps[];
  fetchScenes():Promise<void>;
}

export function withScenes<T extends Constructor<LitElement>>(baseClass:T) : T & Constructor<SceneView> {
  class SceneView extends baseClass{
    @property()
    list : SceneProps[];
    #loading = new AbortController();
 
    public connectedCallback(): void {
        super.connectedCallback();
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
  }
  return SceneView;
}