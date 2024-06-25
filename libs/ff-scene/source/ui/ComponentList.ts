/**
 * FF Typescript Foundation Library
 * Copyright 2019 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import Component, { ComponentOrType, IComponentEvent } from "@ff/graph/Component";
import Node from "@ff/graph/Node";
import Graph from "@ff/graph/Graph";
import CSelection from "@ff/graph/components/CSelection";

import { customElement, property, PropertyValues } from "@ff/ui/CustomElement";
import List from "@ff/ui/List";

////////////////////////////////////////////////////////////////////////////////

type GraphOrNode = Graph | Node;

@customElement("ff-component-list")
class ComponentList<C extends Component = Component> extends List<C>
{
    @property({ attribute: false })
    scope: GraphOrNode = null;

    @property({ attribute: false })
    component: ComponentOrType<C> = null;

    private _scope: GraphOrNode = null;
    private _componentType: ComponentOrType<C> = null;

    private get _selection() {
        return this._scope.system.getMainComponent(CSelection, true);
    }

    protected firstConnected()
    {
        super.firstConnected();
        this.classList.add("ff-component-list");
    }

    protected connected()
    {
        super.connected();
        this.subscribe();
    }

    protected disconnected()
    {
        this.unsubscribe();
        super.disconnected();
    }

    protected update(props: PropertyValues)
    {
        this.subscribe();
        this.data = this._scope.components.getArray<C>(this._componentType);

        super.update(props);
    }

    protected renderItem(component: C)
    {
        return component.displayName;
    }

    protected isItemSelected(component: C): boolean
    {
        return this._selection.selectedComponents.contains(component);
    }

    protected subscribe()
    {
        this.unsubscribe();

        this._scope = this.scope;
        this._componentType = this.component;

        if (this._scope) {
            this._scope.components.on(this._componentType, this.onUpdateComponents, this);
            this._selection.selectedComponents.on(this._componentType, this.onSelectComponent, this);
        }
    }

    protected unsubscribe()
    {
        if (this._scope) {
            this._scope.components.off(this._componentType, this.onUpdateComponents, this);
            this._selection.selectedComponents.off(this._componentType, this.onSelectComponent, this);

            this._scope = null;
        }
    }

    protected onClickItem(event: MouseEvent, component: C)
    {
        this._selection.selectComponent(component, event.ctrlKey);
    }

    protected onClickEmpty(event: MouseEvent)
    {
        this._selection.clearSelection();
    }

    protected onUpdateComponents()
    {
        this.requestUpdate();
    }

    protected onSelectComponent(event: IComponentEvent<C>)
    {
        this.setSelected(event.object, event.add);
    }
}