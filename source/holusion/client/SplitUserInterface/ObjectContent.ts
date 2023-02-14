import { Dictionary } from "@ff/core/types";
import CVLanguageManager from "client/components/CVLanguageManager";
import { customElement, property, html } from "@ff/ui/CustomElement";
import SystemView from "@ff/scene/ui/SystemView";
import uniqueId from "@ff/core/uniqueId";

export type Tab = [HTMLElement, HTMLElement, ()=>any];

@customElement("object-content")
export default class ObjectContent extends SystemView
{
    private _docTitles: Dictionary<string>=null;

    private _activeTabIndex=0;
    private _tabsId="";

    
    @property({ attribute: false })
    content: Tab[];

    @property()
    title :string;

    protected get language() {
        return this.system.getComponent(CVLanguageManager, true);
    }

    constructor(system, content:Tab[])
    {
        super(system);
        this._tabsId=uniqueId(6)
        this.content=content;

        this.onHeaderClick = this.onHeaderClick.bind(this);
    }

    protected firstConnected(): void 
    {
        this.classList.add("object-content");
    }

    protected render() 
    {

        const tabs=[]
        const content=[]
        let i=0;

        for(let [tab, title] of this.content)
        {
            const index=i;
            const selected=index==this._activeTabIndex;
            const activeTabClass=selected?" et-active":"";
            const idtab=`et-tab-${this._tabsId}-${index}`
            const idcontent=`object-content-${this._tabsId}-${index}`

            tabs.push(html`<li id="${idtab}" etindex=${index} role="tab" tabindex="${selected?0:-1}" aria-selected=${selected} aria-controls="${idcontent}" @click=${e=>this.onHeaderClick(e,index)}>
                ${title}
            </li>`);
            
            content.push(html`<div class="object-content${activeTabClass}" id=${idcontent} etindex=${index} aria-labelledby=${idtab} tabindex="0">${tab}</div>`);
            i++;
        }
        return html`
            <div class="object-nav-zone">
                <div class="home-button">
                    <ff-button icon="triangle-left" text="Retour vers la liste d'objets" title="${this.language.getLocalizedString("To home screen")}" @click=${this.onReturn}>
                    </ff-button>                
                </div>
                <div class="object-info">
                    <h1>${this.title}</h1>
                </div>
                <ol class="object-navbar" role="tablist">${tabs}</ol>
            </div>
            <div class="object-content-zone">${content}</div>
        `
    }

    updated(changedProperties)
    {
        super.updated(changedProperties);
    }
    

    onHeaderClick(event,index)
    {
        const tabs=this.querySelectorAll("ol.object-nav>li");
        const panels=this.querySelectorAll(".object-content");
        this._activeTabIndex=parseInt(index);
        for(let tab of tabs)
        {
            const id=tab.getAttribute("etindex");
            if(id==index)
            {
                tab.setAttribute("aria-selected","true")

            }
            else
            {
                tab.setAttribute("aria-selected","false")
            }
        }
        for(let panel of panels)
        {
            const id=panel.getAttribute("etindex");
            if(id==index)
            {
                panel.classList.add("et-active");
            }
            else
            {
                panel.classList.remove("et-active")
            }
        }

        const fn=this.content[index][2];
        if(fn) fn();
    }

    protected onReturn(e: MouseEvent)
    {
        e.stopPropagation();
        this.dispatchEvent(new CustomEvent("return"));
    }


}