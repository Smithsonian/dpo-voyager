import ManipTarget from "@ff/browser/ManipTarget";
import CVDocumentProvider from "client/components/CVDocumentProvider";
import CVLanguageManager from "client/components/CVLanguageManager";
import DocumentView, { customElement, html } from "client/ui/explorer/DocumentView";

@customElement("touch-controller")
export default class TouchController extends DocumentView
{

    private _pointerIsDown=false;
    protected manipTarget: ManipTarget;

    private _currentPointers = new Array();
    private prevDiff = -1;
    
    protected get language() {
        return this.system.getComponent(CVLanguageManager, true);
    }

    constructor(system)
    {
        super(system);
        this.manipTarget = new ManipTarget();

        this.onPointerDown = this.onPointerDown.bind(this);
        this.onPointerMove = this.onPointerMove.bind(this);
        this.onPointerUpOrCancel = this.onPointerUpOrCancel.bind(this);
        this.onWheel = this.onWheel.bind(this);

        this.addEventListener("pointerdown", this.onPointerDown);
        this.addEventListener("pointermove", this.onPointerMove);
        this.addEventListener("pointerup", this.onPointerUpOrCancel);
        this.addEventListener("pointercancel", this.onPointerUpOrCancel);
        this.addEventListener("pointerout", this.onPointerUpOrCancel);
        this.addEventListener("wheel", this.onWheel);


        
    }


    protected firstConnected(): void {
        this.classList.add("touch-controler");
        //this.system.graph.components.on(CVAnnotationView, this.onAnnotationsComponent, this);
        //this.system.components.on(CVAnnotationView, this.onAnnotationsComponent, this);
    }

    protected render()
    {
        return html`<div class="zone-corner corner-topleft"></div>
        <div class="zone-corner corner-topright"></div>
        <div class="zone-corner corner-bottomleft"></div>
        <div class="zone-corner corner-bottomright"></div>`
    }

    onPointerDown(event:PointerEvent)
    {
        this._pointerIsDown=true;
        this._currentPointers.push(event)
        event.preventDefault();
    }

    onPointerMove(event: PointerEvent)
    {
        event.preventDefault();

        const orbitNav = this.system.getMainComponent(CVDocumentProvider).activeComponent.setup.navigation;
        if( (this._currentPointers.length == 1)&&orbitNav)
        {
            let newPitch=((orbitNav.ins.orbit.value[1]-(event.movementX/2) + 180) % 360) - 180;
            let newYaw=(orbitNav.ins.orbit.value[0]-(event.movementY/2) +180) %360 -180;
            orbitNav.ins.orbit.value[0]= newYaw;
            orbitNav.ins.orbit.value[1]= newPitch;
            orbitNav.ins.orbit.set();
        }

        // Find this event in the cache and update its record with this event
        for (var i = 0; i < this._currentPointers.length; i++) {
            if (event.pointerId == this._currentPointers[i].pointerId) {
            this._currentPointers[i] = event;
            break;
            }
        }
        
        // If two pointers are down, check for pinch gestures
        if (this._currentPointers.length == 2) {
            // Calculate the distance between the two pointers
            var curDiff = Math.abs(this._currentPointers[0].clientX - this._currentPointers[1].clientX);
        
            if (this.prevDiff > 0) {

                orbitNav.ins.offset.value[2]-=(curDiff-this.prevDiff)/25;
                orbitNav.ins.offset.set()
            }
        
            // Cache the distance for the next move event
            this.prevDiff = curDiff;
        }
    }

    onPointerUpOrCancel(event)
    {
        event.preventDefault();
        this._pointerIsDown=false;
        for (var i = 0; i < this._currentPointers.length; i++) {
            if (event.pointerId == this._currentPointers[i].pointerId) {
            this._currentPointers.splice(i,1)
            break;
            }
        }
        this.prevDiff =0
    }

    onWheel(event:WheelEvent)
    {
        event.preventDefault();

        const orbitNav = this.system.getMainComponent(CVDocumentProvider).activeComponent.setup.navigation;
        orbitNav.ins.offset.value[2]+=event.deltaY*.02
        orbitNav.ins.offset.set();
        //this.manipTarget.onWheel(event)
    }
}