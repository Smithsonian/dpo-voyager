
import { css, LitElement,customElement, property, html, TemplateResult, query } from "lit-element";
import "@ff/ui/Icon"


import styles from '!lit-css-loader?{"specifier":"lit-element"}!sass-loader!../styles.scss';

interface ModalOptions{
  header :TemplateResult|string;
  body:TemplateResult|string;
  buttons ?:TemplateResult|string;
  onClose ?:(ev :MouseEvent)=>any;
}

/**
 * Main UI view for the Voyager Explorer application.
 */
 @customElement("modal-dialog")
 export default class Modal extends LitElement implements ModalOptions
 {
    static _instance :Modal;
    static active = false;

    @property({attribute: false})
    header :TemplateResult|string
    @property({attribute: false})
    body:TemplateResult|string;
    @property({attribute: false})
    buttons ?:TemplateResult|string;

    @property()
    onClose :(ev :MouseEvent)=>any;


    constructor()
    {
        super();
        if(Modal._instance) throw new Error("Don't instantiate Modal using new. Use Modal.Instance instead");
        Modal._instance = this;
        this.addEventListener("click", (ev: MouseEvent):any => {
          if((ev as any).originalTarget == this){
            this.handleClose(ev);
          }
        });
    }

    static get Instance(){
      return Modal._instance ??= new Modal();
    }
    @query("dialog")
    dialog :HTMLDialogElement;

    static show({header, body, buttons, onClose} :ModalOptions){
      if(!this.Instance.dialog){
        console.error("Modal failed : ", header, body);
        alert("Modals not configured properly");
        return
      }
      if(this.Instance.dialog.open){
        console.warn("Overriding modal : ", this.Instance.header, this.Instance.body);
      }
      this.Instance.header = header;
      this.Instance.body = body;
      this.Instance.buttons = buttons;
      this.Instance.onClose = onClose;
      this.Instance.dialog.show();
      this.Instance.style.display = "block";
    }
    static close(){
      Modal.Instance.handleClose();
    }

    handleClose = (ev ?:MouseEvent):any => {
      this.dialog.close();
      this.style.display = "none";
      if(typeof this.onClose === "function") this.onClose(ev);
    };

    protected render() :TemplateResult {
      return html`<dialog id="modal" onclick="">
        <h2>${this.header}</h2>
        <div>${this.body}</div>
        <div>${this.buttons}</div>
        <button id="exit" @click=${this.handleClose}>
          <ff-icon name="close"></ff-icon>
        </button>
      </dialog>`;
    }

    static styles = [styles, css`
    :host{
      display: none;
      position: fixed;
      top: 0;
      bottom: 0;
      left: 0;
      right: 0;
      z-index: 999;
      background: rgba(0, 0, 0, 0.5);
    }
    dialog{
      top: max(100px, 15vh);
      min-width: 30vw;
      max-width: calc(100vw - 20px);
      border: none;
      background-color: var(--color-dark);
      color: var(--color-light);
      box-shadow: 0 1px 3px rgba(0,0,0,0.12),0 1px 2px rgba(0,0,0,0.24);
    }
    h2{
      color: var(--color-tertiary);
    }

    .ff-button.ff-control{
      color: white;
      background: var(--color-tertiary);
    }
    .ff-button.ff-control:hover{
      background: var(--color-secondary);
    }

    dialog >button#exit{
      position: absolute;
      top:10px;
      right:10px;
      width: 20px;
      height: 20px;
      padding:0;
      cursor: pointer;
    }
    dialog >button#exit svg{
      width:100%;
      height: 100%;
    }
    `];
 
 }