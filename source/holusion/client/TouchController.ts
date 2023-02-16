import ManipTarget from "@ff/browser/ManipTarget";
import CustomElement, {
    customElement,
    html,
} from "@ff/ui/CustomElement";

@customElement("touch-controller")
export default class TouchController extends CustomElement
{

    protected manipTarget: ManipTarget;

    constructor()
    {
        super();
        this.manipTarget = new ManipTarget();

        this.addEventListener("pointerdown", this.manipTarget.onPointerDown);
        this.addEventListener("pointermove", this.manipTarget.onPointerMove);
        this.addEventListener("pointerup", this.manipTarget.onPointerUpOrCancel);
        this.addEventListener("pointercancel", this.manipTarget.onPointerUpOrCancel);
        this.ownerDocument.addEventListener("pointermove", this.manipTarget.onPointerMove);         // To catch out of frame drag releases
        this.ownerDocument.addEventListener("pointerup", this.manipTarget.onPointerUpOrCancel);     // To catch out of frame drag releases
        this.ownerDocument.addEventListener("pointercancel", this.manipTarget.onPointerUpOrCancel); // To catch out of frame drag releases
        this.addEventListener("wheel", this.manipTarget.onWheel);
        this.addEventListener("contextmenu", this.manipTarget.onContextMenu);
        this.addEventListener("keydown", this.manipTarget.onKeyDown);
    }


    protected firstConnected(): void {
        this.classList.add("touch-controller");
    }

    protected firstUpdated(_changedProperties: Map<string | number | symbol, unknown>): void {
        let view = ((this.getRootNode() as ShadowRoot).querySelector(".sv-content-view") as any)?.sceneView?.view;
        if(!view) console.warn('Could not find View in :', this.getRootNode());
        this.manipTarget.next = view;
    }

    protected render()
    {
        return html`<div class="zone-corner corner-topleft"></div>
        <div class="zone-corner corner-topright"></div>
        <div class="zone-corner corner-bottomleft"></div>
        <div class="zone-corner corner-bottomright"></div>`
    }
}