
/**
 * Wrapper around the global Worker constructor to load CORS resources
 */
export class CORSWorker<T = any, U = any>{
    private _queue :[(res:T)=>unknown, (err:Error)=>unknown][] = [];
    private _worker: globalThis.Worker;
    // Have this only to trick Webpack into properly transpiling
    // the url address from the component which uses it
    constructor(scriptURL: string | URL, options?: WorkerOptions) {
      const b = new Blob([`importScripts("${scriptURL.toString()}");`], {
          type: 'application/javascript',
      });
      const url = URL.createObjectURL(b);
      try{
        this._worker = new Worker(url, options);
        this._worker.onmessage = (ev: MessageEvent<T>)=>{
          let [resolve] = this._queue.shift();
          resolve(ev.data)
        }
        this._worker.onerror = (ev: ErrorEvent)=>{
          let [_, reject] = this._queue.shift();
          reject(new Error(ev.message ?? "Unknown Web Worker error"));
        }
      }finally{
        URL.revokeObjectURL(url);
      }
    }

    getWorker(): Worker {
      return this._worker;
    }

    async send(data: U):Promise<T>{
      return new Promise((resolve, reject)=>{
        this._queue.push([resolve, reject]);
        this._worker.postMessage(data);
      });
    }
}