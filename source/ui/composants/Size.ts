import { LitElement, property, customElement, html } from "lit-element";




export function formatBytes(bytes, si=true){
  const thresh = si ? 1000 : 1024;
  if(Math.abs(bytes) < thresh) {
      return bytes + ' B';
  }
  let units = si
      ? ['kB','MB','GB','TB','PB','EB','ZB','YB']
      : ['KiB','MiB','GiB','TiB','PiB','EiB','ZiB','YiB'];
  let u = -1;
  do {
      bytes /= thresh;
      ++u;
  } while(Math.abs(bytes) >= thresh && u < units.length - 1);
  return Math.round(bytes*100)/100 + ' '+units[u];
}


@customElement("b-size")
export default class Size extends LitElement{
  @property({type: Number})
  b :number;
  
  @property({type: Boolean})
  i :boolean = false;

  render(){
    return html`${formatBytes(this.b, !this.i)}`;
  }
}